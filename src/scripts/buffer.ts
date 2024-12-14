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
    return buf.readBytes(byteLength).buffer.toString();
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

export const readByteArray = (buf: ByteBuffer): ArrayBuffer => {
    return buf.readBytes(readVarInt(buf)).toArrayBuffer(false);
};
export const writeByteArray = (buf: ByteBuffer, value: ArrayBuffer) => {
    writeVarInt(buf, value.byteLength);
    buf.writeBytes(value);
};

// why is this not a default method? seems strange...
export const readBoolean = (buf: ByteBuffer): boolean => {
    return buf.readByte() !== 0;
};
export const writeBoolean = (buf: ByteBuffer, value: boolean) => {
    buf.writeByte(value ? 1 : 0);
};