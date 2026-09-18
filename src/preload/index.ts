export interface RashidLabApi {
  version: string;
  isRashidLab: boolean;
  getModes(): string[];
}

export const rashidLabApi: RashidLabApi = {
  version: '1.0.0',
  isRashidLab: true,
  getModes: () => ['ANALYZE', 'SACRIFICE_LAB', 'DISCOVER', 'STUDY', 'CORPUS'],
};

// Check if electron contextBridge is available
try {
  // @ts-ignore
  const { contextBridge } = require('electron');
  if (contextBridge) {
    contextBridge.exposeInMainWorld('rashidLabApi', rashidLabApi);
  }
} catch {
  // Browser or non-electron test environment
}
