import { PositionRef, AnalysisUpdate, AnalysisJobRequest, AnalysisJobResult, AnalysisJobHandle } from '../types/analysis.js';
import { AnalysisPlugin, AnalysisPluginContext } from './plugin.js';
import { AnalysisJobScheduler } from './job-scheduler.js';
import { EngineManager } from '../engine/engine-manager.js';
import { AnalysisCache } from '../shared/cache/analysis-cache.js';
import { AnalysisEventBus } from '../shared/event-bus.js';
import { DEFAULT_ENGINE_PROFILES } from '../shared/config.js';

export class AnalysisCoordinator {
  private plugins = new Map<string, AnalysisPlugin>();
  private activePosition: PositionRef | null = null;
  private currentGeneration = 0;
  private isRunning = false;

  constructor(
    public readonly scheduler: AnalysisJobScheduler,
    public readonly engineManager: EngineManager,
    public readonly cache: AnalysisCache,
    public readonly events: AnalysisEventBus
  ) {}

  private getPluginContext(): AnalysisPluginContext {
    return {
      coordinator: this,
      scheduler: this.scheduler,
      engineManager: this.engineManager,
      cache: this.cache,
      events: this.events,
    };
  }

  registerPlugin(plugin: AnalysisPlugin): void {
    this.plugins.set(plugin.id, plugin);
    if (plugin.setup) {
      plugin.setup(this.getPluginContext());
    }
  }

  unregisterPlugin(id: string): void {
    const p = this.plugins.get(id);
    if (p && p.destroy) {
      p.destroy();
    }
    this.plugins.delete(id);
  }

  async start(): Promise<void> {
    this.isRunning = true;
    await this.engineManager.initializeAll();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  setPosition(position: PositionRef): void {
    this.currentGeneration++;
    this.activePosition = position;
    this.scheduler.notifyPositionChanged(position.hash, this.currentGeneration);

    const ctx = this.getPluginContext();
    for (const plugin of this.plugins.values()) {
      try {
        plugin.onPositionChanged?.(position, ctx);
      } catch (err) {
        console.error(`Error in plugin ${plugin.id} onPositionChanged:`, err);
      }
    }

    this.events.emit('position.changed', position);
  }

  getActivePosition(): PositionRef | null {
    return this.activePosition;
  }

  getCurrentGeneration(): number {
    return this.currentGeneration;
  }

  async submitJob(request: AnalysisJobRequest): Promise<AnalysisJobHandle> {
    const session = this.engineManager.getSession(request.engineProfile.id) ||
      this.engineManager.getSession(DEFAULT_ENGINE_PROFILES['fake']!.id)!;

    return this.scheduler.submitJob(request, session);
  }

  handleAnalysisUpdate(update: AnalysisUpdate): void {
    // Stale drop
    if (
      !this.activePosition ||
      update.positionHash !== this.activePosition.hash ||
      update.generation !== this.currentGeneration
    ) {
      return;
    }

    const ctx = this.getPluginContext();
    for (const plugin of this.plugins.values()) {
      try {
        plugin.onAnalysisUpdate?.(update, ctx);
      } catch (err) {
        console.error(`Error in plugin ${plugin.id} onAnalysisUpdate:`, err);
      }
    }
    this.events.emit('analysis.updated', update);
  }
}
