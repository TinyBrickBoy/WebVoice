import {CHANNEL_COUNT, FRAME_SIZE, SAMPLE_RATE} from "./audio_constants.ts";
import {OpusApplication, OpusEncoder} from "@tjc/opus-encoder";

class OpusEncoderProcessor extends AudioWorkletProcessor {

    private readonly encoder = new OpusEncoder({sampleRate: SAMPLE_RATE, application: OpusApplication.VOIP});
    private readonly samplesQueue: number[] = [];
    private senderPort?: MessagePort;

    // pre-allocated, frequently written to
    private readonly frameSamples: Float32Array = new Float32Array(FRAME_SIZE * CHANNEL_COUNT);

    constructor() {
        super();
        this.port.onmessage = (event: MessageEvent<undefined>) => this.senderPort = event.ports[0];
    }

    private handleFrame(samples: number[]) {
        this.frameSamples.set(samples);
        this.senderPort!!.postMessage(this.encoder.encodeFrame(this.frameSamples));
    }

    public process(
        inputs: Float32Array[][],
        _outputs: Float32Array[][],
    ): boolean {
        const input = inputs[0][0]; // single channel input
        // fill the samples queue with inputs
        this.samplesQueue.push(...input);
        // if enough samples exist to send one frame, do it!
        if (this.samplesQueue.length >= FRAME_SIZE && this.senderPort) {
            this.handleFrame(this.samplesQueue.splice(0, FRAME_SIZE));
        }
        return true; // do not GC!
    }
}

registerProcessor("opus-encoder", OpusEncoderProcessor);
