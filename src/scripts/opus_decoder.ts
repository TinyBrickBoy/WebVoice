import {CHANNEL_COUNT, type EncodedOpusData, SAMPLE_RATE} from "./audio_constants.ts";
import {OpusDecoder} from "opus-decoder";

class OpusDecoderProcessor extends AudioWorkletProcessor {

    private readonly decoder = new OpusDecoder({sampleRate: SAMPLE_RATE, channels: CHANNEL_COUNT});
    private readonly samplesQueue: number[] = [];

    constructor() {
        super();
        this.port.onmessage = (event: MessageEvent<EncodedOpusData>) => {
            const data = event.data as EncodedOpusData;
            const pcmSamples = this.decoder.decodeFrame(data.data).channelData[0];
            // transform volume after decoding
            this.transformVolume(pcmSamples, data.volume);
            // append new audio samples to the queue
            this.samplesQueue.push(...pcmSamples);
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
