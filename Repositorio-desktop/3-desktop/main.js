// 3-desktop/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// IMPORTAR MANAGERS DESDE core/
const ProductManager = require('../core/managers/ProductManager');
const SaleManager = require('../core/managers/SaleManager');

// Instancias globales
let productManager;
let saleManager;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1350,
    height: 750,
    minWidth: 1100,
    minHeight: 650,
    backgroundColor: '#020617',
    title: 'Tienda de Barrio - Desktop',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  productManager = new ProductManager();
  saleManager = new SaleManager();

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ===============================
// 📦  IPC: PRODUCTOS
// ===============================

ipcMain.handle('products:getAll', () => {
  try {
    const productos = productManager.getAllProducts();
    console.log('[Electron] Total productos:', productos.length);
    return { ok: true, data: productos };
  } catch (err) {
    console.error(err);
    return { ok: false, error: err.message };
  }
});


ipcMain.handle('products:add', (_e, prod) => {
  try {
    const newProd = productManager.addProduct({
      nombre: prod.nombre,
      precioCompra: Number(prod.precio_compra),
      precioVenta: Number(prod.precio_venta),
      stock: Number(prod.stock),
      categoria: prod.categoria,
      codigoBarras: prod.codigo_barras || null,
      stockMinimo: Number(prod.stock_minimo),
    });
    return { ok: true, data: newProd };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('products:update', (_e, { id, changes }) => {
  try {
    const updated = productManager.updateProduct(id, changes);
    return { ok: true, data: updated };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('products:delete', (_e, id) => {
  try {
    productManager.deleteProduct(id);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('products:getById', (_event, id) => {
  try {
    const prod = productManager.getProductById(id);
    return { ok: true, data: prod };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ===============================
// 💰  IPC: VENTAS
// ===============================

ipcMain.handle('sales:register', (_e, { items, metodo, monto }) => {
  try {
    const result = saleManager.registerSale(items, metodo, monto);
    return { ok: true, data: result };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('sales:getToday', () => {
  try {
    return { ok: true, data: saleManager.getTodaySales() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
