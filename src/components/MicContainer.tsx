import type {FunctionComponent} from "preact";
import {useEffect, useRef} from "preact/hooks";
import {SAMPLE_RATE} from "../scripts/audio/audio_constants.ts";
import {useVoiceStateContext} from "./VoiceStateProvider.tsx";
import {setupMicrophonePipeline} from "../scripts/audio/audio_mic.ts";

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
    const {socket: [socket], controls, devices, volumes} = useVoiceStateContext();

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

        setupMicrophonePipeline(socket, audioCtx, controls, devices, volumes, [preNoiseAnalyzer, postNoiseAnalyzer, postGateAnalyzer])
            .then(callback => {
                // check if teardown was triggered during setup
                if (tearDown[0]) {
                    callback();
                } else {
                    tearDownCalls.push(callback);
                }
            })
            .catch(error => console.error(error));

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
    }, [canvasRef, socket, devices, controls]);

    return (
        <>
            {/* @ts-ignore refs are broken*/}
            <canvas style={{height: "2em", width: "100%", borderRadius: "0.3em"}} ref={canvasRef}/>
        </>
    );
};
export default MicContainer;
