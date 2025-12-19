import type {Position3d, Vector3d} from "../types.ts";

const DEG_TO_RAD = Math.PI / 180;

// no proper ITD or ILD calculations, but good enough
export const convertSpatialToStereo = (
    input: Float32Array,
    outputLeft: number[],
    outputRight: number[],
    {pos: srcPos, yaw, pitch}: Position3d,
    listenerPos: Vector3d,
) => {
    let diffX = srcPos.x - listenerPos.x;
    let diffY = srcPos.y - listenerPos.y;
    let diffZ = srcPos.z - listenerPos.z;

    // rotate around y
    const cosYaw = Math.cos(yaw * -DEG_TO_RAD);
    const sinYaw = Math.sin(yaw * -DEG_TO_RAD);
    let lx = cosYaw * diffX - sinYaw * diffZ;
    let zz = sinYaw * diffX + cosYaw * diffZ;

    // rotate around x
    const cosPitch = Math.cos(pitch * -DEG_TO_RAD);
    const sinPitch = Math.sin(pitch * -DEG_TO_RAD);
    const ly = cosPitch * diffY - sinPitch * zz;
    const lz = sinPitch * diffY + cosPitch * zz;

    // distance attenuation
    const distance = Math.sqrt(lx * lx + ly * ly + lz * lz);
    const refDist = 1;
    const linearRolloff = 1;
    const distanceGain = refDist / (refDist + linearRolloff * Math.max(0, distance - refDist));

    // panning
    const pan = Math.atan2(lx, lz) / (Math.PI / 2);
    const angle = (pan + 1) * (Math.PI / 4);
    const leftGain = Math.abs(Math.cos(angle));
    const rightGain = Math.abs(Math.sin(angle));

    // calculate final gain
    const lg = leftGain * distanceGain;
    const rg = rightGain * distanceGain;

    for (let i = 0; i < input.length; i++) {
        outputLeft.push(input[i] * lg);
        outputRight.push(input[i] * rg);
    }
};
