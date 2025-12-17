export type EventListener = (event: any) => void

export type RemovalCallback = () => void;

export class Registers {

    private manager: EventManager;
    private callbacks: RemovalCallback[] = [];

    constructor(manager: EventManager) {
        this.manager = manager;
    }

    public callback(): RemovalCallback {
        return () => this.callbacks.forEach(callback => callback());
    }

    public register(type: string | string[], listener: EventListener): Registers {
        this.callbacks.push(this.manager.register(type, listener));
        return this;
    }
}

export class EventManager {

    private listeners: Record<string, EventListener[]> = {};

    public fire(event: Event): boolean {
        const listeners = this.listeners[event.type] || [];
        if (listeners.length) {
            listeners.forEach(listener => listener(event));
            return true;
        }
        return false;
    }

    public registers(): Registers {
        return new Registers(this);
    }

    public register(type: string | string[], listener: EventListener): RemovalCallback {
        if (type instanceof Array) {
            const callbacks = type.map(type => this.register(type, listener));
            return () => callbacks.forEach(fn => fn());
        }
        let listeners = this.listeners[type];
        if (!listeners) this.listeners[type] = listeners = [];
        listeners.push(listener);
        return callUnregister.bind(null, listeners, listener);
    }

    public unregister(type: string | string [], listener: EventListener) {
        if (type instanceof Array) {
            return type.forEach(type => this.unregister(type, listener));
        }
        let listeners = this.listeners[type];
        if (listeners) {
            callUnregister(listeners, listener);
        }
    }
}

const callUnregister = (listeners: EventListener[], listener: EventListener) => {
    const listenerIndex = listeners.indexOf(listener);
    if (listenerIndex >= 0) {
        listeners.splice(listenerIndex, 1);
    }
};
