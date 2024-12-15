import ByteBuffer from "bytebuffer";
import {UUID} from "./uuid.ts";
import type {Vector3d} from "./packets.ts";

// https://web.archive.org/web/20241130182130/https://wiki.vg/Data_types#Type:UUID
export const readUniqueId = (buf: ByteBuffer) => {
    return new UUID(buf.readLong(), buf.readLong());
};
export const writeUniqueId = (buf: ByteBuffer, value: UUID) => {
    buf.writeLong(value.most);
    buf.writeLong(value.least);
};

// https://web.archive.org/web/20241130182130/https://wiki.vg/Data_types#Type:VarInt
// https://web.archive.org/web/20241130182130/https://wiki.vg/Data_types#VarInt_and_VarLong
const SEGMENT_BITS = 0x7F;
const CONTINUE_BIT = 0x80;

export const readVarInt = (buf: ByteBuffer): number => {
    let value: number = 0;
    let position: number = 0;
    while (true) {
        let currentByte = buf.readByte();
        value |= (currentByte & SEGMENT_BITS) << position;
        if ((currentByte & CONTINUE_BIT) == 0) {
            break;
        }

        position += 7;
        if (position >= 32) {
            throw new Error("VarInt is too big");
        }
    }
    return value;
};
export const writeVarInt = (buf: ByteBuffer, value: number) => {
    while (true) {
        if ((value & ~SEGMENT_BITS) == 0) {
            buf.writeByte(value);
            return;
        }
        buf.writeByte((value & SEGMENT_BITS) | CONTINUE_BIT);
        value >>>= 7; // sign also gets shifted
    }
};

// https://web.archive.org/web/20241130182130/https://wiki.vg/Data_types#Type:String
export const readString = (buf: ByteBuffer): string => {
    const byteLength = readVarInt(buf);
    return buf.readUTF8String(byteLength); // FIXME not correct, the parameter excepts the amount of chars to read
};
export const writeString = (buf: ByteBuffer, value: string) => {
    const byteLength = Buffer.byteLength(value);
    writeVarInt(buf, byteLength);
    buf.writeBytes(value);
};

export const readVector3d = (buf: ByteBuffer): Vector3d => {
    return {
        x: buf.readDouble(),
        y: buf.readDouble(),
        z: buf.readDouble(),
    };
};
export const writeVector3d = (buf: ByteBuffer, value: Vector3d) => {
    buf.writeDouble(value.x);
    buf.writeDouble(value.y);
    buf.writeDouble(value.z);
};

// why is this not a default method? seems strange...
export const readBoolean = (buf: ByteBuffer): boolean => {
    return buf.readByte() !== 0;
};
export const writeBoolean = (buf: ByteBuffer, value: boolean) => {
    buf.writeByte(value ? 1 : 0);
};

const VOICE_CONVERSION_FACTOR = 1 << 15;
export const readVoiceData = (buf: ByteBuffer): Float32Array => {
    const length = readVarInt(buf) / 2;
    const array = new Float32Array(length);
    buf.LE();
    for (let i = 0; i < length; ++i) {
        array[i] = buf.readShort() / VOICE_CONVERSION_FACTOR;
    }
    buf.BE();
    return array;
};
export const writeVoiceData = (buf: ByteBuffer, value: Float32Array) => {
    writeVarInt(buf, value.length * 2);
    buf.LE();
    for (let i = 0; i < value.length; ++i) {
        buf.writeShort(value[i] * VOICE_CONVERSION_FACTOR);
    }
    buf.BE();
};