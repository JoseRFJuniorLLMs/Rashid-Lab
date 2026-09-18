import { PositionRef, AnalysisUpdate, AnalysisJobResult } from '../types/analysis.js';
import { AnalysisCoordinator } from './analysis-coordinator.js';
import { AnalysisJobScheduler } from './job-scheduler.js';
import { EngineManager } from '../engine/engine-manager.js';
import { AnalysisCache } from '../shared/cache/analysis-cache.js';
import { AnalysisEventBus } from '../shared/event-bus.js';

export interface AnalysisPluginContext {
  coordinator: AnalysisCoordinator;
  scheduler: AnalysisJobScheduler;
  engineManager: EngineManager;
  cache: AnalysisCache;
  events: AnalysisEventBus;
}

export interface AnalysisPlugin {
  readonly id: string;
  setup?(ctx: AnalysisPluginContext): Promise<void> | void;
  onPositionChanged?(position: PositionRef, ctx: AnalysisPluginContext): Promise<void> | void;
  onAnalysisUpdate?(update: AnalysisUpdate, ctx: AnalysisPluginContext): Promise<void> | void;
  onAnalysisCompleted?(result: AnalysisJobResult, ctx: AnalysisPluginContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}
