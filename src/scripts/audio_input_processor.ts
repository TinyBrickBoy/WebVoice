import {FRAME_SIZE} from "./audio_constants.ts";

class AudioInputProcessor extends AudioWorkletProcessor {

    private readonly samplesQueue: number[] = [];
    private senderPort?: MessagePort;

    constructor() {
        super();
        this.port.onmessage = (event: MessageEvent<undefined>) => this.senderPort = event.ports[0];
    }

    public process(
        inputs: Float32Array[][],
        _outputs: Float32Array[][],
    ): boolean {
        const input = inputs[0][0]; // single channel input
        // fill the samples queue with inputs
        this.samplesQueue.push(...input);
        if (this.samplesQueue.length >= FRAME_SIZE && this.senderPort) {
            this.senderPort.postMessage(this.samplesQueue.splice(0, FRAME_SIZE));
        }
        return true;
    }
}

registerProcessor("input-processor", AudioInputProcessor);
