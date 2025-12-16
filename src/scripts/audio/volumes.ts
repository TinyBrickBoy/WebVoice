import {EventManager} from "../util/events.ts";

export type VolumeType = "category" | "player" | "input" | "output";
type VolumeStorage = { [type in VolumeType]?: { [id: string]: number | undefined; }; };

export class VolumeManager extends EventManager {

    private readonly volumes: VolumeStorage;

    constructor() {
        super();
        const volumes = localStorage.getItem("volumes");
        this.volumes = volumes ? JSON.parse(volumes) : {};
    }

    private save() {
        localStorage.setItem("volumes", JSON.stringify(this.volumes));
    }

    public get(type: VolumeType, id: string): number {
        const typeData = this.volumes[type];
        const volume = typeData ? typeData[id] : 1;
        const defVolume = volume === undefined ? 1 : volume;
        return Math.min(1, defVolume, Math.max(0, defVolume));
    }

    public set(type: VolumeType, id: string, volume: number, save: boolean = true) {
        let typeData = this.volumes[type];
        if (!typeData) {
            this.volumes[type] = typeData = {};
        }
        if (typeData[id] === volume) {
            return; // nothing changed
        }
        typeData[id] = volume;
        if (save) {
            this.save();
        }
        // fire volume updates
        this.fire(new CustomEvent(type));
    }
}
