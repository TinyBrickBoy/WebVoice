import audioQueueReceiverWorkletUrl from "./audio_queue_receiver.ts?worker&url";
import {CHANNEL_COUNT, SAMPLE_RATE} from "./audio_constants.ts";
import {OpusDecoderWebWorker} from "@minceraftmc/opus-decoder";
import type {VoiceSocket} from "../socket.ts";
import {AudioPacket, PositionUpdatePacket} from "../network/packets.ts";
import {type AudioQueueData, type Position3d, Vector3d} from "../types.ts";
import type {AudioDeviceManager} from "./audio_devices.ts";
import type {AudioControls} from "./audio_controls.ts";
import type {VolumeManager} from "./volumes.ts";

const GARBAGE_COLLECTOR_INTERVAL = 5 * 1000;
const CHANNEL_TIMEOUT_TIME = 15 * 1000;

type ChannelData = {
    worklet: MessagePort;
    decoder: OpusDecoderWebWorker<typeof SAMPLE_RATE>;
    node: AudioWorkletNode;
    lastTouch: number;
}

export default class AudioPlayer {

    private readonly controls: AudioControls;
    private readonly devices: AudioDeviceManager;
    private readonly volumes: VolumeManager;

    private ctx?: AudioContext;
    private readonly channels: { [channel: string]: ChannelData } = {};

    constructor(
        controls: AudioControls,
        devices: AudioDeviceManager,
        volumes: VolumeManager,
    ) {
        this.controls = controls;
        this.devices = devices;
        this.volumes = volumes;
    }

    private position: Position3d = {
        pos: new Vector3d(0, 0, 0),
        yaw: 0, pitch: 0,
    };

    private async closeChannel(channel: string) {
        const data = this.channels[channel];
        if (data) {
            data.node.disconnect();
            await data.decoder.free();
            delete this.channels[channel];
        }
    }

    public startGarbageCollector() {
        // run garbage collector periodically
        const timer = setInterval(() => this.runGarbageCollector(), GARBAGE_COLLECTOR_INTERVAL);
        return () => clearInterval(timer);
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

    public registerSpeakerListener() {
        return this.devices.register(
            "update_speaker",
            () => this.refreshSpeaker(),
        );
    }

    public refreshSpeaker() {
        if (this.ctx && "setSinkId" in this.ctx) {
            const speakerId = this.devices.getSpeakerId();
            const setSinkId = this.ctx.setSinkId as ((param: string | { type: "none" }) => Promise<void>);
            setSinkId.call(this.ctx, speakerId || "")
                .catch(error => console.error(error));
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
        await this.ctx.audioWorklet.addModule(audioQueueReceiverWorkletUrl);
        this.refreshSpeaker();
    }

    private async resolveChannel(channel: string): Promise<ChannelData> {
        const existingData = this.channels[channel];
        if (existingData) {
            existingData.lastTouch = Date.now();
            return existingData;
        }
        // create audio worklet node for separate thread
        const receiverNode = new AudioWorkletNode(this.ctx!!, "audio-queue-receiver", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            // although we only play mono audio, we use stereo for spatial audio calculation
            outputChannelCount: [2],
        });
        receiverNode.connect(this.ctx!!.destination); // connect to default speaker
        const decoder = new OpusDecoderWebWorker({sampleRate: SAMPLE_RATE, channels: CHANNEL_COUNT});
        // prevent race condition by saving data before waiting for WASM to load
        const data = {worklet: receiverNode.port, node: receiverNode, decoder, lastTouch: Date.now()};
        this.channels[channel] = data;
        await decoder.ready;
        return data;
    }

    public async playFrame(channel: string, volume: number, opus: Uint8Array, position: Vector3d | null) {
        if (!this.ctx) {
            throw new Error("Can't play frame before creation of audio context");
        } else if (this.controls.deafened) {
            return; // skip playing if deafened
        }
        const source = this.position;

        // get or create audio pipeline
        const data = await this.resolveChannel(channel);
        // decode opus audio frame to signed pcm audio frame
        const pcmAudio = await data.decoder.decodeFrame(opus);

        const frame = {data: pcmAudio.channelData[0], volume} as AudioQueueData;
        // set positional data if present
        if (position) {
            frame.source = source;
            frame.position = position;
        }
        // move audio frame to audio worklet processing
        data.worklet.postMessage(frame);
    }

    public registerSocket(socket: VoiceSocket) {
        return socket.registers()
            .register("audio", ({detail: packet}: CustomEvent<AudioPacket>) => {
                const outputVolume = this.volumes.get("output", "");
                const playerVolume = this.volumes.get("player", packet.senderId.name);
                const categoryVolume = packet.categoryId ? this.volumes.get("category", packet.categoryId.name) : 1;
                const totalVolume = outputVolume * playerVolume * categoryVolume;

                this.playFrame(packet.channelId.name, totalVolume, packet.audio, packet.position)
                    .catch(error => console.error(error));
            })
            .register("position_update", ({detail: {position, yaw, pitch}}: CustomEvent<PositionUpdatePacket>) => {
                this.position = {pos: position, yaw, pitch};
            })
            .callback();
    }
}
