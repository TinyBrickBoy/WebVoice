import {type Component} from "../scripts/network/component.ts";
import type {FunctionComponent, JSX} from "preact";

interface Props extends JSX.HTMLAttributes {
    component: Component;
    noColor?: boolean;
}

const minecraftColors: Record<string, number> = {
    black: 0x000000,
    dark_blue: 0x0000AA,
    dark_green: 0x00AA00,
    dark_aqua: 0x00AAAA,
    dark_red: 0xAA0000,
    dark_purple: 0xAA00AA,
    gold: 0xFFAA00,
    gray: 0xAAAAAA,
    dark_gray: 0x555555,
    blue: 0x5555FF,
    green: 0x55FF55,
    aqua: 0x55FFFF,
    red: 0xFF5555,
    light_purple: 0xFF55FF,
    yellow: 0xFFFF55,
    white: 0xFFFFFF,
    reset: 0xFFFFFF,
};

const getCssColor = (color: string) => {
    if ((color.length == 6 + 1 || color.length == 3 + 1) && color[0] === "#") {
        return color; // hex string
    }
    return `#${minecraftColors[color.toLowerCase()].toString(16)}`;
};

const MinecraftComponent: FunctionComponent<Props> = ({component, noColor, style, ...other}) => {
    let content = "";
    let children: JSX.Element[] | false = false;

    const styling: JSX.CSSProperties = {};
    if (style && typeof style !== "string") {
        // can't support transitive string-based styling for now
        Object.assign(styling, style);
    }

    if (typeof component === "string") {
        content = component;
    } else if (component instanceof Array) {
        return <>
            <span {...other}>
                {component.map((child) => <MinecraftComponent component={child}/>)}
            </span>
        </>;
    } else {
        // text component
        if ("text" in component) {
            content = component.text;
        }
        // common component
        if ("extra" in component && component.extra instanceof Array) {
            children = component.extra.map(child => <MinecraftComponent component={child}/>);
        }
        // styling
        if ("color" in component && component.color && !noColor) {
            styling["color"] = getCssColor(component.color);
        }
        if ("bold" in component) {
            styling["fontWeight"] = component.bold ? "bold" : "normal";
        }
        if ("strikethrough" in component) {
            styling["textDecoration"] = component.italic ? "line-through" : "";
        }
        if ("underlined" in component) {
            styling["textDecoration"] = component.italic ? "underline" : "";
        }
        if ("italic" in component) {
            styling["fontStyle"] = component.italic ? "italic" : "normal";
        }
    }
    return <span {...other} style={styling}>{content}{children}</span>;
};

export default MinecraftComponent;
