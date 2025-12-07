// tests/productManager.test.js
const {
  sequelize,
  Product,
  Sale,
  SaleDetail,
  initDatabase,
} = require('../core/models');
const ProductManager = require('../core/managers/ProductManager');

describe('ProductManager', () => {
  const PM = new ProductManager();
  beforeAll(async () => {
    await initDatabase();
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    await initDatabase();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('crea un producto válido', async () => {
    const prod = await PM.addProduct({
      nombre: 'Producto Test',
      categoria: 'Pruebas',
      precio_compra: 10,
      precio_venta: 15,
      stock: 5,
      stock_minimo: 2,
      codigo_barras: '123456',
    });

    expect(prod).toBeDefined();
    expect(prod.id).toBeDefined();
    expect(prod.nombre).toBe('Producto Test');
    expect(prod.precio_compra).toBe(10);
    expect(prod.precio_venta).toBe(15);
  });

  test('no permite nombre duplicado (activo)', async () => {
    await PM.addProduct({
      nombre: 'Producto Duplicado',
      categoria: 'Pruebas',
      precio_compra: 5,
      precio_venta: 7,
      stock: 10,
      stock_minimo: 3,
    });

    await expect(
      PM.addProduct({
        nombre: 'Producto Duplicado',
        categoria: 'Pruebas',
        precio_compra: 6,
        precio_venta: 8,
        stock: 4,
        stock_minimo: 1,
      })
    ).rejects.toThrow(/Ya existe un producto activo/i);
  });

  test('rechaza precio de venta menor al de compra', async () => {
    await expect(
      PM.addProduct({
        nombre: 'Producto Invalido',
        categoria: 'Pruebas',
        precio_compra: 10,
        precio_venta: 5,
        stock: 5,
        stock_minimo: 1,
      })
    ).rejects.toThrow(/precio de venta no puede ser menor que el precio de compra/i);
  });

  test('rechaza nombre demasiado corto', async () => {
    await expect(
      PM.addProduct({
        nombre: 'A',
        categoria: 'Pruebas',
        precio_compra: 1,
        precio_venta: 2,
        stock: 1,
        stock_minimo: 0,
      })
    ).rejects.toThrow(/debe tener al menos 3 caracteres/i);
  });

  test('rechaza categoría demasiado larga', async () => {
    const categoriaLarga = 'X'.repeat(60);
    await expect(
      PM.addProduct({
        nombre: 'Cat Larga',
        categoria: categoriaLarga,
        precio_compra: 1,
        precio_venta: 2,
        stock: 1,
        stock_minimo: 0,
      })
    ).rejects.toThrow(/no puede superar 40 caracteres/i);
  });

  test('rechaza código de barras demasiado largo', async () => {
    const barraLarga = '9'.repeat(70);
    await expect(
      PM.addProduct({
        nombre: 'Con Codigo Largo',
        categoria: 'X',
        precio_compra: 1,
        precio_venta: 2,
        stock: 1,
        stock_minimo: 0,
        codigo_barras: barraLarga,
      })
    ).rejects.toThrow(/código de barras no puede superar 64 caracteres/i);
  });

  test('getAllProducts devuelve solo productos activos', async () => {
    const p1 = await PM.addProduct({
      nombre: 'Activo 1',
      categoria: 'X',
      precio_compra: 2,
      precio_venta: 3,
      stock: 10,
      stock_minimo: 2,
    });

    const p2 = await PM.addProduct({
      nombre: 'Activo 2',
      categoria: 'X',
      precio_compra: 2,
      precio_venta: 4,
      stock: 0,
      stock_minimo: 1,
    });

    await PM.deleteProduct(p1.id);

    const lista = await PM.getAllProducts();
    const nombres = lista.map((p) => p.nombre);

    expect(nombres).not.toContain('Activo 1');
    expect(nombres).toContain('Activo 2');
  });

  test('getLowStockProducts devuelve productos con stock <= stock_minimo', async () => {
    await PM.addProduct({
      nombre: 'Stock Bajo',
      categoria: 'X',
      precio_compra: 1,
      precio_venta: 2,
      stock: 2,
      stock_minimo: 5,
    });

    await PM.addProduct({
      nombre: 'Stock Suficiente',
      categoria: 'X',
      precio_compra: 1,
      precio_venta: 2,
      stock: 10,
      stock_minimo: 5,
    });

    const bajos = await PM.getLowStockProducts();
    const nombres = bajos.map((p) => p.nombre);

    expect(nombres).toContain('Stock Bajo');
    expect(nombres).not.toContain('Stock Suficiente');
  });

  test('getProductById devuelve null si no existe', async () => {
    const prod = await PM.getProductById(999999);
    expect(prod).toBeNull();
  });

  test('updateProduct sin cambios devuelve el producto actual', async () => {
    const creado = await PM.addProduct({
      nombre: 'Producto Update',
      categoria: 'X',
      precio_compra: 3,
      precio_venta: 5,
      stock: 7,
      stock_minimo: 1,
    });

    const actualizado = await PM.updateProduct(creado.id, {});
    expect(actualizado.id).toBe(creado.id);
    expect(actualizado.nombre).toBe('Producto Update');
  });

  test('updateProduct no permite que el precio de venta quede menor al de compra', async () => {
    const creado = await PM.addProduct({
      nombre: 'Producto Cambios',
      categoria: 'X',
      precio_compra: 10,
      precio_venta: 15,
      stock: 3,
      stock_minimo: 1,
    });

    await expect(
      PM.updateProduct(creado.id, { precio_venta: 5 })
    ).rejects.toThrow(/precio de venta no puede ser menor que el precio de compra/i);
  });
});
