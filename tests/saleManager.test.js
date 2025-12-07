// tests/saleManager.test.js
const {
  sequelize,
  Product,
  Sale,
  SaleDetail,
  initDatabase,
} = require('../core/models');
const SaleManager = require('../core/managers/SaleManager');

describe('SaleManager', () => {
  const SM = new SaleManager();

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

  async function crearItemBasico(cantidad = 2) {
    const prod = await Product.findOne();
    if (!prod) {
      throw new Error('No hay productos en la BD para probar.');
    }

    return {
      productoId: prod.id,
      nombre: prod.nombre,
      cantidad,
      precioUnitario: prod.precio_venta,
    };
  }

  test('registra una venta válida, descuenta stock y calcula cambio', async () => {
    const prodAntes = await Product.findOne();
    const stockInicial = prodAntes.stock;

    const item = await crearItemBasico(2);
    const totalEsperado = item.cantidad * item.precioUnitario;
    const montoRecibido = totalEsperado + 5;

    const res = await SM.registerSale([item], 'efectivo', montoRecibido);

    expect(res).toBeDefined();
    expect(res.id).toBeDefined();
    expect(res.total).toBeCloseTo(totalEsperado);
    expect(res.cambio).toBeCloseTo(montoRecibido - totalEsperado);
    expect(res.productos).toBe(1);

    const prodDespues = await Product.findByPk(prodAntes.id);
    expect(prodDespues.stock).toBe(stockInicial - item.cantidad);

    const venta = await Sale.findByPk(res.id, { include: ['detalles'] });
    expect(venta).not.toBeNull();
    expect(venta.detalles.length).toBe(1);
  });

  test('lanza error si el monto recibido es insuficiente', async () => {
    const item = await crearItemBasico(1);
    const total = item.cantidad * item.precioUnitario;
    const montoInsuficiente = total - 0.5;

    await expect(
      SM.registerSale([item], 'efectivo', montoInsuficiente)
    ).rejects.toThrow(/Monto insuficiente/i);
  });

  test('lanza error si el método de pago es inválido', async () => {
    const item = await crearItemBasico(1);
    const total = item.cantidad * item.precioUnitario;

    await expect(
      SM.registerSale([item], 'bitcoin', total)
    ).rejects.toThrow(/Método de pago inválido/i);
  });

  test('lanza error si no hay productos en la venta', async () => {
    await expect(
      SM.registerSale([], 'efectivo', 10)
    ).rejects.toThrow(/No hay productos en la venta/i);
  });

  test('lanza error si items no es un arreglo', async () => {
    await expect(
      SM.registerSale(null, 'efectivo', 10)
    ).rejects.toThrow(/"items" debe ser un arreglo/i);
  });

  test('lanza error si un item no es objeto', async () => {
    await expect(
      SM.registerSale([null], 'efectivo', 10)
    ).rejects.toThrow(/Item 1 de la venta es inválido/i);
  });

  test('lanza error si la cantidad es inválida (0)', async () => {
    const prod = await Product.findOne();
    const item = {
      productoId: prod.id,
      nombre: prod.nombre,
      cantidad: 0,
      precioUnitario: prod.precio_venta,
    };

    await expect(
      SM.registerSale([item], 'efectivo', 10)
      ).rejects.toThrow(/Cantidad \(item 1\).*≥ 1/i);
  });

  test('lanza error si el stock es insuficiente', async () => {
    const prod = await Product.findOne();
    const item = {
      productoId: prod.id,
      nombre: prod.nombre,
      cantidad: prod.stock + 10,
      precioUnitario: prod.precio_venta,
    };

    await expect(
      SM.registerSale([item], 'efectivo', 999999)
    ).rejects.toThrow(/Stock insuficiente/i);
  });

  test('lanza error si el producto está inactivo', async () => {
    const prod = await Product.findOne();
    await Product.update({ activo: false }, { where: { id: prod.id } });

    const item = {
      productoId: prod.id,
      nombre: prod.nombre,
      cantidad: 1,
      precioUnitario: prod.precio_venta,
    };

    await expect(
      SM.registerSale([item], 'efectivo', item.cantidad * item.precioUnitario)
    ).rejects.toThrow(/no encontrado o inactivo/i);
  });

  test('cancelSale repone el stock y marca la venta como inactiva', async () => {
    const prodAntes = await Product.findOne();
    const stockInicial = prodAntes.stock;

    const item = {
      productoId: prodAntes.id,
      nombre: prodAntes.nombre,
      cantidad: 1,
      precioUnitario: prodAntes.precio_venta,
    };

    const total = item.cantidad * item.precioUnitario;
    const venta = await SM.registerSale([item], 'efectivo', total);

    const resCancel = await SM.cancelSale(venta.id);
    expect(resCancel.mensaje).toMatch(/Venta cancelada/i);

    const prodDespues = await Product.findByPk(prodAntes.id);
    expect(prodDespues.stock).toBe(stockInicial);

    const ventaDespues = await Sale.findByPk(venta.id);
    expect(ventaDespues.activa).toBe(false);
  });

  test('cancelSale falla si la venta no existe', async () => {
    await expect(SM.cancelSale(999999)).rejects.toThrow(/Venta no encontrada/i);
  });

  test('cancelSale falla si la venta ya fue cancelada previamente', async () => {
    const prod = await Product.findOne();
    const item = {
      productoId: prod.id,
      nombre: prod.nombre,
      cantidad: 1,
      precioUnitario: prod.precio_venta,
    };

    const total = item.cantidad * item.precioUnitario;
    const venta = await SM.registerSale([item], 'efectivo', total);

    await SM.cancelSale(venta.id);

    await expect(SM.cancelSale(venta.id)).rejects.toThrow(/ya fue cancelada previamente/i);
  });

  test('getTodaySales devuelve ventas formateadas con detalles', async () => {
    const item = await crearItemBasico(1);
    const total = item.cantidad * item.precioUnitario;
    await SM.registerSale([item], 'efectivo', total);

    const ventasHoy = await SM.getTodaySales();
    expect(Array.isArray(ventasHoy)).toBe(true);
    expect(ventasHoy.length).toBeGreaterThan(0);

    const v = ventasHoy[0];
    expect(v.metodo_pago).toBe('Efectivo');
    expect(v.monto_pagado).toBeGreaterThan(0);
    expect(Array.isArray(v.detalles)).toBe(true);
    expect(v.detalles.length).toBeGreaterThan(0);
  });

  test('getTopSellingProducts devuelve filas agregadas', async () => {
    const item1 = await crearItemBasico(1);
    const item2 = await crearItemBasico(2);

    const total1 = item1.cantidad * item1.precioUnitario;
    const total2 = item2.cantidad * item2.precioUnitario;

    await SM.registerSale([item1], 'efectivo', total1);
    await SM.registerSale([item2], 'efectivo', total2);

    const top = await SM.getTopSellingProducts(5);
    expect(Array.isArray(top)).toBe(true);
    expect(top.length).toBeGreaterThan(0);

    const fila = top[0];
    expect(fila).toHaveProperty('nombre');
    expect(fila).toHaveProperty('total_vendido');
    expect(Number(fila.total_vendido)).toBeGreaterThan(0);
  });

  test('getSalesStats devuelve estadísticas de ventas', async () => {
    const item = await crearItemBasico(1);
    const total = item.cantidad * item.precioUnitario;

    await SM.registerSale([item], 'efectivo', total);
    await SM.registerSale([item], 'tarjeta', total);

    const stats = await SM.getSalesStats(7);
    expect(Array.isArray(stats)).toBe(true);
    expect(stats.length).toBeGreaterThan(0);

    const dia = stats[0];
    expect(dia).toHaveProperty('fecha');
    expect(Number(dia.total_ventas)).toBeGreaterThan(0);
    expect(Number(dia.ingresos_totales)).toBeGreaterThan(0);
  });
});
