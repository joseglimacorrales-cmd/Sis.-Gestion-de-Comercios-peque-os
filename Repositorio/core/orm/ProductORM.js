// core/orm/ProductORM.js
const db = require('../../database/Database');

class ProductORM {
    constructor() {
        this.db = db.getConnection();
    }

    // Insertar producto y devolverlo
    insert(product) {
        try {
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

            return this.findById(result.lastInsertRowid);
        } catch (error) {
            throw new Error(`Error al insertar producto en la base de datos: ${error.message}`);
        }
    }

    // Todos los productos activos
    findAllActive() {
        try {
            const stmt = this.db.prepare('SELECT * FROM productos WHERE activo = TRUE');
            return stmt.all();
        } catch (error) {
            throw new Error(`Error al obtener productos de la base de datos: ${error.message}`);
        }
    }

    // Producto por ID
    findById(id) {
        try {
            const stmt = this.db.prepare('SELECT * FROM productos WHERE id = ? AND activo = TRUE');
            return stmt.get(id);
        } catch (error) {
            throw new Error(`Error al obtener producto de la base de datos: ${error.message}`);
        }
    }

    // Actualizar producto
    update(id, updateData) {
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

            return this.findById(id);
        } catch (error) {
            throw new Error(`Error al actualizar producto en la base de datos: ${error.message}`);
        }
    }

    // Soft delete
    softDelete(id) {
        try {
            const stmt = this.db.prepare('UPDATE productos SET activo = FALSE WHERE id = ?');
            stmt.run(id);
            return true;
        } catch (error) {
            throw new Error(`Error al eliminar producto en la base de datos: ${error.message}`);
        }
    }

    // Productos con stock bajo
    findLowStock() {
        try {
            const stmt = this.db.prepare(
                'SELECT * FROM productos WHERE stock <= stock_minimo AND activo = TRUE'
            );
            return stmt.all();
        } catch (error) {
            throw new Error(
                `Error al obtener productos con stock bajo de la base de datos: ${error.message}`
            );
        }
    }
}

module.exports = new ProductORM();
