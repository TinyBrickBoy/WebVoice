import workletUrl from "./audio_processor.ts?worker&url";
import {type OpusDecoderSampleRate, OpusDecoderWebWorker} from "opus-decoder";

const SAMPLE_RATE = 48000 as OpusDecoderSampleRate; // samples per second
const FRAME_DURATION = 20 / 1000; // seconds
const FRAME_SIZE = SAMPLE_RATE * FRAME_DURATION;

const CHANNEL_TIMEOUT_TIME = 15 * 1000;

export type WorkletDestructor = {
    destruct: boolean,
}
export type AudioFrame = {
    samples: Float32Array,
    volume: number,
}
type ChannelData = {
    worklet: MessagePort;
    decoder: OpusDecoderWebWorker<typeof SAMPLE_RATE>;
    lastTouch: number;
}

export default class AudioPlayer {

    private ctx?: AudioContext;
    private readonly channels: { [channel: string]: ChannelData } = {};

    private async closeChannel(channel: string) {
        const data = this.channels[channel];
        if (data) {
            data.worklet.postMessage({destruct: true} as WorkletDestructor);
            await data.decoder.free();
            delete this.channels[channel];
        }
    }

    // periodically clean up unused channels to reduce
    // memory allocation and prevent accidental "leaks"
    public async runGarbageCollector() {
        const now = Date.now();
        for (const channel of Object.keys(this.channels)) {
            const data = this.channels[channel];
            if (now - data.lastTouch > CHANNEL_TIMEOUT_TIME) {
                await this.closeChannel(channel);
            }
        }
    }

    public async startContext() {
        if (this.ctx) {
            for (const channel of Object.keys(this.channels)) {
                await this.closeChannel(channel);
            }
            await this.ctx.suspend();
        }
        this.ctx = new AudioContext({
            sampleRate: SAMPLE_RATE,
            latencyHint: "balanced",
        });
        await this.ctx.audioWorklet.addModule(workletUrl);
    }

    private async resolveChannel(channel: string): Promise<ChannelData> {
        const existingData = this.channels[channel];
        if (existingData) {
            existingData.lastTouch = Date.now();
            return existingData;
        }
        // create audio worklet node for separate thread
        const node = new AudioWorkletNode(this.ctx!!, "pcm-processor", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [1],
        });
        node.connect(this.ctx!!.destination); // connect to default speaker
        // create opus decoder for a separate thread
        // each channel needs its own decoder, as the decoder keeps track of a state
        const decoder = new OpusDecoderWebWorker<typeof SAMPLE_RATE>({
            sampleRate: SAMPLE_RATE,
            channels: 1,
            streamCount: 1,
        });
        // reduce chance of race condition by saving data BEFORE waiting for WASM
        const data = {worklet: node.port, decoder, lastTouch: Date.now()};
        this.channels[channel] = data;
        await decoder.ready; // wait for opus decoder WASM to load
        return data;
    }

    public async playFrame(channel: string, volume: number, opus: Uint8Array) {
        if (!this.ctx) {
            throw new Error("Can't play frame before creation of audio context");
        }
        const data = await this.resolveChannel(channel);
        const audio = await data.decoder.decodeFrame(opus);

        // console.log("Turned " + opus.length + " opus bytes into " + audio.channelData[0].length + " samples");
        const frame = {samples: audio.channelData[0], volume} as AudioFrame;
        data.worklet.postMessage(frame);
    }
}