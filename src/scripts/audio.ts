import workletUrl from "./audio_processor.ts?worker&url";
import {type OpusDecoderSampleRate, OpusDecoderWebWorker} from "opus-decoder";

const SAMPLE_RATE = 48000 as OpusDecoderSampleRate; // samples per second
const FRAME_DURATION = 20 / 1000; // seconds
const FRAME_SIZE = SAMPLE_RATE * FRAME_DURATION;

export type WorkletDestructor = {
    destruct: boolean,
}
export type AudioFrame = {
    samples: Float32Array,
    volume: number,
}

export default class AudioPlayer {

    private decoder?: OpusDecoderWebWorker<typeof SAMPLE_RATE>;
    private ctx?: AudioContext;
    private readonly worklets: { [channel: string]: MessagePort } = {};

    public async startContext() {
        if (this.ctx) {
            Object.keys(this.worklets).forEach(channel => {
                const port = this.worklets[channel];
                port.postMessage({destruct: true} as WorkletDestructor);
                delete this.worklets[channel];
            });
            await this.ctx.suspend();
            this.decoder?.free();
            this.decoder = undefined;
        }
        this.ctx = new AudioContext({
            sampleRate: SAMPLE_RATE,
            latencyHint: "balanced",
        });
        this.decoder = new OpusDecoderWebWorker<typeof SAMPLE_RATE>({
            sampleRate: SAMPLE_RATE,
            channels: 1,
            streamCount: 1,
        });
        await this.decoder.ready;
        await this.ctx.audioWorklet.addModule(workletUrl);
    }

    private resolveWorklet(channel: string): MessagePort {
        const worklet = this.worklets[channel];
        if (worklet) {
            return worklet;
        }
        const node = new AudioWorkletNode(this.ctx!!, "pcm-processor", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [1],
        });
        node.connect(this.ctx!!.destination);
        this.worklets[channel] = node.port;
        return node.port;
    }

    public playFrame(channel: string, volume: number, samples: Uint8Array) {
        if (!this.ctx) {
            throw new Error("Can't play frame before creation of audio context");
        }
        this.decoder?.decodeFrame(samples).then(data => {
            const frame = {samples: data.channelData[0], volume} as AudioFrame;
            this.resolveWorklet(channel).postMessage(frame);
        });
    }
}