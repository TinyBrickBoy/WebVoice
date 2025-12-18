import {FRAME_SIZE, SAMPLE_RATE} from "./audio_constants.ts";
import type {SRC} from "@alexanderolsen/libsamplerate-js/dist/src";
import type {ConverterType, create} from "@alexanderolsen/libsamplerate-js";

type LibSampleRateGlobal = {
    LibSampleRate: {
        create: typeof create,
        ConverterType: typeof ConverterType,
    }
}

type InitializationData = {
    senderPort: MessagePort, resample: boolean
}

class AudioQueueTransmitter extends AudioWorkletProcessor {

    private readonly samplesQueue: number[] = [];
    private senderPort: MessagePort | undefined;

    private resample: boolean = false;
    private libsamplerate?: SRC;
    private libsamplerateOut?: Float32Array;

    constructor() {
        super();
        this.port.addEventListener("message", ({data: {senderPort, resample}}: MessageEvent<InitializationData>) => {
            this.senderPort = senderPort;
            this.resample = resample;

            // initialize libsamplerate if wanted
            if (resample) {
                this.initLibsamplerate(sampleRate)
                    .catch(error => console.error(error));
            }
        });
    }

    private async initLibsamplerate(inputSampleRate: number) {
        const {create, ConverterType} = (globalThis as unknown as LibSampleRateGlobal).LibSampleRate;
        this.libsamplerate = await create(1, inputSampleRate, SAMPLE_RATE, {
            converterType: ConverterType.SRC_SINC_MEDIUM_QUALITY,
        });
    }

    public process(
        inputs: Float32Array[][],
        _outputs: Float32Array[][],
    ): boolean {
        const input = inputs[0][0]; // single channel input
        if (this.resample) {
            if (this.libsamplerate) {
                if (!this.libsamplerateOut) {
                    // allocate array which will be used as output of resample
                    const outFrameSize = input.length * (SAMPLE_RATE / sampleRate);
                    this.libsamplerateOut = new Float32Array(outFrameSize);
                }
                // do resample and fill output array
                this.libsamplerate.full(input, this.libsamplerateOut, {frames: 1});
                // push the entire output array to samples queue
                this.samplesQueue.push(...this.libsamplerateOut);
            }
        } else {
            // fill the samples queue with inputs
            this.samplesQueue.push(...input);
        }
        // if enough samples exist to send one frame, do it!
        if (this.samplesQueue.length >= FRAME_SIZE) {
            this.senderPort?.postMessage(this.samplesQueue.splice(0, FRAME_SIZE));
        }
        return true; // do not GC!
    }
}

registerProcessor("audio-queue-transmitter", AudioQueueTransmitter);
