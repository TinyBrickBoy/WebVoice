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

const GAIN_MULTIPLIER = 0.2;

export type MicrophoneController = {
    setVolume: (volume: number) => void,
    free: () => Promise<void>,
}

export const getMicrophoneStream = async (resampleManually: boolean, deviceId: string | null) => {
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
    const unregisterCallback = devices.getEvents().register("update_microphone_stream", async () => {
        // stop previous microphone stream tracks
        micStream.getTracks().forEach(track => track.stop());
        // fetch new microphone stream from browser api
        micStream = await getMicrophoneStream(resampleManually, devices.getMicrophoneId());
        // start sending microphone stream to our audio pipeline
        ctx.createMediaStreamSource(micStream).connect(firstNode);
    });

    let node: AudioNode = ctx.createMediaStreamSource(firstNode.stream);
    if (analyzers.length > 0) {
        node = node.connect(analyzers.shift()!!);
    }

    // create RNNoise worklet node
    const rnnoiseNode = new RnnoiseWorkletNode(ctx, {
        wasmBinary: rnnoiseWasmBinary,
        maxChannels: 1,
    });
    const rnnoiseUseNode = analyzers.length > 0
        ? rnnoiseNode.connect(analyzers.shift()!!) : rnnoiseNode;
    // TODO
    if (controls.noiseReduction) {
        node.connect(rnnoiseNode);
        node = rnnoiseUseNode;
    }

    // apply noise gate
    node = node.connect(new NoiseGateWorkletNode(ctx, {
        openThreshold: -50,
        closeThreshold: -60,
        holdMs: 150,
        maxChannels: 1,
    }));

    // change volume
    const gainNode = new GainNode(ctx, {gain: GAIN_MULTIPLIER});
    node = node.connect(gainNode);
    if (analyzers.length > 0) {
        node = node.connect(analyzers.shift()!!);
    }

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
    node.connect(transmitterNode);

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

    return {
        setVolume: (volume: number) => {
            gainNode.gain.value = (volume / 100) * GAIN_MULTIPLIER;
        },
        free: async () => {
            unregisterCallback();
            await encoder.free();
        },
    } as MicrophoneController;
};
