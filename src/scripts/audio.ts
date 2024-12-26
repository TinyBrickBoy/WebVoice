import opusDecoderWorkletUrl from "./opus_decoder.ts?worker&url";
import {CHANNEL_COUNT, type DecodedOpusData, SAMPLE_RATE} from "./audio_constants.ts";
import {OpusDecoderWebWorker} from "opus-decoder";

const CHANNEL_TIMEOUT_TIME = 15 * 1000;

type ChannelData = {
    worklet: MessagePort;
    decoder: OpusDecoderWebWorker<typeof SAMPLE_RATE>;
    node: AudioWorkletNode;
    lastTouch: number;
}

export default class AudioPlayer {

    private ctx?: AudioContext;
    private readonly channels: { [channel: string]: ChannelData } = {};

    private async closeChannel(channel: string) {
        const data = this.channels[channel];
        if (data) {
            data.node.disconnect();
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
            await this.ctx.close();
        }
        this.ctx = new AudioContext({
            sampleRate: SAMPLE_RATE,
            latencyHint: "balanced",
        });
        await this.ctx.audioWorklet.addModule(opusDecoderWorkletUrl);
    }

    private async resolveChannel(channel: string): Promise<ChannelData> {
        const existingData = this.channels[channel];
        if (existingData) {
            existingData.lastTouch = Date.now();
            return existingData;
        }
        // create audio worklet node for separate thread
        const node = new AudioWorkletNode(this.ctx!!, "opus-decoder", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [1],
        });
        node.connect(this.ctx!!.destination); // connect to default speaker
        const decoder = new OpusDecoderWebWorker({sampleRate: SAMPLE_RATE, channels: CHANNEL_COUNT});
        // reduce chance of race condition by saving data BEFORE waiting for WASM
        const data = {worklet: node.port, node, decoder, lastTouch: Date.now()};
        this.channels[channel] = data;
        await decoder.ready;
        return data;
    }

    public async playFrame(channel: string, volume: number, opus: Uint8Array) {
        if (!this.ctx) {
            throw new Error("Can't play frame before creation of audio context");
        }
        const data = await this.resolveChannel(channel);
        const pcmAudio = await data.decoder.decodeFrame(opus);
        const frame = {data: pcmAudio.channelData[0], volume: volume * 5} as DecodedOpusData;
        data.worklet.postMessage(frame);
    }
}