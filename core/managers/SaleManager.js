// core/managers/SaleManager.js
const { sequelize, Product, Sale, SaleDetail } = require('../models');
const { Op } = require('sequelize');

class SaleManager {
  async registerSale(items, metodoPago, monto) {
    if (!items.length) throw new Error('No hay productos en la venta.');

    const total = items.reduce((s, i) => s + i.subtotal, 0);

    if (monto < total) throw new Error('Monto insuficiente.');

    const cambio = monto - total;

    const t = await sequelize.transaction();

    try {
      const pago = { pago_efectivo: 0, pago_tarjeta: 0, pago_transferencia: 0 };
      pago[`pago_${metodoPago}`] = monto;

      const venta = await Sale.create({ total, cambio, ...pago }, { transaction: t });

      for (const item of items) {
        const prod = await Product.findByPk(item.productoId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!prod || prod.stock < item.cantidad)
          throw new Error(`Stock insuficiente de ${item.nombre}`);

        await SaleDetail.create(
          {
            venta_id: venta.id,
            producto_id: prod.id,
            cantidad: item.cantidad,
            precio_unitario: item.precioUnitario,
            subtotal: item.subtotal,
          },
          { transaction: t }
        );

        await prod.update({ stock: prod.stock - item.cantidad }, { transaction: t });
      }

      await t.commit();

      return { id: venta.id, total, cambio, productos: items.length };
    } catch (err) {
      await t.rollback();
      throw new Error('Error en venta → ' + err.message);
    }
  }

  async getTodaySales() {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 1);

    const ventas = await Sale.findAll({
      where: { fecha_hora: { [Op.between]: [inicio, fin] }, activa: true },
      include: [{ model: SaleDetail, as: 'detalles', include: ['producto'] }],
    });

    return ventas.map((v) => ({
      id: v.id,
      fecha_hora: v.fecha_hora,
      total: v.total,
      total_productos: v.detalles.reduce((s, d) => s + d.cantidad, 0),
    }));
  }

  async getTopSellingProducts(limit = 10) {
    const [rows] = await sequelize.query(
      `
      SELECT p.nombre, p.categoria,
             SUM(dv.cantidad) AS total_vendido,
             SUM(dv.subtotal) AS total_ingresos
      FROM detalle_ventas dv
      JOIN productos p ON p.id = dv.producto_id
      GROUP BY p.id
      ORDER BY total_vendido DESC
      LIMIT :limit
    `,
      { replacements: { limit } }
    );

    return rows;
  }

  async getSalesStats(days = 30) {
    const [rows] = await sequelize.query(
      `
      SELECT DATE(fecha_hora) as fecha,
             COUNT(*) as total_ventas,
             SUM(total) as ingresos_totales,
             AVG(total) as promedio_por_venta
      FROM ventas
      WHERE activa = 1 AND fecha_hora >= DATE('now', :offset)
      GROUP BY DATE(fecha_hora)
    `,
      { replacements: { offset: `-${days} days` } }
    );

    return rows;
  }

  async cancelSale(id) {
    const t = await sequelize.transaction();

    try {
      const venta = await Sale.findByPk(id, {
        include: [{ model: SaleDetail, as: 'detalles' }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!venta) throw new Error('Venta no encontrada');

      for (const d of venta.detalles) {
        const prod = await Product.findByPk(d.producto_id, { transaction: t });
        await prod.update({ stock: prod.stock + d.cantidad }, { transaction: t });
      }

      await venta.update({ activa: false }, { transaction: t });

      await t.commit();
      return { mensaje: 'Venta cancelada' };
    } catch (e) {
      await t.rollback();
      throw new Error('Error al cancelar: ' + e.message);
    }
  }

  async getLowStockProductsByCategory() {
    const productos = await Product.findAll({ where: { activo: true } });
    const bajos = productos.filter((p) => p.stock <= p.stock_minimo);

    return bajos
      .map((p) => ({
        categoria: p.categoria,
        nombre: p.nombre,
        stock: p.stock,
        stock_minimo: p.stock_minimo,
        precio_compra: p.precio_compra,
        precio_venta: p.precio_venta,
        faltante: p.stock_minimo - p.stock,
      }))
      .sort((a, b) =>
        a.categoria.localeCompare(b.categoria) || b.faltante - a.faltante
      );
  }
}

module.exports = SaleManager;
