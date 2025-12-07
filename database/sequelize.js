const { Sequelize } = require('sequelize');
const path = require('path');
const dbPath = path.join(__dirname, 'tienda.db');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
});

module.exports = sequelize;
