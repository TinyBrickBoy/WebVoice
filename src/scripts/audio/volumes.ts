import {EventManager} from "../util/events.ts";
import type {VoiceSocket} from "../socket.ts";
import {VolumePacket} from "../network/packets.ts";
import {uuidFromString} from "../util/uuid.ts";

export type VolumeType = "category" | "player" | "input" | "output";
type VolumeStorage = { [type in VolumeType]?: { [id: string]: number | undefined; }; };

export class VolumeManager extends EventManager {

    private readonly socket: VoiceSocket;
    private readonly volumes: VolumeStorage;

    constructor(socket: VoiceSocket) {
        super();
        this.socket = socket;
        const volumes = localStorage.getItem("volumes");
        this.volumes = volumes ? JSON.parse(volumes) : {};
        // send data to remote
        this.sendAll("category");
        this.sendAll("player");
    }

    private sendAll(type: "category" | "player") {
        const data = this.volumes[type];
        if (!data) {
            return; // no data
        }
        Object.entries(data).forEach(([id, value]) => {
            if (value !== undefined) {
                this.send(type, id, value);
            }
        });
    }

    private send(type: "category" | "player", id: string, volume: number) {
        this.socket.sendPacket(new VolumePacket(type, uuidFromString(id), volume));
    }

    private save() {
        localStorage.setItem("volumes", JSON.stringify(this.volumes));
    }

    public get(type: VolumeType, id: string): number {
        const typeData = this.volumes[type];
        const volume = typeData ? typeData[id] : 1;
        const defVolume = volume === undefined ? 1 : volume;
        return Math.min(2, Math.max(0, defVolume));
    }

    public set(type: VolumeType, id: string, volume: number, save: boolean = true) {
        let typeData = this.volumes[type];
        if (!typeData) {
            this.volumes[type] = typeData = {};
        }
        const noChange = typeData[id] === volume;
        typeData[id] = volume;
        if (save) {
            console.log("Saved volumes to local storage", type, id, volume * 100);
            this.save();
        }
        if (!noChange) {
            this.fire(new CustomEvent(type));
            if (type === "category" || type === "player") {
                this.send(type, id, volume);
            }
        }
    }
}
