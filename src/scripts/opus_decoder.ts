import {CHANNEL_COUNT, type EncodedOpusData, FRAME_SIZE, SAMPLE_RATE} from "./audio_constants.ts";
import {Decoder} from "@native-bindings/libopus";

class OpusDecoderProcessor extends AudioWorkletProcessor {

    private readonly decoder = new Decoder(SAMPLE_RATE, CHANNEL_COUNT);
    private readonly pcmSamples = new Float32Array(FRAME_SIZE * CHANNEL_COUNT);
    private readonly samplesQueue: number[] = [];

    constructor() {
        super();
        this.port.onmessage = (event: MessageEvent<EncodedOpusData>) => {
            const data = event.data as EncodedOpusData;
            this.decoder.decodeFloat(data.data, data.data.length, this.pcmSamples, FRAME_SIZE, 0);
            // transform volume after decoding
            this.transformVolume(this.pcmSamples, data.volume);
            // append new audio samples to the queue
            this.samplesQueue.push(...this.pcmSamples);
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
