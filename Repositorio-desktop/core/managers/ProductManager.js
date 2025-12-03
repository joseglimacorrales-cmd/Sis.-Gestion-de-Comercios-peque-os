// core/managers/ProductManager.js
const Product = require('../models/Product');
const ProductORM = require('../orm/ProductORM');

class ProductManager {
    constructor() {
        // Ya no necesitamos this.db aquí
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

            // Persistencia a través del ORM
            return ProductORM.insert(product);
        } catch (error) {
            throw new Error(`Error al agregar producto: ${error.message}`);
        }
    }

    // Obtener todos los productos
    getAllProducts() {
        try {
            return ProductORM.findAllActive();
        } catch (error) {
            throw new Error(`Error al obtener productos: ${error.message}`);
        }
    }

    // Obtener producto por ID
    getProductById(id) {
        try {
            return ProductORM.findById(id);
        } catch (error) {
            throw new Error(`Error al obtener producto: ${error.message}`);
        }
    }

    // Actualizar producto
    updateProduct(id, updateData) {
        try {
            return ProductORM.update(id, updateData);
        } catch (error) {
            throw new Error(`Error al actualizar producto: ${error.message}`);
        }
    }

    // Eliminar producto (soft delete)
    deleteProduct(id) {
        try {
            return ProductORM.softDelete(id);
        } catch (error) {
            throw new Error(`Error al eliminar producto: ${error.message}`);
        }
    }

    // Obtener productos con stock bajo
    getLowStockProducts() {
        try {
            return ProductORM.findLowStock();
        } catch (error) {
            throw new Error(`Error al obtener productos con stock bajo: ${error.message}`);
        }
    }
}

module.exports = ProductManager;
