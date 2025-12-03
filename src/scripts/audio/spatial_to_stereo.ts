import type {Position3d, Vector3d} from "../types.ts";

const DEG_TO_RAD = Math.PI / 180;

// no proper ITD or ILD calculations, but good enough
export const convertSpatialToStereo = (
    input: Float32Array,
    outputLeft: number[],
    outputRight: number[],
    srcPos: Position3d,
    listenerPos: Vector3d,
) => {
    const diffX = srcPos.pos.x - listenerPos.x;
    const diffY = srcPos.pos.y - listenerPos.y;
    const diffZ = srcPos.pos.z - listenerPos.z;

    // rotate around y
    const cosYaw = Math.cos(srcPos.yaw * -DEG_TO_RAD);
    const sinYaw = Math.sin(srcPos.yaw * -DEG_TO_RAD);
    let lx = cosYaw * diffX - sinYaw * diffZ;
    let zz = sinYaw * diffX + cosYaw * diffZ;

    // rotate around x
    const cosPitch = Math.cos(srcPos.pitch * -DEG_TO_RAD);
    const sinPitch = Math.sin(srcPos.pitch * -DEG_TO_RAD);
    const ly = cosPitch * diffY - sinPitch * zz;
    const lz = sinPitch * diffY + cosPitch * zz;

    // distance attenuation
    const distance = Math.sqrt(lx * lx + ly * ly + lz * lz);
    const refDist = 1;
    const linearRolloff = 1;
    const distanceGain = refDist / (refDist + linearRolloff * Math.max(0, distance - refDist));

    const azimuth = Math.atan2(lx, lz);
    const leftGain = Math.cos(azimuth / 2);
    const rightGain = Math.sin(azimuth / 2);

    const norm = 1 / Math.sqrt(leftGain * leftGain + rightGain * rightGain);
    const lg = leftGain * norm * distanceGain;
    const rg = rightGain * norm * distanceGain;

    for (let i = 0; i < input.length; i++) {
        outputLeft.push(input[i] * lg);
        outputRight.push(input[i] * rg);
    }
};
