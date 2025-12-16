import {EventManager} from "../util/events.ts";

// experimental, see https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/selectAudioOutput
type SelectAudioOutput = (options?: { deviceId?: string }) => Promise<MediaDeviceInfo>

export class AudioDeviceManager {

    private readonly events = new EventManager();

    private microphoneStream: MediaStream | null = null;
    private selectedMicrophone: string | null = null;
    private microphoneList: MediaDeviceInfo[] = [];

    private selectedSpeaker: string | null = null;
    private speakerList: MediaDeviceInfo[] = [];

    constructor() {
        this.selectedMicrophone = localStorage.getItem("sonus:microphone") || null;
        this.selectedSpeaker = localStorage.getItem("sonus:speaker") || null;
    }

    public registerMediaListener() {
        const handler = async () => await this.refreshDeviceList();
        navigator.mediaDevices.addEventListener("devicechange", handler);
        return () => navigator.mediaDevices.removeEventListener("devicechange", handler);
    }

    public async refreshDeviceList() {
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.microphoneList = devices.filter(device => device.kind === "audioinput");
        this.speakerList = devices.filter(device => device.kind === "audiooutput");
        this.events.fire(new CustomEvent("update_device_list"));
    }

    public async updateSpeaker(deviceId: string | null): Promise<boolean> {
        // update saved device id
        if (this.selectedSpeaker !== deviceId) {
            this.selectedSpeaker = deviceId;
            localStorage.setItem("sonus:speaker", deviceId || "");
            this.events.fire(new CustomEvent("update_speaker"));
        }
        // only supported on firefox
        if ("selectAudioOutput" in navigator.mediaDevices) {
            try {
                const selectAudioOutput = navigator.mediaDevices.selectAudioOutput as SelectAudioOutput;
                const speaker = await selectAudioOutput.call(navigator.mediaDevices, {deviceId: this.selectedSpeaker || undefined});
                // according to MDN, this is allowed to return a device with a new id - so retry, but with the correct id now
                if (deviceId && deviceId !== speaker.deviceId) {
                    return await this.updateSpeaker(speaker.deviceId);
                }
                return true;
            } catch (error) {
                if (error instanceof DOMException) {
                    if (error.name === "NotAllowedError") {
                        return false;
                    } else if (error.name === "NotFoundError") {
                        // retry updating, but without a specific speaker set
                        return await this.updateSpeaker(null);
                    }
                }
                // unknown error, pass on
                throw error;
            }
        }
        // generic device refresh, this may not fully work on non-firefox though
        await this.refreshDeviceList();
        return true;
    }

    public async updateMicrophone(deviceId: string | null): Promise<boolean> {
        // update saved device id
        if (this.selectedMicrophone !== deviceId) {
            this.selectedMicrophone = deviceId;
            localStorage.setItem("sonus:microphone", deviceId || "");
            this.events.fire(new CustomEvent("update_microphone"));
        }
        try {
            // simply get the microphone stream and trigger refresh events
            this.microphoneStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: deviceId || undefined,
                },
            });
            this.events.fire(new CustomEvent("update_microphone_stream"));
        } catch (error) {
            this.microphoneStream = null;
            this.events.fire(new CustomEvent("update_microphone_stream"));

            if (error instanceof DOMException) {
                if (error.name === "NotAllowedError" || error.name === "SecurityError") {
                    return false;
                } else if (error.name === "NotFoundError") {
                    // retry updating, but without a specific microphone set
                    return await this.updateMicrophone(null);
                }
            }
            // unknown error, pass on
            throw error;
        }
        await this.refreshDeviceList();
        return true;
    }

    public async checkPermission() {
        if (!(await this.updateSpeaker(this.selectedSpeaker))) {
            return "speaker";
        } else if (!(await this.updateMicrophone(this.selectedMicrophone))) {
            return "microphone";
        }
        return null;
    }

    public async getMicrophoneStream() {
        if (!this.microphoneStream?.active) {
            await this.updateMicrophone(this.selectedMicrophone);
        }
        return this.microphoneStream;
    }

    public getMicrophoneId() {
        return this.selectedMicrophone;
    }

    public async getMicrophoneList() {
        if (!this.microphoneList) {
            await this.refreshDeviceList();
        }
        return this.microphoneList || [];
    }

    public getSpeakerId() {
        return this.selectedSpeaker;
    }

    public async getSpeakerList() {
        if (!this.speakerList) {
            await this.refreshDeviceList();
        }
        return this.speakerList || [];
    }

    public getEvents() {
        return this.events;
    }
}

