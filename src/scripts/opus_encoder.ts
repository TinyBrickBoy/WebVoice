import {CHANNEL_COUNT, FRAME_SIZE, SAMPLE_RATE} from "./audio_constants.ts";
import {Encoder, constants as opus} from "@native-bindings/libopus";

class OpusEncoderProcessor extends AudioWorkletProcessor {

    private readonly encoder = new Encoder(SAMPLE_RATE, CHANNEL_COUNT, opus.OPUS_APPLICATION_VOIP);
    private readonly samplesQueue: number[] = [];
    private senderPort?: MessagePort;

    // pre-allocated, frequently written to
    private readonly frameSamples: Float32Array = new Float32Array(FRAME_SIZE * CHANNEL_COUNT);
    private readonly opusData: Uint8Array = new Uint8Array(1024 * 2);

    constructor() {
        super();
        this.port.onmessage = (event: MessageEvent<undefined>) => this.senderPort = event.ports[0];
    }

    private handleFrame(samples: number[]) {
        this.frameSamples.set(samples);
        const encodedCount = this.encoder.encodeFloat(this.frameSamples, FRAME_SIZE, this.opusData, this.opusData.length);
        this.senderPort!!.postMessage(new Uint8Array(this.opusData, 0, encodedCount)); // post copy
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
