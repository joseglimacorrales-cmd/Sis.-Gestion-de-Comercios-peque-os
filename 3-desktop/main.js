// desktop/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const { initDatabase } = require('../core/models');
const ProductManager = require('../core/managers/ProductManager');
const SaleManager = require('../core/managers/SaleManager');
const PdfService = require('../core/services/PdfService');

const PM = new ProductManager();
const SM = new SaleManager();
const PDF = new PdfService();

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(async () => {
  await initDatabase();
  createWindow();
});

/* PRODUCTOS */
ipcMain.handle('products:getAll', async () => {
  try { return { ok: true, data: await PM.getAllProducts() }; }
  catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('products:add', async (e, d) => {
  try { return { ok: true, data: await PM.addProduct(d) }; }
  catch (e2) { return { ok: false, error: e2.message }; }
});

ipcMain.handle('products:update', async (e, { id, changes }) => {
  try { return { ok: true, data: await PM.updateProduct(id, changes) }; }
  catch (e2) { return { ok: false, error: e2.message }; }
});

ipcMain.handle('products:delete', async (e, id) => {
  try { await PM.deleteProduct(id); return { ok: true }; }
  catch (e2) { return { ok: false, error: e2.message }; }
});

ipcMain.handle('products:getById', async (e, id) => {
  try { return { ok: true, data: await PM.getProductById(id) }; }
  catch (e2) { return { ok: false, error: e2.message }; }
});

/* VENTAS */
ipcMain.handle('sales:register', async (e, { items, metodoPago, monto }) => {
  try { return { ok: true, data: await SM.registerSale(items, metodoPago, monto) }; }
  catch (e2) { return { ok: false, error: e2.message }; }
});

ipcMain.handle('sales:today', async () => {
  try { return { ok: true, data: await SM.getTodaySales() }; }
  catch (e2) { return { ok: false, error: e2.message }; }
});

ipcMain.handle('sales:weekly', async () => {
  try { return { ok: true, data: await SM.getWeeklySales() }; }
  catch (e2) { return { ok: false, error: e2.message }; }
});

ipcMain.handle('sales:monthly', async () => {
  try { return { ok: true, data: await SM.getMonthlySales() }; }
  catch (e2) { return { ok: false, error: e2.message }; }
});

ipcMain.handle('sales:cancel', async (e, id) => {
  try { return { ok: true, data: await SM.cancelSale(id) }; }
  catch (e2) { return { ok: false, error: e2.message }; }
});

/* REPORTES */
ipcMain.handle('reports:topProducts', async (e, limit) => {
  try { return { ok: true, data: await SM.getTopSellingProducts(limit) }; }
  catch (e2) { return { ok: false, error: e2.message }; }
});

ipcMain.handle('reports:stats', async (e, days) => {
  try { return { ok: true, data: await SM.getSalesStats(days) }; }
  catch (e2) { return { ok: false, error: e2.message }; }
});

ipcMain.handle('reports:lowStockPdf', async () => {
  try { 
    const productos = await SM.getLowStockProductsByCategory();
    const pdf = await PDF.generateLowStockReport(productos);
    return { ok: true, data: pdf }; 
  }
  catch (e2) { return { ok: false, error: e2.message }; }
});
