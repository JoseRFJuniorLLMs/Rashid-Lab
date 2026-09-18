import { AnalysisJobResult } from '../../types/analysis.js';

export interface CacheKeyParams {
  positionHash: string;
  generation: number;
  engineId: string;
  searchMoves?: string[];
  depth?: number;
}

export class AnalysisCache {
  private l1Cache = new Map<string, AnalysisJobResult>();
  private l1MaxEntries: number;

  constructor(maxEntries = 1000) {
    this.l1MaxEntries = maxEntries;
  }

  generateKey(params: CacheKeyParams): string {
    const sm = params.searchMoves ? params.searchMoves.sort().join(',') : 'all';
    const depth = params.depth ?? 0;
    return `${params.positionHash}:${params.generation}:${params.engineId}:${sm}:${depth}`;
  }

  get(key: string): AnalysisJobResult | undefined {
    const val = this.l1Cache.get(key);
    if (val) {
      // LRU refresh
      this.l1Cache.delete(key);
      this.l1Cache.set(key, val);
    }
    return val;
  }

  set(key: string, result: AnalysisJobResult): void {
    if (this.l1Cache.size >= this.l1MaxEntries) {
      // Remove oldest
      const firstKey = this.l1Cache.keys().next().value;
      if (firstKey) this.l1Cache.delete(firstKey);
    }
    this.l1Cache.set(key, result);
  }

  has(key: string): boolean {
    return this.l1Cache.has(key);
  }

  clear(): void {
    this.l1Cache.clear();
  }

  size(): number {
    return this.l1Cache.size;
  }
}
