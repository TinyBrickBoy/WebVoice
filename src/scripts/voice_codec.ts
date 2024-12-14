import ByteBuffer from "bytebuffer";
import type {
    AuthenticatePacket,
    GroupSoundPacket,
    LocationSoundPacket,
    MicPacket,
    PingPacket,
    PlayerSoundPacket,
} from "./packets.ts";
import {
    readByteArray,
    readString,
    readUniqueId,
    readVector3d,
    writeBoolean,
    writeByteArray,
    writeUniqueId,
} from "./buffer.ts";

type Encoder<T> = (buf: ByteBuffer, data: T) => void
type Decoder<T> = (buf: ByteBuffer) => T

const WHISPER_MASK = 0b1;
const HAS_CATEGORY_MASK = 0b10;

const encoderList: ({ key: string; encoder?: Encoder<any> } | undefined)[] = [
    {
        key: "mic", // 0x01
        encoder: (buf, data: MicPacket) => {
            writeByteArray(buf, data.data);
            writeBoolean(buf, data.whispering);
            buf.writeLong(data.sequenceNumber);
        },
    },
    undefined, // 0x02
    undefined, // 0x03
    undefined, // 0x04
    {
        key: "authenticate", // 0x05
        encoder: (buf, data: AuthenticatePacket) => {
            writeUniqueId(buf, data.player);
            writeUniqueId(buf, data.secret);
        },
    },
    undefined, // 0x06
    {
        key: "ping", // 0x07
        encoder: (buf, data: PingPacket) => {
            writeUniqueId(buf, data.id);
            buf.writeLong(data.timestamp);
        },
    },
    {
        key: "keep_alive", // 0x08
    },
    {
        key: "connection_check", // 0x09
    },
    undefined, // 0x0A
];
const decoderList: ({ key: string; decoder?: Decoder<any> } | undefined)[] = [
    undefined, // 0x01
    {
        key: "player_sound", // 0x02
        decoder: (buf): PlayerSoundPacket => {
            const channelId = readUniqueId(buf);
            const sender = readUniqueId(buf);
            const data = readByteArray(buf);
            const sequenceNumber = buf.readLong();
            const distance = buf.readFloat();

            const flag = buf.readByte();
            const whispering = (flag & WHISPER_MASK) !== 0;
            const category = (flag & HAS_CATEGORY_MASK) ? readString(buf) : undefined;
            return {channelId, sender, data, sequenceNumber, distance, whispering, category};
        },
    },
    {
        key: "group_sound", // 0x03
        decoder: (buf): GroupSoundPacket => {
            const channelId = readUniqueId(buf);
            const sender = readUniqueId(buf);
            const data = readByteArray(buf);
            const sequenceNumber = buf.readLong();

            const flag = buf.readByte();
            const category = (flag & HAS_CATEGORY_MASK) ? readString(buf) : undefined;
            return {channelId, sender, data, sequenceNumber, category};
        },
    },
    {
        key: "location_sound", // 0x04
        decoder: (buf): LocationSoundPacket => {
            const channelId = readUniqueId(buf);
            const sender = readUniqueId(buf);
            const location = readVector3d(buf);
            const data = readByteArray(buf);
            const sequenceNumber = buf.readLong();
            const distance = buf.readFloat();

            const flag = buf.readByte();
            const category = (flag & HAS_CATEGORY_MASK) ? readString(buf) : undefined;
            return {channelId, sender, data, sequenceNumber, category, location, distance};
        },
    },
    undefined, // 0x05
    {
        key: "authenticate_ack", // 0x06
    },
    {
        key: "ping", // 0x07
        decoder: (buf): PingPacket => {
            const id = readUniqueId(buf);
            const timestamp = buf.readLong();
            return {id, timestamp};
        },
    },
    {
        key: "keep_alive", // 0x08
    },
    undefined, // 0x09
    {
        key: "connection_check_ack", // 0x0A
    },
];

const encoders: { [key: string]: { packetId: number; encoder?: Encoder<any> } | undefined } = {};
encoderList.forEach((entry, index) => {
    if (entry) {
        const packetId = index + 1;
        encoders[entry.key] = {packetId: packetId, encoder: entry.encoder};
    }
});

export const encodeVoiceBuffer = (buf: ByteBuffer, packet: { key: string; packet: any }) => {
    const entry = encoders[packet.key];
    if (!entry) {
        throw new Error("No encoder registered for voice packet with key " + packet.key);
    }
    buf.writeByte(entry.packetId);
    if (entry.encoder) {
        entry.encoder(buf, packet.packet);
    }
};
export const decodeVoiceBuffer = (buf: ByteBuffer): { key: string; packet: any } => {
    const packetId = buf.readByte();
    const decoder = decoderList[packetId - 1];
    if (!decoder) {
        throw new Error("No decoder registered for voice packet with id 0x" + packetId.toString(16).toUpperCase());
    }
    const packet = decoder.decoder ? decoder.decoder(buf) : {};
    return {key: decoder.key, packet};
};