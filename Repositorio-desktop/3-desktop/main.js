// desktop/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const ProductManager = require('../core/managers/ProductManager');
const SaleManager = require('../core/managers/SaleManager');
const PdfService = require('../core/services/PdfService');

const productManager = new ProductManager();
const saleManager = new SaleManager();
const pdfService = new PdfService();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

/* ========== IPC PRODUCTS ========== */
ipcMain.handle('products:getAll', async () => {
  try {
    const data = productManager.getAllProducts();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('products:add', async (event, productData) => {
  try {
    const data = productManager.addProduct(productData);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('products:update', async (event, { id, changes }) => {
  try {
    const data = productManager.updateProduct(id, changes);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('products:delete', async (event, id) => {
  try {
    productManager.deleteProduct(id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('products:getById', async (event, id) => {
  try {
    const data = productManager.getProductById(id);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

/* ========== IPC SALES (VENTAS) ========== */
ipcMain.handle('sales:register', async (event, { items, metodoPago, monto }) => {
  try {
    const res = saleManager.registerSale(items, metodoPago, Number(monto));
    return { ok: true, data: res };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('sales:today', async () => {
  try {
    const data = saleManager.getTodaySales();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('sales:weekly', async () => {
  try {
    const data = saleManager.getWeeklySales();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('sales:monthly', async () => {
  try {
    const data = saleManager.getMonthlySales();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('sales:detail', async (event, ventaId) => {
  try {
    const data = saleManager.getSaleDetail(ventaId);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('sales:cancel', async (event, ventaId) => {
  try {
    const data = saleManager.cancelSale(ventaId);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

/* ========== IPC REPORTES / ESTADÍSTICAS ========== */
ipcMain.handle('reports:topProducts', async (event, limit = 10) => {
  try {
    const data = saleManager.getTopSellingProducts(limit);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('reports:stats', async (event, days = 30) => {
  try {
    const data = saleManager.getSalesStats(days);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('reports:lowStockPdf', async () => {
  try {
    const productos = saleManager.getLowStockProductsByCategory();
    const res = await pdfService.generateLowStockReport(productos);
    return { ok: true, data: res };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
