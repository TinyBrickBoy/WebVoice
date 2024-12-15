import type {AudioFrame, WorkletDestructor} from "./audio.ts";

class PCMProcessor extends AudioWorkletProcessor {

    private readonly samplesQueue: number[] = [];
    private destruct: boolean = false;

    constructor() {
        super();
        this.port.onmessage = (event: MessageEvent<any>) => {
            if (typeof event.data.destruct !== "undefined") {
                this.destruct = event.data.destruct;
            } else {
                // append new audio samples to the queue
                const frame = event.data as AudioFrame;
                this.transformVolume(frame.samples, frame.volume);
                this.samplesQueue.push(...frame.samples);
            }
        };
    }

    private transformVolume(data: Float32Array, volume: number) {
        for (let i = 0, len = data.length; i < len; ++i) {
            data[i] *= volume;
        }
    }

    public process(
        _inputs: Float32Array[][],
        outputs: Float32Array[][],
    ): boolean {
        const output = outputs[0][0]; // single channel output
        // fill the output buffer with queued samples or silence
        for (let i = 0; i < output.length; i++) {
            output[i] = this.samplesQueue.shift() || 0;
        }
        return !this.destruct;
    }
}

registerProcessor("pcm-processor", PCMProcessor);
