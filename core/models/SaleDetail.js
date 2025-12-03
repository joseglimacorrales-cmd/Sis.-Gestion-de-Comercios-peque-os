// core/models/SaleDetail.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../database/sequelize');

const SaleDetail = sequelize.define(
  'SaleDetail',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    venta_id: { type: DataTypes.INTEGER, allowNull: false },
    producto_id: { type: DataTypes.INTEGER, allowNull: false },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    precio_unitario: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0.01 },
    },
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0.01 },
    },
  },
  { tableName: 'detalle_ventas', timestamps: false }
);

module.exports = SaleDetail;
