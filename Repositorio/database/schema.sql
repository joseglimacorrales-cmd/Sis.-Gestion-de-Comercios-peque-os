-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_barras TEXT UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT DEFAULT 'General',
    precio_compra REAL NOT NULL CHECK(precio_compra >= 0),
    precio_venta REAL NOT NULL CHECK(precio_venta >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
    stock_minimo INTEGER DEFAULT 5,
    proveedor TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    total REAL NOT NULL CHECK(total >= 0),
    pago_efectivo REAL DEFAULT 0 CHECK(pago_efectivo >= 0),
    pago_tarjeta REAL DEFAULT 0 CHECK(pago_tarjeta >= 0),
    pago_transferencia REAL DEFAULT 0 CHECK(pago_transferencia >= 0),
    cambio REAL DEFAULT 0 CHECK(cambio >= 0)
);

-- Tabla de detalle de ventas
CREATE TABLE IF NOT EXISTS detalle_ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL CHECK(cantidad > 0),
    precio_unitario REAL NOT NULL CHECK(precio_unitario >= 0),
    subtotal REAL NOT NULL CHECK(subtotal >= 0),
    FOREIGN KEY (venta_id) REFERENCES ventas (id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE
);

-- Indices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_detalle_venta_id ON detalle_ventas(venta_id);