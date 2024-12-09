export type EventListener = (event: any) => void

export class EventManager {
    private listeners: { [type: string]: EventListener[] } = {};

    public fire(event: Event): boolean {
        const listeners = this.listeners[event.type] || []
        if (!listeners.length) return false;
        listeners.forEach(listener => listener(event))
        return true;
    }

    public register(type: string, listener: EventListener) {
        let listeners = this.listeners[type]
        if (!listeners) this.listeners[type] = listeners = []
        listeners.push(listener)
    }

    public unregister(type: string, listener: EventListener) {
        let listeners = this.listeners[type]
        if (!listeners) return;
        const listenerIndex = listeners.indexOf(listener)
        if (listenerIndex >= 0) listeners.splice(listenerIndex, 1)
    }
}
