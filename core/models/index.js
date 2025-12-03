// core/models/index.js
const sequelize = require('../../database/sequelize');
const Product = require('./Product');
const Sale = require('./Sale');
const SaleDetail = require('./SaleDetail');

// Relaciones
Sale.hasMany(SaleDetail, { foreignKey: 'venta_id', as: 'detalles' });
SaleDetail.belongsTo(Sale, { foreignKey: 'venta_id', as: 'venta' });

Product.hasMany(SaleDetail, { foreignKey: 'producto_id', as: 'detalles' });
SaleDetail.belongsTo(Product, { foreignKey: 'producto_id', as: 'producto' });

async function initDatabase() {
  await sequelize.sync();

  const count = await Product.count();
  if (count === 0) {
    await Product.bulkCreate([
      { nombre: 'Arroz Diana 1kg', precio_compra: 2.5, precio_venta: 3.5, stock: 20, categoria: 'Abarrotes' },
      { nombre: 'Aceite Girasol 1L', precio_compra: 4.0, precio_venta: 5.5, stock: 15, categoria: 'Abarrotes' },
      { nombre: 'Leche Entera 1L', precio_compra: 2.0, precio_venta: 3.0, stock: 10, categoria: 'Lácteos' },
      { nombre: 'Pan Bimbo Grande', precio_compra: 3.5, precio_venta: 5.0, stock: 8, categoria: 'Panadería' },
      { nombre: 'Jabón Rey 3un', precio_compra: 1.5, precio_venta: 2.5, stock: 25, categoria: 'Limpieza' },
    ]);
  }
}

module.exports = { sequelize, Product, Sale, SaleDetail, initDatabase };
