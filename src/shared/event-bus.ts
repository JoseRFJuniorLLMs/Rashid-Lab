type Handler<T> = (data: T) => void | Promise<void>;

export class AnalysisEventBus {
  private handlers = new Map<string, Set<Handler<any>>>();

  subscribe<T = any>(event: string, handler: Handler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.unsubscribe(event, handler);
  }

  unsubscribe<T = any>(event: string, handler: Handler<T>): void {
    const set = this.handlers.get(event);
    if (set) {
      set.delete(handler);
      if (set.size === 0) this.handlers.delete(event);
    }
  }

  emit<T = any>(event: string, data: T): void {
    const set = this.handlers.get(event);
    if (set) {
      for (const handler of set) {
        try {
          const res = handler(data);
          if (res instanceof Promise) {
            res.catch(err => console.error(`Async event error in ${event}:`, err));
          }
        } catch (err) {
          console.error(`Event error in ${event}:`, err);
        }
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}
