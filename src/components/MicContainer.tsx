import workletUrl from "../scripts/audio_visualizer.ts?worker&url";
import type {FunctionComponent} from "preact";
import {useEffect, useMemo, useRef} from "preact/hooks";

export type VisualizerInitMessage = {
    canvas: HTMLCanvasElement;
}
export type VisualizerFrameMessage = {
    bufferLength: number;
    dataArray: Uint8Array;
}
export type VisualizerMessage = VisualizerInitMessage | VisualizerFrameMessage;

const MicContainer: FunctionComponent<{}> = (props) => {
    const canvasRef = useRef<HTMLCanvasElement>();

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        const audioCtx = new AudioContext();
        const analyzer = audioCtx.createAnalyser();
        analyzer.fftSize = 64;
        analyzer.minDecibels = -90;
        analyzer.maxDecibels = -30;
        analyzer.smoothingTimeConstant = 0.85;

        navigator.mediaDevices!!.getUserMedia({audio: true})
            .then(stream => audioCtx.createMediaStreamSource(stream).connect(analyzer));

        const draw = () => {
            requestAnimationFrame(draw);

            const bufferLength = analyzer.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyzer.getByteFrequencyData(dataArray);

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";

            const barWidth = canvas.width / bufferLength;
            for (let i = 0; i < bufferLength; ++i) {
                const barHeight = dataArray[i];
                ctx.fillRect(i * (barWidth - 1), canvas.height - barHeight, barWidth, barHeight);
            }
        };
        draw();
    }, [canvasRef]);

    return (
        <>
            <h2>Microphone</h2>
            <div style={{marginTop: "0.5em", display: "flex", flexDirection: "column", gap: "0.2em"}}>
                <div className={"input-entry"}>
                    <label>Input device</label>
                    <select>
                        <option>Test</option>
                    </select>
                </div>
                {/* @ts-ignore refs are broken*/}
                <canvas style={{height: "2em", width: "100%", borderRadius: "0.3em"}} ref={canvasRef}/>
            </div>
        </>
    );
};
export default MicContainer;