class AudioWorkerPassthrough extends AudioWorkletProcessor {

    public process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
    ): boolean {
        outputs[0] = inputs[0];
        return true; // do not GC!
    }
}

registerProcessor("audio-worker-passthrough", AudioWorkerPassthrough);
