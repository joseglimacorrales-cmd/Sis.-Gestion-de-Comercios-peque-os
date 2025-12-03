// core/models/Product.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../database/sequelize');

const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo_barras: { type: DataTypes.STRING, unique: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    categoria: { type: DataTypes.STRING, defaultValue: 'General' },
    precio_compra: { type: DataTypes.FLOAT, allowNull: false },
    precio_venta: { type: DataTypes.FLOAT, allowNull: false },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    stock_minimo: { type: DataTypes.INTEGER, defaultValue: 5 },
    proveedor: { type: DataTypes.STRING },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: 'productos', timestamps: false }
);

module.exports = Product;
