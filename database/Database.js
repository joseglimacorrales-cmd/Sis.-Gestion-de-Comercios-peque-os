const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseHandler {
    constructor() {
        // Ruta a la base de datos (se crea automaticamente si no existe)
        this.dbPath = path.join(__dirname, '../database/tienda.db');
        
        // Asegurar que la carpeta database existe
        const dbDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        
        // Conectar a la base de datos
        this.db = new Database(this.dbPath);
        
        // Habilitar foreign keys y otras configuraciones
        this.db.pragma('foreign_keys = ON');
        this.db.pragma('journal_mode = WAL');
        
        console.log('✅ Base de datos conectada:', this.dbPath);
        this.initDatabase();
    }

    // Inicializar la base de datos con las tablas necesarias
    initDatabase() {
        try {
            // Leer el schema SQL
            const schemaPath = path.join(__dirname, 'schema.sql');
            let schemaSQL;
            
            if (fs.existsSync(schemaPath)) {
                schemaSQL = fs.readFileSync(schemaPath, 'utf8');
            } else {
                // Schema por defecto si no existe el archivo
                schemaSQL = `
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

                    -- Insertar algunos productos de ejemplo
                    INSERT OR IGNORE INTO productos (nombre, precio_compra, precio_venta, stock, categoria) VALUES
                    ('Arroz Diana 1kg', 2.50, 3.50, 20, 'Abarrotes'),
                    ('Aceite Girasol 1L', 4.00, 5.50, 15, 'Abarrotes'),
                    ('Leche Entera 1L', 2.00, 3.00, 10, 'Lácteos'),
                    ('Pan Bimbo Grande', 3.50, 5.00, 8, 'Panadería'),
                    ('Jabón Rey 3un', 1.50, 2.50, 25, 'Limpieza');
                `;
            }

            // Ejecutar el schema
            this.db.exec(schemaSQL);
            console.log('✅ Tablas de la base de datos inicializadas');

        } catch (error) {
            console.error('❌ Error al inicializar la base de datos:', error.message);
            throw error;
        }
    }

    // Método para obtener la conexión a la base de datos
    getConnection() {
        return this.db;
    }

    // Cerrar la conexión
    close() {
        if (this.db) {
            this.db.close();
            console.log('✅ Conexión a la base de datos cerrada');
        }
    }

    // Método para hacer backups
    backup(backupPath = null) {
        const backupDir = backupPath || path.join(__dirname, '../../database/backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `backup-${timestamp}.db`);

        this.db.backup(backupFile)
            .then(() => {
                console.log('✅ Backup creado:', backupFile);
            })
            .catch((error) => {
                console.error('❌ Error creando backup:', error);
            });
    }
}

// Exportar una única instancia (singleton)
module.exports = new DatabaseHandler();