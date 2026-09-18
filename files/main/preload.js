const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rashidLabApi', {
  version: '1.0.0',
  isRashidLab: true,
  getModes: () => ['ANALYZE', 'SACRIFICE_LAB', 'DISCOVER', 'STUDY', 'CORPUS'],
  send: (channel, data) => {
    const validChannels = ['renderer_ready', 'set_title', 'terminate', 'alert', 'quit'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  on: (channel, func) => {
    const validChannels = ['call'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
});
