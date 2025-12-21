import {FRAME_SIZE, SAMPLE_RATE} from "./audio_constants.ts";
import type {SRC} from "@alexanderolsen/libsamplerate-js/dist/src";
import type {ConverterType, create} from "@alexanderolsen/libsamplerate-js";

type LibSampleRateGlobal = {
    LibSampleRate: {
        create: typeof create,
        ConverterType: typeof ConverterType,
    }
}

class AudioQueueTransmitter extends AudioWorkletProcessor {

    private readonly samplesQueue: number[] = [];
    private senderPort: MessagePort | undefined;

    private resample: boolean = true;
    private libsamplerate?: SRC;
    private libsamplerateOut?: Float32Array;

    constructor() {
        super();
        this.port.onmessage = ({data: resample, ports: [senderPort]}: MessageEvent<boolean>) => {
            this.senderPort = senderPort;
            this.resample = resample;

            // initialize libsamplerate if wanted
            if (resample && sampleRate !== SAMPLE_RATE) {
                this.initLibsamplerate(sampleRate)
                    .then(() => console.log("Finished initializing libsamplerate", sampleRate, SAMPLE_RATE))
                    .catch(error => console.error(error));
            } else {
                console.log(`Will assume samplerate of ${sampleRate} is already correct`);
            }
        };
    }

    private async initLibsamplerate(inputSampleRate: number) {
        const {create, ConverterType} = (globalThis as unknown as LibSampleRateGlobal).LibSampleRate;
        this.libsamplerate = await create(1, inputSampleRate, SAMPLE_RATE, {
            converterType: ConverterType.SRC_SINC_FASTEST,
        });
    }

    public process(
        inputs: Float32Array[][],
        _outputs: Float32Array[][],
    ): boolean {
        const input = inputs[0][0]; // single channel input
        if (!input) {
            return true; // no input
        }
        if (this.resample) {
            if (this.libsamplerate) {
                if (!this.libsamplerateOut) {
                    // allocate array which will be used as output of resample
                    const outFrameSize = Math.ceil(input.length * (SAMPLE_RATE / sampleRate));
                    this.libsamplerateOut = new Float32Array(outFrameSize);
                }
                // do resample and fill output array
                const outLength = {frames: 0}; // "frames" is a misleading name, this is the amount of samples
                this.libsamplerate.full(input, this.libsamplerateOut, outLength);
                // push all resampled samples to the samples queue
                this.samplesQueue.push(...this.libsamplerateOut.slice(0, outLength.frames));
            } else {
                console.warn("Skipped voice frame, libsamplerate not initialized yet");
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
