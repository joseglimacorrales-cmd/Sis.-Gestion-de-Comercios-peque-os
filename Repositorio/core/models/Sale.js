const { v4: uuidv4 } = require('uuid');

class Sale {
    constructor(id, productos = [], total = 0, metodoPago = 'efectivo', cambio = 0) {
        this.id = id || uuidv4();
        this.fechaHora = new Date();
        this.productos = productos;
        this.total = total;
        this.metodoPago = metodoPago;
        this.pagoEfectivo = 0;
        this.pagoTarjeta = 0;
        this.pagoTransferencia = 0;
        this.cambio = cambio;
    }
// Calcular total basado en los productos
    calcularTotal() {
        this.total = this.productos.reduce((sum, item) => sum + item.subtotal, 0);
        return this.total;
    }

    // Calcular cambio
    calcularCambio(montoRecibido) {
        this.cambio = montoRecibido - this.total;
        return this.cambio > 0 ? this.cambio : 0;
    }

    // Validar que la venta tenga productos
    isValid() {
        return this.productos.length > 0 && this.total > 0;
    }

    // Configurar método de pago
    setMetodoPago(metodo, monto) {
        this.metodoPago = metodo;
        switch (metodo) {
            case 'efectivo':
                this.pagoEfectivo = monto;
                break;
            case 'tarjeta':
                this.pagoTarjeta = monto;
                break;
            case 'transferencia':
                this.pagoTransferencia = monto;
                break;
        }
    }
}

module.exports = Sale;