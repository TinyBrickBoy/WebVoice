import type {AudioFrame} from "./audio.ts";

class PCMProcessor extends AudioWorkletProcessor {

    private readonly samplesQueue: number[] = [];
    private destruct: boolean = false;

    constructor() {
        super();
        this.port.onmessage = async (event: MessageEvent<any>) => {
            if (typeof event.data.destruct !== "undefined") {
                this.destruct = event.data.destruct;
                return;
            }
            // decode with opus codec
            const frame = event.data as AudioFrame;
            // transform volume after decoding
            this.transformVolume(frame.samples, frame.volume);
            // append new audio samples to the queue
            this.samplesQueue.push(...frame.samples);
        };
    }

    private transformVolume(data: Float32Array, volume: number) {
        for (let i = 0, len = data.length; i < len; ++i) {
            data[i] *= volume * 10;
        }
    }

    public process(
        _inputs: Float32Array[][],
        outputs: Float32Array[][],
    ): boolean {
        const output = outputs[0][0]; // single channel output
        // fill the output buffer with queued samples or silence
        for (let i = 0; i < output.length; i++) {
            const sample =  this.samplesQueue.shift()
            if (!sample) break;
            output[i] = sample;
        }
        return !this.destruct;
    }
}

registerProcessor("pcm-processor", PCMProcessor);
