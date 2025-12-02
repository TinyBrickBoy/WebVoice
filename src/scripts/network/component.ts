export type Dialog = object;

export type NbtTag = any;

export type DataComponentPatch = object;

export type ItemStack = {
    id: string;
    count?: number;
    components?: DataComponentPatch;
}

export type ClickEvent = {
    action: "open_url";
    url: string;
} | {
    action: "open_file";
    path: string;
} | {
    action: "run_command" | "suggest_command";
    command: string;
} | {
    action: "show_dialog";
    dialog: Dialog;
} | {
    action: "change_page";
    page: number;
} | {
    action: "copy_to_clipboard";
    value: string;
} | {
    action: "custom";
    id: string;
    payload?: NbtTag;
}

export type HoverEvent = {
    action: "show_text";
    value: Component;
} | {
    action: "show_entity";
    id: string;
    uuid: number[] | string;
    name?: Component;
} | ({ action: "show_item"; } & ItemStack)

export type Style = {
    color?: string;
    shadow_color?: number | number[];
    bold?: boolean;
    italic?: boolean;
    underlined?: boolean;
    strikethrough?: boolean;
    obfuscated?: boolean;
    click_event?: ClickEvent;
    hover_event?: HoverEvent;
    insertion?: string;
    font?: string;
}

type CommonComponent = Style | {
    extra?: Component[]
}

export type TextComponent = string | (CommonComponent & { text: string })

export type Component = TextComponent | Component[]
