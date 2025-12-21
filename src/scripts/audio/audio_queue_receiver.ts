import type {AudioQueueData} from "../types.ts";
import {convertSpatialToStereo} from "./spatial_to_stereo.ts";
import {FRAME_SIZE} from "./audio_constants.ts";

const SAMPLE_QUEUE_LIMIT = FRAME_SIZE * 35;

class AudioQueueReceiver extends AudioWorkletProcessor {

    private readonly samplesQueueLeft: number[] = [];
    private readonly samplesQueueRight: number[] = [];

    constructor() {
        super();
        this.port.onmessage = ({data}: MessageEvent<AudioQueueData>) => {
            if (this.samplesQueueLeft.length > SAMPLE_QUEUE_LIMIT) {
                console.warn("Dropped frame, queue has too many entries", this.samplesQueueLeft.length, data.channel);
                return;
            }

            // transform volume after decoding
            this.transformVolume(data.data, data.volume);

            if (data.source && data.position) {
                // convert to spatial and add to queues
                convertSpatialToStereo(
                    data.data,
                    this.samplesQueueLeft, this.samplesQueueRight,
                    data.source, data.position,
                );
            } else {
                // statically append new audio samples to the queue
                this.samplesQueueLeft.push(...data.data);
                this.samplesQueueRight.push(...data.data);
            }
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
        const prevQueueLength = this.samplesQueueLeft.length;
        // stereo channel output
        const leftOutput = outputs[0][0];
        const rightOutput = outputs[0][1];
        // fill the output buffer with queued samples or silence
        for (let i = 0; i < leftOutput.length; ++i) {
            const leftSample = this.samplesQueueLeft.shift();
            const rightSample = this.samplesQueueRight.shift();
            if (leftSample === undefined || rightSample === undefined) {
                break;
            }
            leftOutput[i] = leftSample;
            rightOutput[i] = rightSample;
        }
        console.log(`Flushed ${prevQueueLength - this.samplesQueueLeft.length}/${this.samplesQueueLeft.length} samples`, sampleRate);
        return true; // do not GC!
    }
}

registerProcessor("audio-queue-receiver", AudioQueueReceiver);
