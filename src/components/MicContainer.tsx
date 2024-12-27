import noiseGateWorkletPath from "@sapphi-red/web-noise-suppressor/noiseGateWorklet.js?url";
import rnnoiseWorkletPath from "@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url";
import rnnoiseWasmPath from "@sapphi-red/web-noise-suppressor/rnnoise.wasm?url";
import rnnoiseWasmSimdPath from "@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm?url";
import opusEncoderWorkletUrl from "../scripts/opus_encoder.ts?worker&url";
import type {FunctionComponent} from "preact";
import {useEffect, useRef, useState} from "preact/hooks";
import {loadRnnoise, NoiseGateWorkletNode, RnnoiseWorkletNode} from "@sapphi-red/web-noise-suppressor";
import VolumeSlider from "./VolumeSlider.tsx";
import {CHANNEL_COUNT, FRAME_SIZE, SAMPLE_RATE} from "../scripts/audio_constants.ts";
import type {MicPacket} from "../scripts/packets.ts";
import {OpusApplication, OpusEncoderWebWorker} from "@tjc/opus-encoder";
import Long from "long";
import {getHighestAudioPercent} from "../scripts/util.ts";

export type VisualizerInitMessage = {
    canvas: HTMLCanvasElement;
}
export type VisualizerFrameMessage = {
    bufferLength: number;
    dataArray: Uint8Array;
}
export type VisualizerMessage = VisualizerInitMessage | VisualizerFrameMessage;

const GAIN_MULTIPLIER = 0.2;
const DEFAULT_DEVICE_ID = "default";

const setupAudioContext = async (
    ctx: AudioContext,
    deviceId: string,
    analyzers: AnalyserNode[],
    sendMic: (packet: MicPacket) => void,
) => {
    // load WASM
    const rnnoiseWasmBinary = await loadRnnoise({
        url: rnnoiseWasmPath,
        simdUrl: rnnoiseWasmSimdPath,
    });

    // load worker modules
    await ctx.audioWorklet.addModule(noiseGateWorkletPath);
    await ctx.audioWorklet.addModule(rnnoiseWorkletPath);
    await ctx.audioWorklet.addModule(opusEncoderWorkletUrl);

    // load microphone stream
    const constraints: MediaStreamConstraints = {
        audio: {
            echoCancellation: false,
            sampleRate: SAMPLE_RATE,
        },
    };
    if (deviceId !== DEFAULT_DEVICE_ID) (constraints.audio as MediaTrackConstraints).deviceId = deviceId;
    const micStream = await navigator.mediaDevices!!.getUserMedia(constraints);

    // convert to mono
    const mono = new MediaStreamAudioDestinationNode(ctx, {channelCount: 1});
    ctx.createMediaStreamSource(micStream).connect(mono);
    const monoNode = ctx.createMediaStreamSource(mono.stream)
        .connect(analyzers.shift()!!);

    // apply RNNoise
    const noisedNode = monoNode
        .connect(new RnnoiseWorkletNode(ctx, {
            wasmBinary: rnnoiseWasmBinary,
            maxChannels: 1,
        }))
        .connect(analyzers.shift()!!);

    // apply noise gate
    const gatedNode = noisedNode
        .connect(new NoiseGateWorkletNode(ctx, {
            openThreshold: -50,
            closeThreshold: -60,
            holdMs: 150,
            maxChannels: 1,
        }));

    // change volume
    const gainNode = new GainNode(ctx, {gain: GAIN_MULTIPLIER});
    const gainedNode = gatedNode.connect(gainNode)
        .connect(analyzers.shift()!!);

    // apply "debug"
    // gainedNode.connect(ctx.destination);

    // send microphone input to server, opus-encoded
    const inputNode = new AudioWorkletNode(ctx, "opus-encoder", {
        numberOfInputs: 1,
        numberOfOutputs: 0,
    });
    gainedNode.connect(inputNode);

    // pre-allocate microphone opus encoder
    const encoder = new OpusEncoderWebWorker({sampleRate: SAMPLE_RATE, application: OpusApplication.VOIP});
    await encoder.ready;
    const frameSamples = new Float32Array(FRAME_SIZE * CHANNEL_COUNT);

    // create communication channel for receiving voice data from worker
    const channel = new MessageChannel();
    inputNode.port.postMessage(undefined, [channel.port2]);
    let sequenceNumber = new Long(0);
    channel.port1.onmessage = async (event: MessageEvent<number[]>) => {
        frameSamples.set(event.data as number[]);
        const inputVol = getHighestAudioPercent(frameSamples);
        if (inputVol < 0.01) { // skip if quieter than 1%
            return;
        }

        const thisSequenceNumber = sequenceNumber.add(1);
        sequenceNumber = thisSequenceNumber;

        const opus = await encoder.encodeFrame(frameSamples);
        sendMic({data: opus, whispering: false, sequenceNumber: thisSequenceNumber});
    };

    return {
        setVolume: (volume: number) => gainNode.gain.value = (volume / 100) * GAIN_MULTIPLIER,
        free: async () => await encoder.free(),
    };
};
const setupAudioAnalyzer = (ctx: AudioContext) => {
    const analyzer = ctx.createAnalyser();
    analyzer.fftSize = 256;
    analyzer.minDecibels = -90;
    analyzer.maxDecibels = -30;
    analyzer.smoothingTimeConstant = 0.7;
    return analyzer;
};

const MicContainer: FunctionComponent<{ sendMic: (packet: MicPacket) => void }> = ({sendMic}) => {
    const [deviceId, setDeviceId] = useState<string>(DEFAULT_DEVICE_ID);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [deviceRefresh, setDeviceRefresh] = useState<number>(0);

    // apparently doesn't work when not saved wrapped inside an array... I don't know why
    const [volumeControl, setVolumeControl] = useState<((volume: number) => void)[]>([]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            const foundDevices = await navigator.mediaDevices.enumerateDevices();
            const filteredDevices = foundDevices
                .filter(device => device.deviceId.length !== 0)
                .filter(device => device.kind === "audioinput");
            setDevices(filteredDevices);
        }, 500);
        return () => clearTimeout(timer);
    }, [deviceRefresh]);

    const canvasRef = useRef<HTMLCanvasElement>();

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        const audioCtx = new AudioContext({
            sampleRate: SAMPLE_RATE,
            latencyHint: "interactive",
        });
        const preNoiseAnalyzer = setupAudioAnalyzer(audioCtx);
        const postNoiseAnalyzer = setupAudioAnalyzer(audioCtx);
        const postGateAnalyzer = setupAudioAnalyzer(audioCtx);

        let tearDown = [false];
        let tearDownCalls: (() => void)[] = [() => tearDown[0] = true];

        setupAudioContext(audioCtx, deviceId, [preNoiseAnalyzer, postNoiseAnalyzer, postGateAnalyzer], sendMic)
            .then(async controller => {
                // always free voice encoder
                if (tearDown[0]) {
                    return await controller.free();
                }
                setVolumeControl([controller.setVolume]);
                tearDownCalls.push(controller.free);

                // trigger device refresh, more permissions may have been assigned
                setDeviceRefresh(i => i + 1);
            });

        let frameId: (number | undefined)[] = [undefined];
        tearDownCalls.push(() => {
            if (typeof frameId[0] !== "undefined") {
                cancelAnimationFrame(frameId[0]);
            }
        });

        const draw = () => {
            if (tearDown[0]) return;
            frameId[0] = requestAnimationFrame(draw);

            const bufferLength = preNoiseAnalyzer.frequencyBinCount;
            const preNoiseData = new Uint8Array(bufferLength);
            preNoiseAnalyzer.getByteFrequencyData(preNoiseData);
            const postNoiseData = new Uint8Array(bufferLength);
            postNoiseAnalyzer.getByteFrequencyData(postNoiseData);
            const postGateData = new Uint8Array(bufferLength);
            postGateAnalyzer.getByteFrequencyData(postGateData);

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = canvas.width / bufferLength;
            for (let i = 0; i < bufferLength; ++i) {
                const preNoiseHeight = preNoiseData[i];
                const postNoiseHeight = postNoiseData[i];
                const postGateHeight = postGateData[i];
                ctx.fillStyle = "#f00";
                ctx.fillRect(i * barWidth, canvas.height - preNoiseHeight, barWidth + 1, preNoiseHeight - postNoiseHeight);
                ctx.fillStyle = "#0f0";
                ctx.fillRect(i * barWidth, canvas.height - postNoiseHeight, barWidth + 1, postNoiseHeight - postGateHeight);
                ctx.fillStyle = "#fff";
                ctx.fillRect(i * barWidth, canvas.height - postGateHeight, barWidth + 1, postGateHeight);
            }
        };
        draw();

        return async () => {
            tearDownCalls.forEach(fn => fn());
            await audioCtx.close();
        };
    }, [canvasRef, deviceId]);

    return (
        <>
            <h2>Microphone</h2>
            <div style={{marginTop: "0.5em", display: "flex", flexDirection: "column", gap: "0.2em"}}>
                <div className={"input-entry"}>
                    <label>Input device</label>
                    {devices.length < 1
                        ? <span><em>Loading devices...</em></span>
                        : <select value={deviceId} onChange={event => setDeviceId(event.currentTarget.value)}>
                            <option value={DEFAULT_DEVICE_ID}>Default Input Device</option>
                            {devices.map(device => (
                                <option value={device.deviceId} key={device.deviceId}>{device.label}</option>
                            ))}
                        </select>
                    }
                </div>
                <VolumeSlider type={"input"} name={deviceId} onUpdate={volume => {
                    if (volumeControl.length > 0) {
                        volumeControl[0](volume);
                    }
                }}/>
                {/* @ts-ignore refs are broken*/}
                <canvas style={{height: "2em", width: "100%", borderRadius: "0.3em"}} ref={canvasRef}/>
            </div>
        </>
    );
};
export default MicContainer;