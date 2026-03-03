import {SAMPLE_RATE} from "./audio_constants.ts";
import type {VoiceSocket} from "../socket.ts";
import type {AudioDeviceManager} from "./audio_devices.ts";
import type {AudioMicrophoneManager} from "./audio_mic.ts";
import {ICE_SERVER, ICE_SERVER_AUTH, ICE_SERVER_USER} from "astro:env/client";
import {RtcIceCandidatePacket, RtcOfferPacket} from "../network/packets.ts";

export default class AudioPlayer {

    private readonly microphone: AudioMicrophoneManager;
    private readonly devices: AudioDeviceManager;

    private ctx: AudioContext | null = null;

    private peer: RTCPeerConnection | null = null;
    private remoteStream: MediaStream | null = null;
    private peerTeardown: (() => void)[] = [];

    constructor(
        microphone: AudioMicrophoneManager,
        devices: AudioDeviceManager,
    ) {
        this.microphone = microphone;
        this.devices = devices;
    }

    public registerMicListener() {
        return this.microphone.register("mic_stream_update", () => {
            if (this.peer) {
                const senders = [...this.peer.getSenders()];
                senders.forEach(sender => this.peer?.removeTrack(sender));
                const tracks = this.microphone.micStream?.getTracks();
                tracks?.forEach(track => this.peer?.addTrack(track));
            }
        });
    }

    public registerSpeakerListener() {
        return this.devices.register(
            "update_speaker",
            () => this.refreshSpeaker(),
        );
    }

    public startTasks(socket: VoiceSocket) {
        const micListenerCallback = this.registerMicListener();
        const speakerListenerCallback = this.registerSpeakerListener();
        const socketCallback = this.registerSocket(socket);
        return () => {
            micListenerCallback();
            speakerListenerCallback();
            socketCallback();
        };
    }

    public refreshSpeaker() {
        if (this.ctx && "setSinkId" in this.ctx) {
            const speakerId = this.devices.getSpeakerId();
            const setSinkId = this.ctx.setSinkId as ((param: string | { type: "none" }) => Promise<void>);
            setSinkId.call(this.ctx, speakerId || "")
                .catch(error => console.error(error));
        }
    }

    public destroyContext() {
        if (!this.ctx) {
            return; // no context
        }
        if (this.ctx !== this.microphone.ctx) {
            this.ctx.close()
                .catch(error => console.error(error));
        }
        this.ctx = null;
        this.destroyRtc();
    }

    public async createContext() {
        this.destroyContext();

        if (this.microphone.resampleManually) {
            this.ctx = new AudioContext({
                sampleRate: SAMPLE_RATE,
                latencyHint: "balanced",
            });
        } else {
            this.ctx = this.microphone.ctx;
        }

        this.refreshSpeaker();
    }

    private destroyRtc() {
        if (this.peer) {
            this.peerTeardown.forEach(callback => callback());
            this.peerTeardown = [];
            this.remoteStream?.getTracks().forEach(track => track.stop());
            this.remoteStream = null;
            this.peer.close();
            this.peer = null;
        }
    }

    public registerSocket(socket: VoiceSocket) {
        return socket.registers()
            .register("rtc_connect", async () => {
                if (this.peer) {
                    this.destroyRtc();
                }
                this.peer = new RTCPeerConnection({
                    iceServers: [{
                        urls: ICE_SERVER,
                        username: ICE_SERVER_USER,
                        credential: ICE_SERVER_AUTH,
                    }],
                });
                // handle tracks sent by remote peer
                this.peer.addEventListener("track", event => {
                    // create media source
                    this.remoteStream = new MediaStream([event.track]);
                    const source = this.ctx!.createMediaStreamSource(this.remoteStream);
                    // connect to sink
                    const output = this.ctx!.destination;
                    source.connect(output);
                    this.peerTeardown.push(() => source.disconnect(output));
                });
                // handle ice candidates
                this.peer.addEventListener("icecandidate", ({candidate}) => {
                    if (candidate) {
                        socket.sendPacket(new RtcIceCandidatePacket(candidate.candidate, candidate.sdpMid, candidate.sdpMLineIndex));
                    }
                });
                // log messages
                this.peer.addEventListener("negotiationneeded", async () => {
                    // create offer
                    const offer = await this.peer!.createOffer({offerToReceiveAudio: true});
                    await this.peer!.setLocalDescription(offer);
                    socket.sendPacket(new RtcOfferPacket(offer.type, offer.sdp ?? null));
                });
                // add microphone track
                const tracks = this.microphone.micStream?.getTracks();
                tracks?.forEach(track => this.peer?.addTrack(track));
                // create offer
                const offer = await this.peer.createOffer({offerToReceiveAudio: true});
                await this.peer.setLocalDescription(offer);
                socket.sendPacket(new RtcOfferPacket(offer.type, offer.sdp ?? null));
            })
            .register("rtc_offer", async ({detail: {type, sdp}}: CustomEvent<RtcOfferPacket>) => {
                await this.peer?.setRemoteDescription({
                    type: type as RTCSdpType,
                    sdp: sdp ?? undefined,
                });
            })
            .register("rtc_ice_candidate", async ({detail: packet}: CustomEvent<RtcIceCandidatePacket>) => {
                await this.peer?.addIceCandidate(new RTCIceCandidate({
                    candidate: packet.sdp ?? undefined,
                    sdpMid: packet.sdpMid,
                    sdpMLineIndex: packet.sdpMLineIndex,
                }));
            })
            .callback();
    }

    public getState() {
        return this.peer?.connectionState ?? null;
    }
}
