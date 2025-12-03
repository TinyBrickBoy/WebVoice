import {WEBSOCKET_URL} from "astro:env/client";

export const respondRedirect = (path: string = "/", status: number = 303) => {
    return new Response(null, {status, headers: {Location: path}});
};

export const TOKEN_LENGTH = 16;
const apiVersion = "v1";

export const constructSocketUrl = (token: string) => {
    return new URL(`${WEBSOCKET_URL}/${apiVersion}/socket/${token}`);
};

export const calculateAudioLevel = (samples: Float32Array, offset: number, length: number) => {
    let rms = 0; // root mean square (RMS) amplitude
    for (let i = offset; i < length; i++) {
        let sample = samples[i];
        rms += sample * sample;
    }

    let sampleCount = length / 2;
    rms = (sampleCount == 0) ? 0 : Math.sqrt(rms / sampleCount);
    return rms > 0 ? Math.min(Math.max(20 * Math.log10(rms), -127), 0) : -127;
};

export const getHighestAudioPercent = (samples: Float32Array) => {
    let highest = -127;
    for (let i = 0; i < samples.length; i += 100) {
        let level = calculateAudioLevel(samples, i, Math.min(i + 100, samples.length));
        if (level > highest) {
            highest = level;
        }
    }
    return (highest + 127) / 127;
};

export const pad = (num: number, amount: number) => String(num).padStart(amount, "0");
