// RUTA: src/utils/eventEmitter.ts

type EventCallback = (...args: any[]) => void
type EventMap = {
  [key: string]: EventCallback[]
}

class EventEmitter {
  private events: EventMap = {}

  on(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  off(event: string, callback: EventCallback): void {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter((cb) => cb !== callback)
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return
    this.events[event].forEach((callback) => callback(...args))
  }
}

// Creamos una única instancia para toda la aplicación (patrón Singleton)
export const appEmitter = new EventEmitter()
