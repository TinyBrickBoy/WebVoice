import Long from "long";

const NIBBLES: Long[] = new Array(256);
["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"]
    .map(str => str.charCodeAt(0))
    .forEach((code, index) => NIBBLES[code] = new Long(index));

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"]
    .map(str => str.charCodeAt(0));
const SEPARATOR = "-".charCodeAt(0);

const parse4Nibbles = (name: string, pos: number): Long => {
    const ch1 = name.charCodeAt(pos);
    const ch2 = name.charCodeAt(pos + 1);
    const ch3 = name.charCodeAt(pos + 2);
    const ch4 = name.charCodeAt(pos + 3);
    return (ch1 | ch2 | ch3 | ch4) > 0xFF ? new Long(-1) :
        NIBBLES[ch1].shl(12).or(NIBBLES[ch2].shl(8)).or(NIBBLES[ch3].shl(4)).or(NIBBLES[ch4]);
};

// generates completely random uuid data, even ignoring version field, etc.
export const random32BitNumber = () => Math.floor(Math.random() * 0xFFFFFFFF);
export const random64BitNumber = () => new Long(random32BitNumber(), random32BitNumber());
export const randomUUID = () => new UUID(random64BitNumber(), random64BitNumber());

export const uuidFromString = (name: string): UUID => {
    const ch1 = name.charCodeAt(8);
    const ch2 = name.charCodeAt(13);
    const ch3 = name.charCodeAt(18);
    const ch4 = name.charCodeAt(23);
    if (ch1 === SEPARATOR && ch2 === SEPARATOR && ch3 === SEPARATOR && ch4 === SEPARATOR) {
        const msb1 = parse4Nibbles(name, 0);
        const msb2 = parse4Nibbles(name, 4);
        const msb3 = parse4Nibbles(name, 9);
        const msb4 = parse4Nibbles(name, 14);
        const lsb1 = parse4Nibbles(name, 19);
        const lsb2 = parse4Nibbles(name, 24);
        const lsb3 = parse4Nibbles(name, 28);
        const lsb4 = parse4Nibbles(name, 32);
        if (msb1.or(msb2).or(msb3).or(msb4).or(lsb1).or(lsb2).or(lsb3).or(lsb4).gte(0)) {
            return new UUID(
                msb1.shl(48).or(msb2.shl(32)).or(msb3.shl(16)).or(msb4),
                lsb1.shl(48).or(lsb2.shl(32)).or(lsb3.shl(16)).or(lsb4));
        }
    }
    throw new Error("Can't parse uuid " + name);
};

const formatUnsignedLong0 = (val: Long, shift: number, buf: number[], offset: number, len: number) => {
    let charPos = offset + len;
    const radix = 1 << shift;
    const mask = radix - 1;
    do {
        buf[--charPos] = DIGITS[val.and(mask).toInt()];
        val = val.shr(shift);
    } while (charPos > offset);
};

export const uuidToString = (most: Long, least: Long): string => {
    const buf: number[] = new Array(36);
    formatUnsignedLong0(least, 4, buf, 24, 12);
    formatUnsignedLong0(least.shr(48), 4, buf, 19, 4);
    formatUnsignedLong0(most, 4, buf, 14, 4);
    formatUnsignedLong0(most.shr(16), 4, buf, 9, 4);
    formatUnsignedLong0(most.shr(32), 4, buf, 0, 8);
    buf[23] = SEPARATOR;
    buf[18] = SEPARATOR;
    buf[13] = SEPARATOR;
    buf[8] = SEPARATOR;
    return String.fromCharCode(...buf);
};

export class UUID {

    public readonly most: Long;
    public readonly least: Long;
    public readonly name: string;

    constructor(most: Long, least: Long) {
        this.most = most;
        this.least = least;
        this.name = uuidToString(most, least);
    }
}
