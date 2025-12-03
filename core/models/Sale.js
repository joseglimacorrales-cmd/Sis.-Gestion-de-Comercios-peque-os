// core/models/Sale.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../database/sequelize');

const Sale = sequelize.define(
  'Sale',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fecha_hora: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0.01 },
    },
    pago_efectivo: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: { min: 0 },
    },
    pago_tarjeta: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: { min: 0 },
    },
    pago_transferencia: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: { min: 0 },
    },
    cambio: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: { min: 0 },
    },
    activa: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: 'ventas', timestamps: false }
);

module.exports = Sale;
