// core/managers/ProductManager.js
const { Product } = require('../models');

class ProductManager {
  async addProduct(data) {
    try {
      const product = await Product.create({
        nombre: data.nombre,
        categoria: data.categoria || 'General',
        precio_compra: Number(data.precio_compra),
        precio_venta: Number(data.precio_venta),
        stock: Number(data.stock ?? 0),
        stock_minimo: Number(data.stock_minimo ?? 5),
        codigo_barras: data.codigo_barras || null,
      });

      // 🔹 Devolver objeto plano para que el renderer lo entienda
      return product.toJSON();
    } catch (e) {
      throw new Error(`Error al agregar producto: ${e.message}`);
    }
  }

  async getAllProducts() {
    try {
      const products = await Product.findAll({
        where: { activo: true },
        order: [['id', 'ASC']],
      });

      // 🔹 Convertir cada instancia de Sequelize en objeto plano
      return products.map((p) => p.toJSON());
    } catch (e) {
      throw new Error(`Error al obtener productos: ${e.message}`);
    }
  }

  async getProductById(id) {
    try {
      const product = await Product.findOne({ where: { id, activo: true } });
      // Puede ser null si no existe
      return product ? product.toJSON() : null;
    } catch (e) {
      throw new Error(`Error al obtener producto: ${e.message}`);
    }
  }

  async updateProduct(id, changes) {
    try {
      await Product.update(changes, { where: { id } });
      // Reusar getProductById, que ya devuelve objeto plano
      return this.getProductById(id);
    } catch (e) {
      throw new Error(`Error al actualizar: ${e.message}`);
    }
  }

  async deleteProduct(id) {
    try {
      await Product.update({ activo: false }, { where: { id } });
      return true;
    } catch (e) {
      throw new Error(`Error al eliminar: ${e.message}`);
    }
  }

  async getLowStockProducts() {
    const products = await Product.findAll({ where: { activo: true } });
    // Aquí seguimos trabajando en el proceso main, así que no hay problema
    return products
      .map((p) => p.toJSON())
      .filter((p) => p.stock <= p.stock_minimo);
  }
}

module.exports = ProductManager;
