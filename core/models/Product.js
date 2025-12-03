// core/models/Product.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../database/sequelize');

const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo_barras: { type: DataTypes.STRING, unique: true },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      // Pon unique: true solo cuando ya no haya repetidos
      // unique: true,
      validate: {
        len: [3, 80],
      },
    },
    descripcion: { type: DataTypes.TEXT },
    categoria: {
      type: DataTypes.STRING,
      defaultValue: 'General',
      validate: {
        len: [0, 40],
      },
    },
    precio_compra: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0.01 },
    },
    precio_venta: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0.01 },
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    stock_minimo: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      validate: { min: 0 },
    },
    proveedor: { type: DataTypes.STRING },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: 'productos', timestamps: false }
);

module.exports = Product;
