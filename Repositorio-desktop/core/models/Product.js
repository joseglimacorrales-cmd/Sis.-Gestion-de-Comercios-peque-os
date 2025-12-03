const { v4: uuidv4 } = require('uuid');

class Product {
    constructor(id, nombre, precioCompra, precioVenta, stock, categoria = 'General', codigoBarras = null, stockMinimo = 5) {
        this.id = id || uuidv4();
        this.nombre = nombre;
        this.precioCompra = precioCompra;
        this.precioVenta = precioVenta;
        this.stock = stock;
        this.categoria = categoria;
        this.codigoBarras = codigoBarras;
        this.stockMinimo = stockMinimo;
        this.activo = true;
        this.fechaCreacion = new Date();
    }

    // Metodo para validar el producto
    isValid() {
        return this.nombre && this.precioCompra > 0 && this.precioVenta > 0 && this.stock >= 0;
    }

    // Metodo para verificar stock bajo
    hasLowStock() {
        return this.stock <= this.stockMinimo;
    }
}

module.exports = Product;