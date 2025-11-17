const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  products: {
    getAll: () => ipcRenderer.invoke('products:getAll'),
    add: (data) => ipcRenderer.invoke('products:add', data),
    update: (id, changes) => ipcRenderer.invoke('products:update', { id, changes }),
    delete: (id) => ipcRenderer.invoke('products:delete', id),
    getById: (id) => ipcRenderer.invoke('products:getById', id),   // 👈 NUEVO
  },
});
