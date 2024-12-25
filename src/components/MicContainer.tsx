import noiseGateWorkletPath from "@sapphi-red/web-noise-suppressor/noiseGateWorklet.js?url";
import rnnoiseWorkletPath from "@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url";
import rnnoiseWasmPath from "@sapphi-red/web-noise-suppressor/rnnoise.wasm?url";
import rnnoiseWasmSimdPath from "@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm?url";
import type {FunctionComponent} from "preact";
import {useEffect, useMemo, useRef, useState} from "preact/hooks";
import {loadRnnoise, NoiseGateWorkletNode, RnnoiseWorkletNode} from "@sapphi-red/web-noise-suppressor";

export type VisualizerInitMessage = {
    canvas: HTMLCanvasElement;
}
export type VisualizerFrameMessage = {
    bufferLength: number;
    dataArray: Uint8Array;
}
export type VisualizerMessage = VisualizerInitMessage | VisualizerFrameMessage;

const setupAudioContext = async (ctx: AudioContext, deviceId: string | undefined, analyzers: AnalyserNode[]) => {
    // load WASM
    const rnnoiseWasmBinary = await loadRnnoise({
        url: rnnoiseWasmPath,
        simdUrl: rnnoiseWasmSimdPath,
    });

    // load worker modules
    await ctx.audioWorklet.addModule(noiseGateWorkletPath);
    await ctx.audioWorklet.addModule(rnnoiseWorkletPath);

    // load microphone stream
    const constraints: MediaStreamConstraints = {audio: {echoCancellation: false}};
    if (deviceId) (constraints.audio as MediaTrackConstraints).deviceId = deviceId;
    const micStream = await navigator.mediaDevices!!.getUserMedia(constraints);

    // convert to mono
    const mono = new MediaStreamAudioDestinationNode(ctx, {channelCount: 1});
    ctx.createMediaStreamSource(micStream).connect(mono);
    const monoNode = ctx.createMediaStreamSource(mono.stream)
        .connect(analyzers.shift()!!);

    // change volume
    const gainedNode = monoNode
        .connect(new GainNode(ctx, {gain: 0.1}));

    // apply RNNoise
    const noisedNode = gainedNode
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
        }))
        .connect(new GainNode(ctx, {gain: 1}))
        .connect(analyzers.shift()!!);

    // apply "debug"
    // gatedNode.connect(ctx.destination);
};
const setupAudioAnalyzer = (ctx: AudioContext) => {
    const analyzer = ctx.createAnalyser();
    analyzer.fftSize = 256;
    analyzer.minDecibels = -90;
    analyzer.maxDecibels = -30;
    analyzer.smoothingTimeConstant = 0.7;
    return analyzer;
};

const MicContainer: FunctionComponent<{}> = (props) => {
    const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
    const [devices, setDevices] = useState<MediaDeviceInfo[] | undefined>(undefined);

    useEffect(() => {
        const timer = setTimeout(async () => {
            const foundDevices = await navigator.mediaDevices.enumerateDevices();
            const filteredDevices = foundDevices
                .filter(device => device.deviceId.length !== 0)
                .filter(device => device.kind === "audioinput");
            setDevices(filteredDevices);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const canvasRef = useRef<HTMLCanvasElement>();

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        const audioCtx = new AudioContext();
        const preNoiseAnalyzer = setupAudioAnalyzer(audioCtx);
        const postNoiseAnalyzer = setupAudioAnalyzer(audioCtx);
        const postGateAnalyzer = setupAudioAnalyzer(audioCtx);

        setupAudioContext(audioCtx, deviceId, [preNoiseAnalyzer, postNoiseAnalyzer, postGateAnalyzer]);
        let frameId: (number | undefined)[] = [undefined];

        const draw = () => {
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
                ctx.fillStyle = "red";
                ctx.fillRect(i * (barWidth - 1), canvas.height - preNoiseHeight, barWidth, preNoiseHeight - postNoiseHeight - postGateHeight);
                ctx.fillStyle = "blue";
                ctx.fillRect(i * (barWidth - 1), canvas.height - postNoiseHeight, barWidth, postNoiseHeight - postGateHeight);
                ctx.fillStyle = "white";
                ctx.fillRect(i * (barWidth - 1), canvas.height - postGateHeight, barWidth, postGateHeight);
            }
        };
        draw();

        return async () => {
            if (typeof frameId[0] !== "undefined") {
                cancelAnimationFrame(frameId[0]);
            }
            await audioCtx.close();
        };
    }, [canvasRef, deviceId]);

    return (
        <>
            <h2>Microphone</h2>
            <div style={{marginTop: "0.5em", display: "flex", flexDirection: "column", gap: "0.2em"}}>
                <div className={"input-entry"}>
                    <label>Input device</label>
                    {(!devices || devices.length < 1)
                        ? <span><em>Loading devices...</em></span>
                        :
                        <select value={deviceId} onChange={event => setDeviceId(event.currentTarget.value)}>
                            {devices.map(device => (
                                <option value={device.deviceId} key={device.deviceId}>{device.label}</option>
                            ))}
                        </select>
                    }
                </div>
                {/* @ts-ignore refs are broken*/}
                <canvas style={{height: "2em", width: "100%", borderRadius: "0.3em"}} ref={canvasRef}/>
            </div>
        </>
    );
};
export default MicContainer;