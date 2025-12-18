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
import {EventManager} from "../util/events.ts";

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

const injectAudioNode = (
    getNode: () => AudioNode | null,
    preNode: AudioNode,
    postNode: AudioNode,
) => {
    let node: AudioNode | null = null;

    const inject = () => {
        // break audio graph
        preNode.disconnect();
        node?.disconnect();

        node = getNode();
        if (node) {
            // node exists, redirect graph through it
            preNode.connect(node);
            node.connect(postNode);
        } else {
            // no node exists, bypass it
            preNode.connect(postNode);
        }
    };

    // initial injection
    inject();

    // return injection function, may be used to inject/uninject later
    return inject;
};

const injectAnalyzer = (
    microphone: AudioMicrophoneManager,
    index: number,
    preNode: AudioNode,
    postNode: AudioNode,
) => {
    return microphone.register(`analyzer_${index}`,
        injectAudioNode(() => microphone.analyzers[index], preNode, postNode),
    );
};

const setupMicrophonePipeline = async (
    socket: VoiceSocket,
    ctx: AudioContext,
    controls: AudioControls,
    devices: AudioDeviceManager,
    volumes: VolumeManager,
    microphone: AudioMicrophoneManager,
    // firefox doesn't support automatic resampling, so we have to do it ourselves...
    resampleManually = /firefox/i.test(navigator.userAgent),
) => {
    // load WASM
    const rnnoiseWasmBinary = await loadRnnoise({
        url: rnnoiseWasmPath,
        simdUrl: rnnoiseWasmSimdPath,
    });

    // load worker modules
    await ctx.audioWorklet.addModule(noiseGateWorkletPath);
    // even though noise reduction is optional, always load RNNoise
    // to allow enabling/disabling it dynamically
    await ctx.audioWorklet.addModule(rnnoiseWorkletPath);
    if (resampleManually) {
        // add libsamplerate worklet to audio context, which will be
        // used in audio queue transmitter processor
        await ctx.audioWorklet.addModule(libSamplerateWorkletUrl);
    }
    await ctx.audioWorklet.addModule(audioQueueTransmitterWorkletUrl);

    // get initial mic stream and convert to mono
    let micStream = await getMicrophoneStream(resampleManually, devices.getMicrophoneId());
    const firstNode = new MediaStreamAudioDestinationNode(ctx, {channelCount: 1});
    ctx.createMediaStreamSource(micStream).connect(firstNode);

    // update if the device manager tells us to
    const freeCallbacks: (() => void)[] = [];
    freeCallbacks.push(devices.getEvents().register("update_microphone_stream", async () => {
        // stop previous microphone stream tracks
        micStream.getTracks().forEach(track => track.stop());
        // fetch new microphone stream from browser api
        micStream = await getMicrophoneStream(resampleManually, devices.getMicrophoneId());
        // start sending microphone stream to our audio pipeline
        ctx.createMediaStreamSource(micStream).connect(firstNode);
    }));

    // connect input node with rnnoise node
    let startNode = new AudioNode(); // create dummy node TODO does this passthrough?
    freeCallbacks.push(injectAnalyzer(microphone, 0, firstNode, startNode));

    // setup dynamic noise reduction
    const postRnnoiseNode = new AudioNode(); // TODO does this passthrough?
    freeCallbacks.push(...(await setupNoiseReduction(ctx, controls, rnnoiseWasmBinary, startNode, postRnnoiseNode)));

    const noiseGateNode = new NoiseGateWorkletNode(ctx, {
        openThreshold: -50,
        closeThreshold: -60,
        holdMs: 150,
        maxChannels: 1,
    });
    // connect post-rnnoise node with noise gate node
    freeCallbacks.push(injectAnalyzer(microphone, 1, postRnnoiseNode, noiseGateNode));

    const gainNode = new GainNode(ctx, {gain: GAIN_MULTIPLIER});
    // connect noise gate with gain node
    freeCallbacks.push(injectAnalyzer(microphone, 2, noiseGateNode, gainNode));

    // apply volume to pipeline and listen for updates from controller
    const applyVolume = () => {
        const volume = volumes.get("input", "");
        gainNode.gain.value = volume * GAIN_MULTIPLIER;
    };
    applyVolume();
    freeCallbacks.push(volumes.register("input", () => applyVolume()));

    // setup packet transmitter at the end of the pipeline
    freeCallbacks.push(await setupTransmitter(socket, controls, ctx, startNode, resampleManually));

    return () => freeCallbacks.forEach(fn => fn());
};

const setupNoiseReduction = async (
    ctx: AudioContext,
    controls: AudioControls,
    rnnoiseWasmBinary: ArrayBuffer,
    preNode: AudioNode,
    postNode: AudioNode,
) => {
    // create RNNoise worklet node
    const rnnoiseNode = new RnnoiseWorkletNode(ctx, {
        wasmBinary: rnnoiseWasmBinary,
        maxChannels: 1,
    });

    // inject rnnoise node (if enabled)
    const inject = injectAudioNode(
        () => controls.noiseReduction ? rnnoiseNode : null,
        preNode, postNode,
    );

    // listen for updates and pass down removal callbacks
    return [
        controls.register("update_noise_reduction", inject),
        () => rnnoiseNode.destroy(),
    ];
};

const setupTransmitter = async (
    socket: VoiceSocket,
    controls: AudioControls,
    ctx: AudioContext,
    lastNode: AudioNode,
    resampleManually: boolean,
) => {
    // create channel for receiving voice data from worker
    const channel = new MessageChannel();
    // send microphone input to server, opus-encoded
    const transmitterNode = new AudioWorkletNode(ctx, "audio-queue-transmitter", {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        processorOptions: {
            senderPort: channel.port2,
            resample: resampleManually,
        },
    });
    lastNode.connect(transmitterNode);

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

export class AudioMicrophoneManager extends EventManager {

    private readonly socket: VoiceSocket;
    private readonly devices: AudioDeviceManager;
    private readonly controls: AudioControls;
    private readonly volumes: VolumeManager;

    private ctx: AudioContext | null = null;
    private teardown: (() => void) | null = null;
    private _analyzers: AnalyserNode[] | null = null;

    constructor(
        socket: VoiceSocket,
        devices: AudioDeviceManager,
        controls: AudioControls,
        volumes: VolumeManager,
    ) {
        super();
        this.socket = socket;
        this.devices = devices;
        this.controls = controls;
        this.volumes = volumes;
    }

    public destroyContext() {
        if (this.teardown) {
            this.teardown();
            this.teardown = null;
        }
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

    public async createContext() {
        this.destroyContext();

        this.ctx = new AudioContext({
            sampleRate: SAMPLE_RATE,
            latencyHint: "interactive",
        });

        // if analyzers are non-null, setup audio analyzer array
        if (this._analyzers) {
            this.injectAnalyzers();
        }

        // create microphone audio node graph
        this.teardown = await setupMicrophonePipeline(this.socket, this.ctx,
            this.controls, this.devices, this.volumes, this);
    }

    private setupAudioAnalyzer() {
        const analyzer = this.ctx!!.createAnalyser();
        // magic values
        analyzer.fftSize = 256;
        analyzer.minDecibels = -90;
        analyzer.maxDecibels = -30;
        analyzer.smoothingTimeConstant = 0.7;
        // push to analyzers array
        if (!this._analyzers) {
            this._analyzers = [];
        }
        this._analyzers.push(analyzer);
        // fire event named by analyzer node index
        const nodeIndex = this._analyzers.length - 1;
        this.fire(new CustomEvent(`analyzer_${nodeIndex}`));
    }

    public injectAnalyzers() {
        if (!this.ctx) {
            // audio context isn't ready yet, just mark analyzers
            // as "existent" and wait for audio context creation
            this._analyzers = [];
        } else {
            // setup three analyzers: start, post noise reduction and post noise gate
            this.setupAudioAnalyzer();
            this.setupAudioAnalyzer();
            this.setupAudioAnalyzer();
        }
    }

    public uninjectAnalyzers() {
        if (!this._analyzers) {
            return; // already uninjected
        }
        // walk backwards through analyzer array and delete each analyzer node individually
        for (let nodeIndex = this._analyzers.length - 1; nodeIndex >= 0; nodeIndex--) {
            this._analyzers.pop(); // remove last element
            this.fire(new CustomEvent(`analyzer_${nodeIndex}`));
        }
        this._analyzers = null;
    }

    public hasContext() {
        return !!this.ctx;
    }

    public get analyzers() {
        return this._analyzers || [];
    }
}
