import {type DecodedPng} from "fast-png";

// inspired by https://www.jameslmilner.com/posts/converting-rgb-hex-hsl-colors/#hex-to-hsl
export const convertRgbToHsl = (red: number, green: number, blue: number) => {
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const lightness = (max + min) / 2;
    if (max === min) {
        return [0, 0, lightness * 100];
    }
    let hue = lightness;
    const delta = max - min;
    let saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
        case red:
            hue = (green - blue) / delta + (green < blue ? 6 : 0);
            break;
        case green:
            hue = (blue - red) / delta + 2;
            break;
        case blue:
            hue = (red - green) / delta + 4;
            break;
    }
    return [
        Math.round(hue * 60),
        Math.round(saturation * 100),
        Math.round(lightness * 100),
    ];
};

// inspired by https://www.jameslmilner.com/posts/converting-rgb-hex-hsl-colors/#hsl-to-hex
export const convertHslToRgb = (hue: number, saturation: number, lightness: number) => {
    const decLightness = lightness / 100;
    const a = (saturation * Math.min(decLightness, 1 - decLightness)) / 100;

    const redK = (hue / 30) % 12;
    const red = decLightness - a * Math.max(Math.min(redK - 3, 9 - redK, 1), -1);
    const greenK = (8 + hue / 30) % 12;
    const green = decLightness - a * Math.max(Math.min(greenK - 3, 9 - greenK, 1), -1);
    const blueK = (4 + hue / 30) % 12;
    const blue = decLightness - a * Math.max(Math.min(blueK - 3, 9 - blueK, 1), -1);
    return [Math.round(red * 255), Math.round(green * 255), Math.round(blue * 255)];
};

export const packRgb = (red: number, green: number, blue: number) => {
    return ((red & 0xFF) << 16) | ((green & 0xFF) << 8) | (blue & 0xFF);
};

// as the data array has a varying "depth", we need to split words sometimes
export const getPaletteIndex = (image: DecodedPng, index: number) => {
    const depth = image.depth;
    if (depth === 16 || depth === 8) {
        return image.data[index];
    }
    const pixelsPerWord = 8 / depth;
    const wordIndex = (index / pixelsPerWord) | 0;
    const bitOffset = (index % pixelsPerWord) * depth;
    const word = image.data[wordIndex];
    const mask = (1 << depth) - 1;
    return (word >> (8 - bitOffset - depth)) & mask;
};

export const getAverageHSL = (image: DecodedPng, ignoreEdges = true): number[] => {
    let totalHue = 0;
    let totalSaturation = 0;
    let totalLightness = 0;
    let count = 0;

    const palette = image.palette;
    if (!palette) {
        throw new Error(`Expected color palette to be available for decoding ${image}`);
    }

    // console.log(image.width, image.height, pixelData);
    const pixels = image.width * image.height;
    for (let pixelIndex = 0; pixelIndex < pixels; ++pixelIndex) {
        const [red, green, blue] = palette[getPaletteIndex(image, pixelIndex)];

        // convert to HSL so we can "customize" how the average looks
        const [hue, saturation, lightness] = convertRgbToHsl(red / 255, green / 255, blue / 255);
        if (!ignoreEdges || lightness > 10 && lightness < (100 - 10)) {
            totalHue += hue;
            totalSaturation += saturation;
            totalLightness += lightness;
            count++;
        }
    }

    // redo everything without ignoring edges when we have missed at least 15% of all pixels
    if (ignoreEdges && count / pixels <= 0.85) {
        return getAverageHSL(image, false);
    }

    return [
        totalHue / count,
        totalSaturation / count,
        totalLightness / count,
    ];
};

export const boostVibrance = (hue: number, saturation: number, lightness: number) => {
    return [hue, Math.min(saturation * 1.15, 100), Math.min(lightness * 1.05, 100)];
};
