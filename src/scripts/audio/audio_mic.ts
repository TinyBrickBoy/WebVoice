import {SAMPLE_RATE} from "./audio_constants.ts";
import {loadRnnoise, NoiseGateWorkletNode, RnnoiseWorkletNode} from "@sapphi-red/web-noise-suppressor";
import noiseGateWorkletPath from "@sapphi-red/web-noise-suppressor/noiseGateWorklet.js?url";
import rnnoiseWorkletPath from "@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url";
import rnnoiseWasmPath from "@sapphi-red/web-noise-suppressor/rnnoise.wasm?url";
import rnnoiseWasmSimdPath from "@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm?url";
import type {AudioControls} from "./audio_controls.ts";
import type {AudioDeviceManager} from "./audio_devices.ts";
import type {VolumeManager} from "./volumes.ts";
import {EventManager} from "../util/events.ts";
import type {VoiceSocket} from "../socket.ts";

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

    // create final media stream which will be sent via webrtc
    const destNode = new MediaStreamAudioDestinationNode(ctx, {channelCount: 1});
    pipeline.push(destNode);

    // apply mute state instantly
    const applyMute = () => {
        destNode.stream.getTracks().forEach(track => track.enabled = !controls.muted);
    };
    applyMute();
    freeCallbacks.push(controls.register("update_muted", () => applyMute()));

    // TODO send own voice activity

    // connect all nodes in pipeline together
    for (let i = 1; i < pipeline.length; i++) {
        pipeline[i - 1].connect(pipeline[i]);
    }

    console.log("Audio pipeline nodes have been built", pipeline);
    return [freeCallbacks, destNode.stream] as [(() => void)[], MediaStream];
};

export const ANALYZER_FFT_SIZE = 256;
// defined as half of the FFT size according to https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/frequencyBinCount
export const ANALYZER_FREQ_BIN_COUNT = ANALYZER_FFT_SIZE / 2;

export class AudioMicrophoneManager extends EventManager {

    private readonly socket: VoiceSocket;
    private readonly devices: AudioDeviceManager;
    private readonly controls: AudioControls;
    private readonly volumes: VolumeManager;

    // firefox doesn't support automatic resampling, so we have to do it ourselves...
    public readonly resampleManually = /firefox/i.test(navigator.userAgent);

    public rnnoiseWasmBinary: ArrayBuffer | null = null;

    private _ctx: AudioContext | null = null;
    private teardown: (() => void)[] = [];
    private pipelineTeardown: (() => void)[] = [];
    private _analyzers: AnalyserNode[] | null = null;
    private _micStream: MediaStream | null = null;

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
        this._micStream?.getTracks().forEach(track => track.stop());
        this._micStream = null;

        if (this._ctx) {
            this._ctx.close()
                .catch(error => console.error(error));
            this._ctx = null;
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

        this._ctx = new AudioContext({
            sampleRate: this.resampleManually ? undefined : SAMPLE_RATE,
            latencyHint: "interactive",
        });
        await this.initializeContext(this._ctx);

        // setup microphone audio node pipeline
        this.rebuildPipeline();
    }

    public rebuildPipeline() {
        if (!this._ctx) {
            console.warn("Skipped pipeline rebuild, no audio context found");
            return;
        }
        console.log("Rebuilding audio pipeline...");

        // create new analyzer nodes
        this._analyzers && this.injectAnalyzers();

        setupMicrophonePipeline(this.socket, this._ctx!!, this.controls, this.devices, this.volumes, this)
            .then(([teardown, stream]) => {
                this.pipelineTeardown.forEach(fn => fn());
                this.pipelineTeardown = teardown;
                this._micStream = stream;
                this.fire(new CustomEvent("mic_stream_update"));
            })
            .catch(error => console.error(error));
    }

    private setupAudioAnalyzer() {
        const analyzer = this._ctx!!.createAnalyser();
        // magic values, looks good enough
        analyzer.fftSize = 256;
        analyzer.minDecibels = -90;
        analyzer.maxDecibels = -30;
        analyzer.smoothingTimeConstant = 0.7;
        return analyzer;
    }

    public injectAnalyzers() {
        if (!this._ctx) {
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
        return !!this._ctx;
    }

    public get ctx() {
        return this._ctx!!;
    }

    public get analyzers() {
        return this._analyzers || [];
    }

    public get micStream() {
        return this._micStream;
    }
}
