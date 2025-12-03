// core/orm/SaleORM.js
const db = require('../../database/Database');

class SaleORM {
    constructor() {
        this.db = db.getConnection();
    }

    // Registrar venta en la base de datos (ya con Sale validada)
    registerSale(sale, productosVenta) {
        try {
            // INICIAR TRANSACCIÓN
            this.db.exec('BEGIN TRANSACTION');

            try {
                // 1. Insertar la venta principal
                const ventaStmt = this.db.prepare(`
                    INSERT INTO ventas (total, pago_efectivo, pago_tarjeta, pago_transferencia, cambio)
                    VALUES (?, ?, ?, ?, ?)
                `);

                const ventaResult = ventaStmt.run(
                    sale.total,
                    sale.pagoEfectivo,
                    sale.pagoTarjeta,
                    sale.pagoTransferencia,
                    sale.cambio
                );

                const ventaId = ventaResult.lastInsertRowid;

                // 2. Insertar detalles de la venta y actualizar stock
                const detalleStmt = this.db.prepare(`
                    INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal)
                    VALUES (?, ?, ?, ?, ?)
                `);

                const updateStockStmt = this.db.prepare(`
                    UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?
                `);

                for (const item of productosVenta) {
                    // Verificar stock nuevamente (por si cambió durante la transacción)
                    const productStmt = this.db.prepare(
                        'SELECT stock FROM productos WHERE id = ?'
                    );
                    const product = productStmt.get(item.productoId);

                    if (!product || product.stock < item.cantidad) {
                        throw new Error(
                            `Stock insuficiente para ${item.nombre}. Disponible: ${
                                product ? product.stock : 0
                            }`
                        );
                    }

                    // Insertar detalle
                    detalleStmt.run(
                        ventaId,
                        item.productoId,
                        item.cantidad,
                        item.precioUnitario,
                        item.subtotal
                    );

                    // Actualizar stock
                    const updateResult = updateStockStmt.run(
                        item.cantidad,
                        item.productoId,
                        item.cantidad
                    );

                    if (updateResult.changes === 0) {
                        throw new Error(
                            `Error al actualizar stock de ${item.nombre}`
                        );
                    }
                }

                // CONFIRMAR TRANSACCIÓN
                this.db.exec('COMMIT');

                return {
                    id: ventaId,
                    total: sale.total,
                    cambio: sale.cambio,
                    productos: productosVenta.length,
                    mensaje: `✅ Venta registrada exitosamente. Cambio: Bs.${sale.cambio.toFixed(
                        2
                    )}`,
                };
            } catch (error) {
                // REVERTIR en caso de error
                this.db.exec('ROLLBACK');
                throw new Error(`Error en transaccion: ${error.message}`);
            }
        } catch (error) {
            throw new Error(
                `Error al registrar venta en la base de datos: ${error.message}`
            );
        }
    }

    // Ventas de hoy
    getTodaySales() {
        try {
            const stmt = this.db.prepare(`
                SELECT 
                    v.*, 
                    COUNT(dv.id) as total_productos,
                    GROUP_CONCAT(p.nombre) as productos_nombres
                FROM ventas v
                LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
                LEFT JOIN productos p ON dv.producto_id = p.id
                WHERE DATE(v.fecha_hora) = DATE('now')
                GROUP BY v.id
                ORDER BY v.fecha_hora DESC
            `);
            return stmt.all();
        } catch (error) {
            throw new Error(
                `Error al obtener ventas del dia: ${error.message}`
            );
        }
    }

    // Detalle de una venta
    getSaleDetail(ventaId) {
        try {
            const ventaStmt = this.db.prepare(
                'SELECT * FROM ventas WHERE id = ?'
            );
            const venta = ventaStmt.get(ventaId);

            if (!venta) {
                throw new Error('Venta no encontrada');
            }

            const detalleStmt = this.db.prepare(`
                SELECT 
                    dv.*, 
                    p.nombre as producto_nombre,
                    p.codigo_barras
                FROM detalle_ventas dv
                JOIN productos p ON dv.producto_id = p.id
                WHERE dv.venta_id = ?
            `);
            const detalles = detalleStmt.all(ventaId);

            return {
                venta,
                detalles,
            };
        } catch (error) {
            throw new Error(
                `Error al obtener detalle de venta: ${error.message}`
            );
        }
    }

    // Productos más vendidos
    getTopSellingProducts(limit = 5) {
        try {
            const stmt = this.db.prepare(`
                SELECT 
                    p.nombre,
                    p.categoria,
                    SUM(dv.cantidad) as total_vendido,
                    SUM(dv.subtotal) as total_ingresos
                FROM detalle_ventas dv
                JOIN productos p ON dv.producto_id = p.id
                GROUP BY p.id, p.nombre, p.categoria
                ORDER BY total_vendido DESC
                LIMIT ?
            `);
            return stmt.all(limit);
        } catch (error) {
            throw new Error(
                `Error al obtener productos mas vendidos: ${error.message}`
            );
        }
    }

    // Estadísticas de ventas para N días
    getSalesStats(days = 7) {
        try {
            const stmt = this.db.prepare(`
                SELECT 
                    DATE(fecha_hora) as fecha,
                    COUNT(*) as total_ventas,
                    SUM(total) as ingresos_totales,
                    AVG(total) as promedio_por_venta
                FROM ventas 
                WHERE fecha_hora >= DATE('now', ?)
                GROUP BY DATE(fecha_hora)
                ORDER BY fecha DESC
            `);
            return stmt.all(`-${days} days`);
        } catch (error) {
            throw new Error(
                `Error al obtener estadísticas: ${error.message}`
            );
        }
    }

    // Cancelar venta (restaurar stock + marcar inactiva)
    cancelSale(ventaId) {
        try {
            this.db.exec('BEGIN TRANSACTION');

            const detalleStmt = this.db.prepare(
                'SELECT * FROM detalle_ventas WHERE venta_id = ?'
            );
            const detalles = detalleStmt.all(ventaId);

            const restoreStockStmt = this.db.prepare(
                'UPDATE productos SET stock = stock + ? WHERE id = ?'
            );

            for (const detalle of detalles) {
                restoreStockStmt.run(detalle.cantidad, detalle.producto_id);
            }

            const cancelStmt = this.db.prepare(
                'UPDATE ventas SET activa = 0 WHERE id = ?'
            );
            cancelStmt.run(ventaId);

            this.db.exec('COMMIT');

            return { mensaje: '✅ Venta cancelada exitosamente' };
        } catch (error) {
            this.db.exec('ROLLBACK');
            throw new Error(`Error al cancelar venta: ${error.message}`);
        }
    }

    // Ventas semanales (últimos 7 días)
    getWeeklySales() {
        try {
            const stmt = this.db.prepare(`
                SELECT 
                    DATE(fecha_hora) as fecha,
                    COUNT(*) as total_ventas,
                    SUM(total) as ingresos_totales,
                    AVG(total) as promedio_por_venta,
                    SUM(pago_efectivo) as total_efectivo,
                    SUM(pago_tarjeta) as total_tarjeta,
                    SUM(pago_transferencia) as total_transferencia
                FROM ventas 
                WHERE fecha_hora >= DATE('now', '-7 days')
                GROUP BY DATE(fecha_hora)
                ORDER BY fecha DESC
            `);

            const ventasPorDia = stmt.all();

            const totalSemana = ventasPorDia.reduce(
                (acc, dia) => {
                    acc.total_ventas += dia.total_ventas;
                    acc.ingresos_totales += dia.ingresos_totales;
                    acc.total_efectivo += dia.total_efectivo;
                    acc.total_tarjeta += dia.total_tarjeta;
                    acc.total_transferencia += dia.total_transferencia;
                    return acc;
                },
                {
                    total_ventas: 0,
                    ingresos_totales: 0,
                    total_efectivo: 0,
                    total_tarjeta: 0,
                    total_transferencia: 0,
                }
            );

            return {
                ventasPorDia,
                totalesSemana: totalSemana,
            };
        } catch (error) {
            throw new Error(
                `Error al obtener ventas semanales: ${error.message}`
            );
        }
    }

    // Ventas mensuales (últimos 30 días)
    getMonthlySales() {
        try {
            const stmt = this.db.prepare(`
                SELECT 
                    strftime('%Y-%m', fecha_hora) as mes,
                    COUNT(*) as total_ventas,
                    SUM(total) as ingresos_totales,
                    AVG(total) as promedio_por_venta,
                    SUM(pago_efectivo) as total_efectivo,
                    SUM(pago_tarjeta) as total_tarjeta,
                    SUM(pago_transferencia) as total_transferencia
                FROM ventas 
                WHERE fecha_hora >= DATE('now', '-30 days')
                GROUP BY strftime('%Y-%m', fecha_hora)
                ORDER BY mes DESC
            `);
            return stmt.all();
        } catch (error) {
            throw new Error(
                `Error al obtener ventas mensuales: ${error.message}`
            );
        }
    }

    // Productos con stock bajo (para PDF)
    getLowStockProductsByCategory() {
        try {
            const stmt = this.db.prepare(`
                SELECT 
                    categoria,
                    nombre,
                    stock,
                    stock_minimo,
                    precio_compra,
                    precio_venta,
                    (stock_minimo - stock) as faltante
                FROM productos 
                WHERE stock <= stock_minimo 
                    AND activo = TRUE
                ORDER BY categoria, faltante DESC
            `);
            return stmt.all();
        } catch (error) {
            throw new Error(
                `Error al obtener productos con stock bajo: ${error.message}`
            );
        }
    }
}

module.exports = new SaleORM();
