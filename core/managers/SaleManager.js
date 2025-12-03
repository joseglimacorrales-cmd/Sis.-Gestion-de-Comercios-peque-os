// core/managers/SaleManager.js
const { sequelize, Product, Sale, SaleDetail } = require('../models');
const { Op } = require('sequelize');

class SaleManager {
  // ====== HELPERS DE VALIDACIÓN ======

  _ensureArray(value, fieldName) {
    if (!Array.isArray(value)) {
      throw new Error(`"${fieldName}" debe ser un arreglo.`);
    }
    return value;
  }

  _parseNumber(value, fieldName, { min = null, max = null } = {}) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      throw new Error(`El campo "${fieldName}" debe ser un número válido.`);
    }
    if (min !== null && n < min) {
      throw new Error(`El campo "${fieldName}" debe ser ≥ ${min}.`);
    }
    if (max !== null && n > max) {
      throw new Error(
        `El campo "${fieldName}" es demasiado grande (máx: ${max}).`
      );
    }
    return n;
  }

  _parseInt(value, fieldName, { min = null, max = null } = {}) {
    const n = Number.parseInt(value, 10);
    if (!Number.isInteger(n)) {
      throw new Error(`El campo "${fieldName}" debe ser un entero.`);
    }
    if (min !== null && n < min) {
      throw new Error(`El campo "${fieldName}" debe ser ≥ ${min}.`);
    }
    if (max !== null && n > max) {
      throw new Error(
        `El campo "${fieldName}" es demasiado grande (máx: ${max}).`
      );
    }
    return n;
  }

  _validatePaymentMethod(metodo) {
    const validos = ['efectivo', 'tarjeta', 'transferencia'];
    if (!validos.includes(metodo)) {
      throw new Error(
        `Método de pago inválido. Debe ser uno de: ${validos.join(', ')}.`
      );
    }
  }

  // ====== REGISTRAR VENTA ======

  async registerSale(items, metodoPago, monto) {
    // Validaciones de entrada
    this._ensureArray(items, 'items');

    if (!items.length) {
      throw new Error('No hay productos en la venta.');
    }

    this._validatePaymentMethod(metodoPago);
    const montoNumber = this._parseNumber(monto, 'Monto recibido', {
      min: 0,
    });

    // Validar items y recalcular subtotales
    const itemsNormalizados = items.map((i, idx) => {
      const index = idx + 1;

      if (!i || typeof i !== 'object') {
        throw new Error(`Item ${index} de la venta es inválido.`);
      }

      const productoId = this._parseInt(
        i.productoId ?? i.producto_id,
        `ProductoId (item ${index})`,
        { min: 1 }
      );
      const cantidad = this._parseInt(
        i.cantidad,
        `Cantidad (item ${index})`,
        { min: 1 }
      );
      const precioUnitario = this._parseNumber(
        i.precioUnitario ?? i.precio_unitario,
        `Precio unitario (item ${index})`,
        { min: 0.01 }
      );

      const subtotal = cantidad * precioUnitario;

      return {
        productoId,
        cantidad,
        precioUnitario,
        subtotal,
        nombre: i.nombre || '',
      };
    });

    const total = itemsNormalizados.reduce(
      (s, i) => s + i.subtotal,
      0
    );

    if (montoNumber < total) {
      throw new Error(
        `Monto insuficiente. Total: ${total.toFixed(
          2
        )}, recibido: ${montoNumber.toFixed(2)}.`
      );
    }

    const cambio = montoNumber - total;

    const t = await sequelize.transaction();

    try {
      const pago = {
        pago_efectivo: 0,
        pago_tarjeta: 0,
        pago_transferencia: 0,
      };
      pago[`pago_${metodoPago}`] = montoNumber;

      // Crear venta
      const venta = await Sale.create(
        {
          total,
          cambio,
          ...pago,
        },
        { transaction: t }
      );

      // Procesar items
      for (const item of itemsNormalizados) {
        const prod = await Product.findByPk(item.productoId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!prod || !prod.activo) {
          throw new Error(
            `Producto con ID ${item.productoId} no encontrado o inactivo.`
          );
        }

        if (prod.stock < item.cantidad) {
          throw new Error(
            `Stock insuficiente de "${prod.nombre}". Disponible: ${prod.stock}, solicitado: ${item.cantidad}.`
          );
        }

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

        await prod.update(
          { stock: prod.stock - item.cantidad },
          { transaction: t }
        );
      }

      await t.commit();

      return {
        id: venta.id,
        total,
        cambio,
        productos: itemsNormalizados.length,
      };
    } catch (err) {
      await t.rollback();
      throw new Error('Error en venta → ' + err.message);
    }
  }

  // ====== CONSULTAS DE VENTAS ======

  async getTodaySales() {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 1);

    const ventas = await Sale.findAll({
      where: {
        fecha_hora: { [Op.between]: [inicio, fin] },
        activa: true,
      },
      include: [{ model: SaleDetail, as: 'detalles', include: ['producto'] }],
      order: [['fecha_hora', 'ASC']],
    });

    return ventas.map((v) => ({
      id: v.id,
      fecha_hora: v.fecha_hora,
      total: v.total,
      total_productos: v.detalles.reduce(
        (s, d) => s + d.cantidad,
        0
      ),
    }));
  }

  async getTopSellingProducts(limit = 10) {
    const limitNum = this._parseInt(limit, 'Límite', { min: 1, max: 100 });

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
      { replacements: { limit: limitNum } }
    );

    return rows;
  }

  async getSalesStats(days = 30) {
    const daysInt = this._parseInt(days, 'Días', {
      min: 1,
      max: 365,
    });

    const [rows] = await sequelize.query(
      `
      SELECT DATE(fecha_hora) as fecha,
             COUNT(*) as total_ventas,
             SUM(total) as ingresos_totales,
             AVG(total) as promedio_por_venta
      FROM ventas
      WHERE activa = 1 AND fecha_hora >= DATE('now', :offset)
      GROUP BY DATE(fecha_hora)
      ORDER BY fecha ASC
    `,
      { replacements: { offset: `-${daysInt} days` } }
    );

    return rows;
  }

  // ====== CANCELAR VENTA ======

  async cancelSale(id) {
    const ventaId = this._parseInt(id, 'ID de venta', { min: 1 });

    const t = await sequelize.transaction();

    try {
      const venta = await Sale.findByPk(ventaId, {
        include: [{ model: SaleDetail, as: 'detalles' }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!venta) {
        throw new Error('Venta no encontrada.');
      }

      if (!venta.activa) {
        throw new Error('La venta ya fue cancelada previamente.');
      }

      // Reponer stock
      for (const d of venta.detalles) {
        const prod = await Product.findByPk(d.producto_id, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!prod) continue;

        await prod.update(
          { stock: prod.stock + d.cantidad },
          { transaction: t }
        );
      }

      await venta.update({ activa: false }, { transaction: t });

      await t.commit();
      return { mensaje: 'Venta cancelada' };
    } catch (e) {
      await t.rollback();
      throw new Error('Error al cancelar: ' + e.message);
    }
  }

  // ====== STOCK BAJO POR CATEGORÍA ======

  async getLowStockProductsByCategory() {
    const productos = await Product.findAll({
      where: { activo: true },
      order: [['categoria', 'ASC'], ['nombre', 'ASC']],
    });

    const bajos = productos.filter((p) => {
      const minimo = p.stock_minimo ?? 5;
      return p.stock <= minimo;
    });

    return bajos
      .map((p) => {
        const minimo = p.stock_minimo ?? 5;
        const faltante = Math.max(0, minimo - p.stock);

        return {
          categoria: p.categoria,
          nombre: p.nombre,
          stock: p.stock,
          stock_minimo: minimo,
          precio_compra: p.precio_compra,
          precio_venta: p.precio_venta,
          faltante,
        };
      })
      .sort(
        (a, b) =>
          a.categoria.localeCompare(b.categoria) ||
          b.faltante - a.faltante
      );
  }
}

module.exports = SaleManager;
