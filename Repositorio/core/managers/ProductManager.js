const Product = require('../models/Product');
const db = require('../../database/Database');

class ProductManager {
    constructor() {
        this.db = db.getConnection();
    }

    // Agregar producto
    addProduct(productData) {
        try {
            const product = new Product(
                null,
                productData.nombre,
                productData.precioCompra,
                productData.precioVenta,
                productData.stock,
                productData.categoria,
                productData.codigoBarras,
                productData.stockMinimo
            );

            if (!product.isValid()) {
                throw new Error('Datos del producto no validos');
            }

            const stmt = this.db.prepare(`
                INSERT INTO productos (nombre, precio_compra, precio_venta, stock, categoria, codigo_barras, stock_minimo)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                product.nombre,
                product.precioCompra,
                product.precioVenta,
                product.stock,
                product.categoria,
                product.codigoBarras,
                product.stockMinimo
            );

            return this.getProductById(result.lastInsertRowid);
        } catch (error) {
            throw new Error(`Error al agregar producto: ${error.message}`);
        }
    }

    // Obtener todos los productos
    getAllProducts() {
        try {
            const stmt = this.db.prepare('SELECT * FROM productos WHERE activo = TRUE');
            return stmt.all();
        } catch (error) {
            throw new Error(`Error al obtener productos: ${error.message}`);
        }
    }

    // Obtener producto por ID
    getProductById(id) {
        try {
            const stmt = this.db.prepare('SELECT * FROM productos WHERE id = ? AND activo = TRUE');
            return stmt.get(id);
        } catch (error) {
            throw new Error(`Error al obtener producto: ${error.message}`);
        }
    }

    // Actualizar producto
    updateProduct(id, updateData) {
        try {
            const fields = [];
            const values = [];

            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    fields.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });

            if (fields.length === 0) {
                throw new Error('No hay datos para actualizar');
            }

            values.push(id);
            const query = `UPDATE productos SET ${fields.join(', ')} WHERE id = ?`;
            const stmt = this.db.prepare(query);
            stmt.run(...values);

            return this.getProductById(id);
        } catch (error) {
            throw new Error(`Error al actualizar producto: ${error.message}`);
        }
    }

    // Eliminar producto
    deleteProduct(id) {
        try {
            const stmt = this.db.prepare('UPDATE productos SET activo = FALSE WHERE id = ?');
            stmt.run(id);
            return true;
        } catch (error) {
            throw new Error(`Error al eliminar producto: ${error.message}`);
        }
    }

    // Obtener productos con stock bajo
    getLowStockProducts() {
        try {
            const stmt = this.db.prepare('SELECT * FROM productos WHERE stock <= stock_minimo AND activo = TRUE');
            return stmt.all();
        } catch (error) {
            throw new Error(`Error al obtener productos con stock bajo: ${error.message}`);
        }
    }
}

module.exports = ProductManager;