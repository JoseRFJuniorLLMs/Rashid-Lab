import {
  AnalysisJobRequest,
  AnalysisJobResult,
  AnalysisJobHandle,
  AnalysisJobStatus,
  EngineLine,
} from '../types/analysis.js';
import { EngineSession } from '../engine/engine-session.js';

interface QueuedJob {
  request: AnalysisJobRequest;
  session: EngineSession;
  status: AnalysisJobStatus;
  resolve: (res: AnalysisJobResult) => void;
  reject: (err: any) => void;
}

export class AnalysisJobScheduler {
  private queue: QueuedJob[] = [];
  private activeJob: QueuedJob | null = null;
  private currentGeneration = 0;
  private currentPositionHash = '';

  submitJob(request: AnalysisJobRequest, session: EngineSession): AnalysisJobHandle {
    const jobId = request.id || `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    request.id = jobId;

    let resolvePromise: (res: AnalysisJobResult) => void;
    let rejectPromise: (err: any) => void;

    const promise = new Promise<AnalysisJobResult>((res, rej) => {
      resolvePromise = res;
      rejectPromise = rej;
    });

    const queuedJob: QueuedJob = {
      request,
      session,
      status: 'QUEUED',
      resolve: resolvePromise!,
      reject: rejectPromise!,
    };

    // Insert sorted by priority (0 = highest priority, 7 = lowest)
    this.queue.push(queuedJob);
    this.queue.sort((a, b) => a.request.priority - b.request.priority);

    const handle: AnalysisJobHandle = {
      id: jobId,
      status: () => queuedJob.status,
      cancel: async () => {
        queuedJob.status = 'CANCELLED';
        if (this.activeJob === queuedJob) {
          await session.stop();
          this.activeJob = null;
        }
        const idx = this.queue.indexOf(queuedJob);
        if (idx !== -1) this.queue.splice(idx, 1);
        queuedJob.reject(new Error('Job cancelled'));
        this.processNext();
      },
      promise,
    };

    this.processNext();
    return handle;
  }

  notifyPositionChanged(positionHash: string, generation: number): void {
    this.currentPositionHash = positionHash;
    this.currentGeneration = generation;

    // Stale protection: Cancel any queued jobs from previous generations that belong to the board
    this.queue = this.queue.filter((job) => {
      if (job.request.generation < generation && job.request.priority <= 2) {
        job.status = 'CANCELLED';
        job.reject(new Error('Stale job dropped'));
        return false;
      }
      return true;
    });

    if (
      this.activeJob &&
      this.activeJob.request.generation < generation &&
      this.activeJob.request.priority <= 2
    ) {
      this.activeJob.session.stop();
      this.activeJob.status = 'CANCELLED';
      this.activeJob.reject(new Error('Active stale job cancelled'));
      this.activeJob = null;
      this.processNext();
    }
  }

  private async processNext(): Promise<void> {
    if (this.activeJob || this.queue.length === 0) return;

    const next = this.queue.shift();
    if (!next) return;

    if (next.status === 'CANCELLED') {
      this.processNext();
      return;
    }

    this.activeJob = next;
    next.status = 'RUNNING';

    const startTime = new Date().toISOString();
    const startMs = Date.now();

    try {
      const lines = await next.session.startAnalysis({
        jobId: next.request.id!,
        positionHash: next.request.position.hash,
        generation: next.request.generation,
        fen: next.request.position.fen,
        searchMoves: next.request.search?.searchMoves,
        depth: next.request.search?.depth,
        movetimeMs: next.request.search?.movetimeMs,
      });

      // Stale check upon completion
      if (
        next.request.position.hash !== this.currentPositionHash ||
        next.request.generation < this.currentGeneration
      ) {
        next.status = 'CANCELLED';
        next.reject(new Error('Completed result dropped because position is stale'));
      } else {
        next.status = 'COMPLETED';
        const result: AnalysisJobResult = {
          jobId: next.request.id!,
          positionHash: next.request.position.hash,
          generation: next.request.generation,
          engine: {
            name: next.session.profile.name,
            version: '1.0',
          },
          search: {
            depth: next.request.search?.depth || 12,
            nodes: 25000,
            timeMs: Date.now() - startMs,
            nps: 500000,
          },
          lines,
          startedAt: startTime,
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - startMs,
        };
        next.resolve(result);
      }
    } catch (err) {
      next.status = 'ERROR';
      next.reject(err);
    } finally {
      this.activeJob = null;
      this.processNext();
    }
  }

  getActiveJob(): AnalysisJobRequest | null {
    return this.activeJob ? this.activeJob.request : null;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}
