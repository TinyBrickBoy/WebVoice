import type {FunctionComponent} from "preact";
import {useEffect, useRef, useState} from "preact/hooks";
import VolumeSlider from "./VolumeSlider.tsx";
import {SAMPLE_RATE} from "../scripts/audio/audio_constants.ts";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import {DEFAULT_DEVICE_ID, setupMicrophonePipeline} from "../scripts/audio/audio_mic.ts";

// TODO clean this shit mess up

const setupAudioAnalyzer = (ctx: AudioContext) => {
    const analyzer = ctx.createAnalyser();
    analyzer.fftSize = 256;
    analyzer.minDecibels = -90;
    analyzer.maxDecibels = -30;
    analyzer.smoothingTimeConstant = 0.7;
    return analyzer;
};

const MicContainer: FunctionComponent = () => {
    const {socket: [socket]} = useVoiceStateContext();

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

        setupMicrophonePipeline(socket, audioCtx, deviceId, [preNoiseAnalyzer, postNoiseAnalyzer, postGateAnalyzer], true)
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
