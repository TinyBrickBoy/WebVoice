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

export const getMicrophoneStream = async (
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

export const setupMicrophonePipeline = async (
    socket: VoiceSocket,
    ctx: AudioContext,
    controls: AudioControls,
    devices: AudioDeviceManager,
    volumes: VolumeManager,
    analyzers: AnalyserNode[] = [],
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

    let node: AudioNode = firstNode;
    if (analyzers.length > 0) {
        node = node.connect(analyzers.shift()!!);
    }

    // apply noise gate
    const noiseGateNode = new NoiseGateWorkletNode(ctx, {
        openThreshold: -50,
        closeThreshold: -60,
        holdMs: 150,
        maxChannels: 1,
    });

    // setup noise reduction dynamically between "node" and "noiseGateNode"
    freeCallbacks.push(...(await setupNoiseReduction(ctx, controls, rnnoiseWasmBinary, node, noiseGateNode, analyzers)));

    // change volume
    const gainNode = new GainNode(ctx, {gain: GAIN_MULTIPLIER});
    node = noiseGateNode.connect(gainNode);
    if (analyzers.length > 0) {
        node = node.connect(analyzers.shift()!!);
    }

    // apply volume to pipeline and listen for updates from controller
    const applyVolume = () => {
        const volume = volumes.get("input", "");
        gainNode.gain.value = volume * GAIN_MULTIPLIER;
    };
    applyVolume();
    freeCallbacks.push(volumes.register("input", () => applyVolume()));

    // setup packet transmitter at the end of the pipeline
    freeCallbacks.push(await setupTransmitter(socket, controls, ctx, node, resampleManually));

    return () => freeCallbacks.forEach(fn => fn());
};

const setupNoiseReduction = async (
    ctx: AudioContext,
    controls: AudioControls,
    rnnoiseWasmBinary: ArrayBuffer,
    preNode: AudioNode,
    postNode: AudioNode,
    analyzers: AnalyserNode[] = [],
) => {

    // create RNNoise worklet node
    const rnnoiseInNode = new RnnoiseWorkletNode(ctx, {
        wasmBinary: rnnoiseWasmBinary,
        maxChannels: 1,
    });
    const rnnoiseOutNode = analyzers.length > 0
        ? rnnoiseInNode.connect(analyzers.shift()!!) : rnnoiseInNode;

    // apply noise reduction (if enabled) to pipeline and listen for updates from controller
    const applyNoiseReduction = (noiseReduction: boolean) => {
        // break pipeline
        preNode.disconnect();
        rnnoiseOutNode.disconnect();

        if (noiseReduction) {
            // pass audio through rnnoise and pipe back to normal processors
            preNode.connect(rnnoiseInNode);
            rnnoiseOutNode.connect(postNode);
        } else {
            // bypass rnnoise completely
            preNode.connect(postNode);
        }
    };
    applyNoiseReduction(controls.noiseReduction);
    const removalCallback = controls.register("update_noise_reduction",
        () => applyNoiseReduction(controls.noiseReduction));

    return [
        () => rnnoiseInNode.destroy(),
        removalCallback,
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

export class AudioMicrophoneManager {

    private readonly socket: VoiceSocket;
    private readonly devices: AudioDeviceManager;
    private readonly controls: AudioControls;
    private readonly volumes: VolumeManager;

    private ctx: AudioContext | null = null;
    private teardown: (() => void) | null = null;
    private analyzers: AnalyserNode[] = [];

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
        this.analyzers = [];
    }

    private setupAudioAnalyzer() {
        const analyzer = this.ctx!!.createAnalyser();
        // magic values
        analyzer.fftSize = 256;
        analyzer.minDecibels = -90;
        analyzer.maxDecibels = -30;
        analyzer.smoothingTimeConstant = 0.7;
        // push to analyzers array
        this.analyzers.push(analyzer);
    }

    public async createContext(analyze: boolean) {
        this.destroyContext();

        this.ctx = new AudioContext({
            sampleRate: SAMPLE_RATE,
            latencyHint: "interactive",
        });

        if (analyze) {
            // setup three analyzers: start, post noise reduction and post noise gate
            this.setupAudioAnalyzer();
            this.setupAudioAnalyzer();
            this.setupAudioAnalyzer();
        }

        // create microphone audio node graph
        this.teardown = await setupMicrophonePipeline(this.socket, this.ctx,
            this.controls, this.devices, this.volumes, this.analyzers);
    }
}
