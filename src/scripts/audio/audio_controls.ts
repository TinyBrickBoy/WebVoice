import {EventManager} from "../util/events.ts";

export class AudioControls extends EventManager {

    private _muted: boolean;
    private _deafened: boolean;
    private _noiseReduction: boolean;

    constructor() {
        super();
        this._muted = (localStorage.getItem("sonus:muted") || "true") === "true";
        this._deafened = (localStorage.getItem("sonus:deafened") || "false") === "true";
        this._noiseReduction = (localStorage.getItem("sonus:noise_reduction") || "true") === "true";
        console.log("Loaded audio controls from local storage", this.muted, this.deafened, this.noiseReduction);
    }

    get muted(): boolean {
        return this._muted;
    }

    set muted(value: boolean) {
        this._muted = value;
        localStorage.setItem("sonus:muted", value.toString());
        this.fire(new CustomEvent("update_muted"));
    }

    get deafened(): boolean {
        return this._deafened;
    }

    set deafened(value: boolean) {
        this._deafened = value;
        localStorage.setItem("sonus:deafened", value.toString());
        this.fire(new CustomEvent("update_deafened"));
    }

    get noiseReduction(): boolean {
        return this._noiseReduction;
    }

    set noiseReduction(value: boolean) {
        this._noiseReduction = value;
        localStorage.setItem("sonus:noise_reduction", value.toString());
        this.fire(new CustomEvent("update_noise_reduction"));
    }
}
