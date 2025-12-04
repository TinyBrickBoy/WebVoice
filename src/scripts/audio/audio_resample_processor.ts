import {SAMPLE_RATE} from "./audio_constants.ts";
import type {ConverterType, create} from "@alexanderolsen/libsamplerate-js";
import type {SRC} from "@alexanderolsen/libsamplerate-js/dist/src";

type LibSampleRateGlobal = {
    LibSampleRate: {
        create: typeof create,
        ConverterType: typeof ConverterType,
    }
}

class AudioResampleProcessor extends AudioWorkletProcessor {

    private libsamplerate?: SRC;

    constructor() {
        super();
        this.init(sampleRate)
            .catch(error => console.error(error));
    }

    private async init(inputSampleRate: number) {
        const {create, ConverterType} = (globalThis as unknown as LibSampleRateGlobal).LibSampleRate;
        this.libsamplerate = await create(1, inputSampleRate, SAMPLE_RATE, {
            converterType: ConverterType.SRC_SINC_MEDIUM_QUALITY,
        });
    }

    public process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
    ): boolean {
        const input = inputs[0][0]; // single channel input
        // if libsamplerate isn't loaded yet, just discard the input
        if (this.libsamplerate) {
            // TODO our outputs now have the wrong frame size
            this.libsamplerate.full(input, outputs[0][0], {frames: 1});
        }
        return true; // do not GC!
    }
}

registerProcessor("audio-resample-processor", AudioResampleProcessor);
