class AudioWorkerPassthrough extends AudioWorkletProcessor {

    public process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
    ): boolean {
        const input = inputs[0][0];
        if (input) {
            outputs[0][0].set(input);
        }
        return true; // do not GC!
    }
}

registerProcessor("audio-worker-passthrough", AudioWorkerPassthrough);
