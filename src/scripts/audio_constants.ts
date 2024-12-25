import type {OpusDecoderSampleRate} from "opus-decoder";

export const SAMPLE_RATE = 48000 as OpusDecoderSampleRate; // samples per second
export const FRAME_DURATION = 20 / 1000; // seconds
export const FRAME_SIZE = SAMPLE_RATE * FRAME_DURATION;
export const FRAME_SIZE_BITS = FRAME_SIZE * 16;
