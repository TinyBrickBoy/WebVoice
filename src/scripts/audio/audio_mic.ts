import {CHANNEL_COUNT, FRAME_SIZE, SAMPLE_RATE} from "./audio_constants.ts";
import {loadRnnoise, NoiseGateWorkletNode, RnnoiseWorkletNode} from "@sapphi-red/web-noise-suppressor";
import {OpusApplication, OpusEncoderWebWorker} from "@minceraftmc/opus-encoder";
import {getHighestAudioPercent} from "../util/util.ts";
import {InputSoundPacket} from "../network/packets.ts";
import noiseGateWorkletPath from "@sapphi-red/web-noise-suppressor/noiseGateWorklet.js?url";
import rnnoiseWorkletPath from "@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url";
import rnnoiseWasmPath from "@sapphi-red/web-noise-suppressor/rnnoise.wasm?url";
import rnnoiseWasmSimdPath from "@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm?url";
import audioQueueTransmitterWorkletUrl from "./audio_queue_transmitter.ts?worker&url";
import libSamplerateWorkletUrl from "@alexanderolsen/libsamplerate-js/dist/libsamplerate.worklet.js?worker&url";
import type {VoiceSocket} from "../socket.ts";
import type {AudioControls} from "./audio_controls.ts";
import type {AudioDeviceManager} from "./audio_devices.ts";
import type {VolumeManager} from "./volumes.ts";

const GAIN_MULTIPLIER = 0.2;

const getMicrophoneStream = async (
    resampleManually: boolean,
    deviceId: string | null,
) => {
    // load microphone stream
    const audioConstraints: MediaTrackConstraints = {
        echoCancellation: false,
    };
    if (!resampleManually) {
        // sample rate so the browser automatically provides the correct sample rate
        audioConstraints.sampleRate = SAMPLE_RATE;
    }
    if (deviceId) {
        // the user requested to use a specific microphone
        audioConstraints.deviceId = deviceId;
    }
    return await navigator.mediaDevices!!.getUserMedia({audio: audioConstraints});
};

const setupMicrophonePipeline = async (
    socket: VoiceSocket,
    ctx: AudioContext,
    controls: AudioControls,
    devices: AudioDeviceManager,
    volumes: VolumeManager,
    microphone: AudioMicrophoneManager,
) => {
    const pipeline: AudioNode[] = [];
    const freeCallbacks: (() => void)[] = [];

    // clear pipeline on free
    freeCallbacks.push(() => pipeline.forEach(node => node.disconnect()));

    // get initial mic stream and convert to mono
    const micStream = await getMicrophoneStream(microphone.resampleManually, devices.getMicrophoneId());
    freeCallbacks.push(() => micStream.getTracks()
        .forEach(track => track.stop()));
    const monoDestNode = new MediaStreamAudioDestinationNode(ctx, {channelCount: 1});
    const micStreamNode = ctx.createMediaStreamSource(micStream);
    freeCallbacks.push(() => micStreamNode.disconnect());
    micStreamNode.connect(monoDestNode);

    // push microphone source as first entry in pipeline
    pipeline.push(ctx.createMediaStreamSource(monoDestNode.stream));
    microphone.analyzers[0] && pipeline.push(microphone.analyzers[0]);

    // apply rnnoise (if enabled)
    if (controls.noiseReduction) {
        const rnnoise = new RnnoiseWorkletNode(ctx, {
            wasmBinary: microphone.rnnoiseWasmBinary!!,
            maxChannels: 1,
        });
        pipeline.push(rnnoise);
        freeCallbacks.push(rnnoise.destroy.bind(rnnoise));
        microphone.analyzers[1] && pipeline.push(microphone.analyzers[1]);
    }

    // apply noise gate
    pipeline.push(new NoiseGateWorkletNode(ctx, {
        openThreshold: -50,
        closeThreshold: -60,
        holdMs: 150,
        maxChannels: 1,
    }));
    microphone.analyzers[2] && pipeline.push(microphone.analyzers[2]);

    // push gain modifier
    const gainNode = new GainNode(ctx, {gain: GAIN_MULTIPLIER});
    pipeline.push(gainNode);
    microphone.analyzers[3] && pipeline.push(microphone.analyzers[3]);

    // apply volume to pipeline and listen for updates from controller
    const applyVolume = () => {
        const volume = volumes.get("input", "");
        gainNode.gain.value = volume * GAIN_MULTIPLIER;
        console.log("Updated gain", volume * GAIN_MULTIPLIER);
    };
    applyVolume();
    freeCallbacks.push(volumes.register("input", () => applyVolume()));

    // setup packet transmitter at the end of the pipeline
    freeCallbacks.push(await pushTransmitter(socket, controls, ctx, pipeline, microphone.resampleManually));

    // connect all nodes in pipeline together
    for (let i = 1; i < pipeline.length; i++) {
        pipeline[i - 1].connect(pipeline[i]);
    }

    console.log("Audio pipeline nodes have been built", pipeline);
    return freeCallbacks;
};

const pushTransmitter = async (
    socket: VoiceSocket,
    controls: AudioControls,
    ctx: AudioContext,
    pipeline: AudioNode[],
    resampleManually: boolean,
) => {
    // create channel for receiving voice data from worker
    const channel = new MessageChannel();
    // send microphone input to server, opus-encoded
    const transmitterNode = new AudioWorkletNode(ctx, "audio-queue-transmitter", {
        numberOfInputs: 1,
        numberOfOutputs: 0,
    });
    transmitterNode.port.postMessage(resampleManually, [channel.port2]);
    pipeline.push(transmitterNode);

    // pre-allocate microphone opus encoder
    const encoder = new OpusEncoderWebWorker({sampleRate: SAMPLE_RATE, application: OpusApplication.VOIP});
    await encoder.ready;
    const frameSamples = new Float32Array(FRAME_SIZE * CHANNEL_COUNT);

    // receive voice frames from worker via messaging channel
    channel.port1.onmessage = async ({data}: MessageEvent<number[]>) => {
        if (controls.muted) {
            return; // don't send any data if muted
        }
        frameSamples.set(data);

        const inputVol = getHighestAudioPercent(frameSamples);
        if (inputVol < 0.01) { // skip if quieter than 1%
            return;
        }

        controls.lastSound = Date.now(); // abuse shared state
        const opus = await encoder.encodeFrame(frameSamples);
        socket.sendPacket(new InputSoundPacket(opus, controls.noiseReduction));
    };

    return () => {
        encoder.free().catch(error => console.error(error));
    };
};

export const ANALYZER_FFT_SIZE = 256;
// defined as half of the FFT size according to https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/frequencyBinCount
export const ANALYZER_FREQ_BIN_COUNT = ANALYZER_FFT_SIZE / 2;

export class AudioMicrophoneManager {

    private readonly socket: VoiceSocket;
    private readonly devices: AudioDeviceManager;
    private readonly controls: AudioControls;
    private readonly volumes: VolumeManager;

    // firefox doesn't support automatic resampling, so we have to do it ourselves...
    public readonly resampleManually = /firefox/i.test(navigator.userAgent);

    public rnnoiseWasmBinary: ArrayBuffer | null = null;

    private ctx: AudioContext | null = null;
    private teardown: (() => void)[] = [];
    private pipelineTeardown: (() => void)[] = [];
    private _analyzers: AnalyserNode[] | null = null;

    constructor(
        socket: VoiceSocket,
        devices: AudioDeviceManager,
        controls: AudioControls,
        volumes: VolumeManager,
    ) {
        this.socket = socket;
        this.devices = devices;
        this.controls = controls;
        this.volumes = volumes;

        this.teardown.push(devices.register("update_microphone_stream", this.rebuildPipeline.bind(this)));
        this.teardown.push(controls.register("update_noise_reduction", this.rebuildPipeline.bind(this)));
    }

    public triggerTeardown() {
        this.teardown.forEach(fn => fn());
        this.teardown = [];
        this.destroyContext();
    }

    public destroyContext() {
        this.pipelineTeardown.forEach(fn => fn());
        this.pipelineTeardown = [];

        if (this.ctx) {
            this.ctx.close()
                .catch(error => console.error(error));
            this.ctx = null;
        }
        if (this._analyzers) {
            // clear analyzers without firing event, audio context is destroyed anyway
            this._analyzers = [];
        }
    }

    // load audio worklet modules
    private async initializeContext(ctx: AudioContext) {
        await ctx.audioWorklet.addModule(noiseGateWorkletPath);
        // even though noise reduction is optional, always load RNNoise
        // to allow enabling/disabling it dynamically
        await ctx.audioWorklet.addModule(rnnoiseWorkletPath);
        if (this.resampleManually) {
            // add libsamplerate worklet to audio context, which will be
            // used in audio queue transmitter processor
            await ctx.audioWorklet.addModule(libSamplerateWorkletUrl);
        }
        await ctx.audioWorklet.addModule(audioQueueTransmitterWorkletUrl);
    }

    public async createContext() {
        this.destroyContext();

        if (!this.rnnoiseWasmBinary) {
            // load WASM binary
            this.rnnoiseWasmBinary = await loadRnnoise({
                url: rnnoiseWasmPath,
                simdUrl: rnnoiseWasmSimdPath,
            });
        }

        this.ctx = new AudioContext({
            sampleRate: this.resampleManually ? undefined : SAMPLE_RATE,
            latencyHint: "interactive",
        });
        await this.initializeContext(this.ctx);

        // setup microphone audio node pipeline
        this.rebuildPipeline();
    }

    public rebuildPipeline() {
        if (!this.ctx) {
            console.warn("Skipped pipeline rebuild, no audio context found");
            return;
        }
        console.log("Rebuilding audio pipeline...");

        // create new analyzer nodes
        this._analyzers && this.injectAnalyzers();

        setupMicrophonePipeline(this.socket, this.ctx!!,
            this.controls, this.devices, this.volumes, this)
            .then(teardown => {
                this.pipelineTeardown.forEach(fn => fn());
                this.pipelineTeardown = teardown;
            })
            .catch(error => console.error(error));
    }

    private setupAudioAnalyzer() {
        const analyzer = this.ctx!!.createAnalyser();
        // magic values, looks good enough
        analyzer.fftSize = 256;
        analyzer.minDecibels = -90;
        analyzer.maxDecibels = -30;
        analyzer.smoothingTimeConstant = 0.7;
        return analyzer;
    }

    public injectAnalyzers() {
        if (!this.ctx) {
            // audio context isn't ready yet, just mark analyzers
            // as "existent" and wait for audio context creation
            this._analyzers = [];
        } else {
            // setup three analyzers: start, post noise reduction, post noise gate and final
            this._analyzers = [0, 0, 0, 0].map(() => this.setupAudioAnalyzer());
        }
    }

    public uninjectAnalyzers() {
        if (this._analyzers) {
            this._analyzers = null;
        }
    }

    public hasContext() {
        return !!this.ctx;
    }

    public get analyzers() {
        return this._analyzers || [];
    }
}
