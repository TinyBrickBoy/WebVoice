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
import type {VoiceSocket} from "../socket.ts";

export const DEFAULT_DEVICE_ID = "default";

const GAIN_MULTIPLIER = 0.2;

export const setupMicrophonePipeline = async (
    socket: VoiceSocket,
    ctx: AudioContext,
    deviceId: string,
    analyzers: AnalyserNode[],
    noiseReduction: boolean,
) => {
    // load WASM
    const rnnoiseWasmBinary = await loadRnnoise({
        url: rnnoiseWasmPath,
        simdUrl: rnnoiseWasmSimdPath,
    });

    // load worker modules
    await ctx.audioWorklet.addModule(noiseGateWorkletPath);
    if (noiseReduction) {
        await ctx.audioWorklet.addModule(rnnoiseWorkletPath);
    }
    await ctx.audioWorklet.addModule(audioQueueTransmitterWorkletUrl);

    // load microphone stream
    const constraints: MediaStreamConstraints = {
        audio: {
            echoCancellation: false,
            // TODO firefox doesn't support re-sampling?
            sampleRate: SAMPLE_RATE,
        },
    };
    if (deviceId !== DEFAULT_DEVICE_ID) {
        (constraints.audio as MediaTrackConstraints).deviceId = deviceId;
    }
    const micStream = await navigator.mediaDevices!!.getUserMedia(constraints);

    // convert to mono
    let node: AudioNode = new MediaStreamAudioDestinationNode(ctx, {channelCount: 1});
    ctx.createMediaStreamSource(micStream).connect(node);
    node = ctx.createMediaStreamSource((node as MediaStreamAudioDestinationNode).stream);
    if (analyzers.length > 0) {
        node = node.connect(analyzers.shift()!!);
    }

    if (noiseReduction) {
        // apply RNNoise
        node = node.connect(new RnnoiseWorkletNode(ctx, {
            wasmBinary: rnnoiseWasmBinary,
            maxChannels: 1,
        }));
        if (analyzers.length > 0) {
            node = node.connect(analyzers.shift()!!);
        }
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

    // send microphone input to server, opus-encoded
    const transmitterNode = new AudioWorkletNode(ctx, "audio-queue-transmitter", {
        numberOfInputs: 1,
        numberOfOutputs: 0,
    });
    node.connect(transmitterNode);

    // pre-allocate microphone opus encoder
    const encoder = new OpusEncoderWebWorker({sampleRate: SAMPLE_RATE, application: OpusApplication.VOIP});
    await encoder.ready;
    const frameSamples = new Float32Array(FRAME_SIZE * CHANNEL_COUNT);

    // create channel for receiving voice data from worker
    const channel = new MessageChannel();
    transmitterNode.port.postMessage(undefined, [channel.port2]);
    channel.port1.onmessage = async ({data}: MessageEvent<number[]>) => {
        frameSamples.set(data);

        const inputVol = getHighestAudioPercent(frameSamples);
        if (inputVol < 0.01) { // skip if quieter than 1%
            return;
        }

        const opus = await encoder.encodeFrame(frameSamples);
        socket.sendPacket(new InputSoundPacket(opus, noiseReduction));
    };

    return {
        setVolume: (volume: number) => gainNode.gain.value = (volume / 100) * GAIN_MULTIPLIER,
        free: async () => await encoder.free(),
    };
};
