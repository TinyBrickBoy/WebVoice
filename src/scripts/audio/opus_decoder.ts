import {type DecodedOpusData} from "./audio_constants.ts";

class OpusDecoderProcessor extends AudioWorkletProcessor {

    private readonly samplesQueue: number[] = [];

    constructor() {
        super();
        this.port.onmessage = (event: MessageEvent<DecodedOpusData>) => {
            const data = event.data as DecodedOpusData;
            // transform volume after decoding
            this.transformVolume(data.data, data.volume);
            // append new audio samples to the queue
            this.samplesQueue.push(...data.data);
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
        for (let i = 0; i < output.length; ++i) {
            const sample = this.samplesQueue.shift();
            if (!sample) {
                break;
            }
            output[i] = sample;
        }
        return true; // do not GC!
    }
}

registerProcessor("opus-decoder", OpusDecoderProcessor);
