// core/managers/ProductManager.js
const { Product } = require('../models');

class ProductManager {
  // ========= HELPERS DE VALIDACIÓN =========

  // Valida y convierte a número
  parseNumber(value, fieldName, { min = null, max = null } = {}) {
    const n = Number(value);
    if (Number.isNaN(n)) {
      throw new Error(`El campo "${fieldName}" debe ser un número válido.`);
    }
    if (min !== null && n < min) {
      throw new Error(`El campo "${fieldName}" debe ser ≥ ${min}.`);
    }
    if (max !== null && n > max) {
      throw new Error(
        `El campo "${fieldName}" es demasiado grande (máx: ${max}).`
      );
    }
    return n;
  }

  // Valida texto (trim, longitud mínima/máxima)
  sanitizeText(text, fieldName, { minLen = 0, maxLen = 255 } = {}) {
    const value = (text || '').trim();
    if (minLen > 0 && value.length < minLen) {
      throw new Error(
        `El campo "${fieldName}" debe tener al menos ${minLen} caracteres.`
      );
    }
    if (value.length > maxLen) {
      throw new Error(
        `El campo "${fieldName}" no puede superar ${maxLen} caracteres.`
      );
    }
    return value;
  }

  // ========= CRUD DE PRODUCTOS =========

  async addProduct(data) {
    try {
      // Nombre obligatorio y único
      const nombre = this.sanitizeText(data.nombre, 'Nombre', {
        minLen: 3,
        maxLen: 80,
      });

      const existente = await Product.findOne({
        where: { nombre, activo: true },
      });

      if (existente) {
        throw new Error(
          `Ya existe un producto activo con el nombre "${nombre}".`
        );
      }

      // Categoría (opcional, con límite de longitud)
      const categoria = this.sanitizeText(
        data.categoria || 'General',
        'Categoría',
        { minLen: 0, maxLen: 40 }
      );

      // Números
      const precio_compra = this.parseNumber(
        data.precio_compra,
        'Precio de compra',
        { min: 0.01, max: 1_000_000 }
      );
      const precio_venta = this.parseNumber(
        data.precio_venta,
        'Precio de venta',
        { min: 0.01, max: 1_000_000 }
      );

      if (precio_venta < precio_compra) {
        throw new Error(
          'El precio de venta no puede ser menor que el precio de compra.'
        );
      }

      const stock = this.parseNumber(data.stock ?? 0, 'Stock', {
        min: 0,
        max: 1_000_000,
      });

      const stock_minimo = this.parseNumber(
        data.stock_minimo ?? 5,
        'Stock mínimo',
        { min: 0, max: 1_000_000 }
      );

      // Código de barras (opcional)
      let codigo_barras = (data.codigo_barras || '').trim();
      if (codigo_barras === '') {
        codigo_barras = null;
      } else if (codigo_barras.length > 64) {
        throw new Error(
          'El código de barras no puede superar 64 caracteres.'
        );
      }
      // Si quieres que sea solo numérico, descomenta:
      // if (codigo_barras && !/^[0-9]+$/.test(codigo_barras)) {
      //   throw new Error('El código de barras solo puede contener dígitos.');
      // }

      const creado = await Product.create({
        nombre,
        categoria,
        precio_compra,
        precio_venta,
        stock,
        stock_minimo,
        codigo_barras,
      });

      // 🔁 Devolver objeto plano para que Electron lo serialice bien
      return creado.get({ plain: true });
    } catch (e) {
      throw new Error(`Error al agregar producto: ${e.message}`);
    }
  }

  async getAllProducts() {
    try {
      const productos = await Product.findAll({
        where: { activo: true },
        order: [['id', 'ASC']],
      });

      // 🔁 Convertimos todos a objetos “plain”
      return productos.map((p) => p.get({ plain: true }));
    } catch (e) {
      throw new Error(`Error al obtener productos: ${e.message}`);
    }
  }

  async getProductById(id) {
    try {
      const prod = await Product.findOne({
        where: { id, activo: true },
      });

      // 🔁 Devolver null o el objeto plano
      return prod ? prod.get({ plain: true }) : null;
    } catch (e) {
      throw new Error(`Error al obtener producto: ${e.message}`);
    }
  }

  async updateProduct(id, changes) {
    try {
      const toUpdate = {};

      // Nombre
      if (changes.nombre !== undefined) {
        const nombre = this.sanitizeText(changes.nombre, 'Nombre', {
          minLen: 3,
          maxLen: 80,
        });

        const existente = await Product.findOne({
          where: { nombre, activo: true },
        });

        if (existente && existente.id !== id) {
          throw new Error(
            `Ya existe otro producto activo con el nombre "${nombre}".`
          );
        }

        toUpdate.nombre = nombre;
      }

      // Categoría
      if (changes.categoria !== undefined) {
        toUpdate.categoria = this.sanitizeText(
          changes.categoria,
          'Categoría',
          { minLen: 0, maxLen: 40 }
        );
      }

      // Precios
      if (changes.precio_compra !== undefined) {
        toUpdate.precio_compra = this.parseNumber(
          changes.precio_compra,
          'Precio de compra',
          { min: 0.01, max: 1_000_000 }
        );
      }

      if (changes.precio_venta !== undefined) {
        toUpdate.precio_venta = this.parseNumber(
          changes.precio_venta,
          'Precio de venta',
          { min: 0.01, max: 1_000_000 }
        );
      }

      // Verificar coherencia de precios si se cambió alguno
      if (
        toUpdate.precio_compra !== undefined ||
        toUpdate.precio_venta !== undefined
      ) {
        const actual = await Product.findByPk(id);
        if (!actual) {
          throw new Error('Producto no encontrado.');
        }

        const pc = toUpdate.precio_compra ?? actual.precio_compra;
        const pv = toUpdate.precio_venta ?? actual.precio_venta;

        if (pv < pc) {
          throw new Error(
            'El precio de venta no puede ser menor que el precio de compra.'
          );
        }
      }

      // Stock
      if (changes.stock !== undefined) {
        toUpdate.stock = this.parseNumber(changes.stock, 'Stock', {
          min: 0,
          max: 1_000_000,
        });
      }

      // Stock mínimo
      if (changes.stock_minimo !== undefined) {
        toUpdate.stock_minimo = this.parseNumber(
          changes.stock_minimo,
          'Stock mínimo',
          { min: 0, max: 1_000_000 }
        );
      }

      // Código de barras
      if (changes.codigo_barras !== undefined) {
        let codigo_barras = (changes.codigo_barras || '').trim();
        if (codigo_barras === '') {
          codigo_barras = null;
        } else if (codigo_barras.length > 64) {
          throw new Error(
            'El código de barras no puede superar 64 caracteres.'
          );
        }
        // Validación numérica opcional:
        // if (codigo_barras && !/^[0-9]+$/.test(codigo_barras)) {
        //   throw new Error('El código de barras solo puede contener dígitos.');
        // }

        toUpdate.codigo_barras = codigo_barras;
      }

      // Si no hay cambios, devolver el producto actual (plano)
      if (Object.keys(toUpdate).length === 0) {
        return this.getProductById(id);
      }

      await Product.update(toUpdate, { where: { id } });

      const actualizado = await Product.findByPk(id);
      return actualizado ? actualizado.get({ plain: true }) : null;
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
    try {
      const productos = await Product.findAll({
        where: { activo: true },
        order: [['categoria', 'ASC'], ['nombre', 'ASC']],
      });

      const bajos = productos.filter((p) => {
        const minimo = p.stock_minimo ?? 5;
        return p.stock <= minimo;
      });

      // 🔁 También devolvemos plano por consistencia
      return bajos.map((p) => p.get({ plain: true }));
    } catch (e) {
      throw new Error(
        `Error al obtener productos con stock bajo: ${e.message}`
      );
    }
  }
}

module.exports = ProductManager;
