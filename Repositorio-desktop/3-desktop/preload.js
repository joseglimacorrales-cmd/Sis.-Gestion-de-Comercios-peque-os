const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  products: {
    getAll: () => ipcRenderer.invoke('products:getAll'),
    add: (data) => ipcRenderer.invoke('products:add', data),
    update: (id, changes) => ipcRenderer.invoke('products:update', { id, changes }),
    delete: (id) => ipcRenderer.invoke('products:delete', id),
    getById: (id) => ipcRenderer.invoke('products:getById', id),
  },

  sales: {
    register: (items, metodoPago, monto) =>
      ipcRenderer.invoke('sales:register', { items, metodoPago, monto }),
    today: () => ipcRenderer.invoke('sales:today'),
    weekly: () => ipcRenderer.invoke('sales:weekly'),
    monthly: () => ipcRenderer.invoke('sales:monthly'),
    detail: (ventaId) => ipcRenderer.invoke('sales:detail', ventaId),
    cancel: (ventaId) => ipcRenderer.invoke('sales:cancel', ventaId),
  },

  reports: {
    topProducts: (limit = 10) =>
      ipcRenderer.invoke('reports:topProducts', limit),
    stats: (days = 30) => ipcRenderer.invoke('reports:stats', days),
    lowStockPdf: () => ipcRenderer.invoke('reports:lowStockPdf'),
  },
});
