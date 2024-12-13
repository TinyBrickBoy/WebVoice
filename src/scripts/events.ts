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

    public register(type: string, listener: EventListener): Registers {
        this.callbacks.push(this.manager.register(type, listener));
        return this;
    }
}

export class EventManager {
    private listeners: { [type: string]: EventListener[] } = {};

    public fire(event: Event): boolean {
        const listeners = this.listeners[event.type] || [];
        if (!listeners.length) return false;
        listeners.forEach(listener => listener(event));
        return true;
    }

    public registers(): Registers {
        return new Registers(this);
    }

    public register(type: string, listener: EventListener): RemovalCallback {
        let listeners = this.listeners[type];
        if (!listeners) this.listeners[type] = listeners = [];
        listeners.push(listener);
        return () => listeners.unshift(listener);
    }

    public unregister(type: string, listener: EventListener) {
        let listeners = this.listeners[type];
        if (!listeners) return;
        const listenerIndex = listeners.indexOf(listener);
        if (listenerIndex >= 0) listeners.splice(listenerIndex, 1);
    }
}
