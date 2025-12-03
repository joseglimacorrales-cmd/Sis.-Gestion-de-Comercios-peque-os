// core/managers/SaleManager.js
const Sale = require('../models/Sale');
const SaleORM = require('../orm/SaleORM');

class SaleManager {
    constructor() {
        // Ya no usamos this.db aquí
    }

    // REGISTRAR VENTA - Método principal
    registerSale(productosVenta, metodoPago, montoRecibido) {
        try {
            // Validaciones básicas sin tocar la base de datos
            if (!productosVenta || productosVenta.length === 0) {
                throw new Error('La venta debe incluir al menos un producto');
            }

            if (montoRecibido <= 0) {
                throw new Error('El monto recibido debe ser mayor a 0');
            }

            // Usar el modelo Sale para los cálculos de negocio
            const sale = new Sale();
            sale.productos = productosVenta;
            sale.calcularTotal();
            sale.setMetodoPago(metodoPago, montoRecibido);
            sale.calcularCambio(montoRecibido);

            if (!sale.isValid()) {
                throw new Error('La venta no es valida');
            }

            if (montoRecibido < sale.total) {
                throw new Error(
                    `Monto insuficiente. Total: Bs.${sale.total}, Recibido: Bs.${montoRecibido}`
                );
            }

            // Persistencia delegada completamente al ORM
            return SaleORM.registerSale(sale, productosVenta);
        } catch (error) {
            throw new Error(`Error al registrar venta: ${error.message}`);
        }
    }

    // OBTENER VENTAS DEL DÍA
    getTodaySales() {
        return SaleORM.getTodaySales();
    }

    // OBTENER DETALLE DE UNA VENTA
    getSaleDetail(ventaId) {
        return SaleORM.getSaleDetail(ventaId);
    }

    // OBTENER PRODUCTOS MÁS VENDIDOS
    getTopSellingProducts(limit = 5) {
        return SaleORM.getTopSellingProducts(limit);
    }

    // OBTENER ESTADISTICAS DE VENTAS
    getSalesStats(days = 7) {
        return SaleORM.getSalesStats(days);
    }

    // CANCELAR VENTA
    cancelSale(ventaId) {
        return SaleORM.cancelSale(ventaId);
    }

    // OBTENER VENTAS SEMANALES
    getWeeklySales() {
        return SaleORM.getWeeklySales();
    }

    // OBTENER VENTAS MENSUALES
    getMonthlySales() {
        return SaleORM.getMonthlySales();
    }

    // OBTENER PRODUCTOS CON STOCK BAJO (para el PDF)
    getLowStockProductsByCategory() {
        return SaleORM.getLowStockProductsByCategory();
    }
}

module.exports = SaleManager;
