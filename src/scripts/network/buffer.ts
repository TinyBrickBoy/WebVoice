import ByteBuffer from "bytebuffer";
import {UUID} from "../util/uuid.ts";
import type {Component} from "./component.ts";

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
const textEncoder = new TextEncoder();
export const writeString = (buf: ByteBuffer, value: string) => {
    const bytes = textEncoder.encode(value);
    writeVarInt(buf, bytes.length);
    // TODO why doesn't ByteBuffer#writeBytes work?
    for (let i = 0; i < bytes.length; ++i) {
        buf.writeUint8(bytes[i]);
    }
};

// why is this not a default method? seems strange...
export const readBoolean = (buf: ByteBuffer): boolean => {
    return buf.readByte() !== 0;
};
export const writeBoolean = (buf: ByteBuffer, value: boolean) => {
    buf.writeByte(value ? 1 : 0);
};

export const readByteArray = (buf: ByteBuffer): Uint8Array => {
    const length = readVarInt(buf);
    const array = new Uint8Array(length);
    for (let i = 0; i < length; ++i) {
        array[i] = buf.readUint8();
    }
    return array;
};
export const writeByteArray = (buf: ByteBuffer, value: Uint8Array) => {
    writeVarInt(buf, value.length);
    // TODO why doesn't ByteBuffer#writeBytes work?
    for (let i = 0; i < value.length; ++i) {
        buf.writeUint8(value[i]);
    }
};

export const readComponentJson = (buf: ByteBuffer): Component =>
    JSON.parse(readString(buf));
export const writeComponentJson = (buf: ByteBuffer, value: Component) =>
    writeString(buf, JSON.stringify(value));
