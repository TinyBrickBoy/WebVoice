export type VolumeType = "category" | "player"
type VolumeStorage = { [type in VolumeType]?: { [id: string]: number; }; };

const loadVolumes = (): VolumeStorage => {
    const volumes = localStorage.getItem("volumes");
    if (volumes) {
        return JSON.parse(volumes);
    }
    return {};
};
const saveVolumes = (volumes: VolumeStorage) => {
    localStorage.setItem("volumes", JSON.stringify(volumes));
};
let volumes = loadVolumes();

export const getVolume = (type: VolumeType, id?: string): number => {
    const typeData = volumes[type];
    return typeData && id ? typeData[id] || 100 : 100;
};
export const setVolume = (type: VolumeType, id: string, volume: number, save: boolean = true) => {
    let typeData = volumes[type];
    if (!typeData) {
        volumes[type] = typeData = {};
    }
    typeData[id] = volume;
    if (save) {
        saveVolumes(volumes);
    }
};