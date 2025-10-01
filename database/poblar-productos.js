// database/poblar-productos.js
const Database = require('../database/Database');
const ProductManager = require('../core/managers/ProductManager');
const SaleManager = require('../core/managers/SaleManager');

class PobladorProductos {
    constructor() {
        // Usar la instancia singleton de Database
        this.db = Database.getConnection();
        this.productManager = new ProductManager();
        this.saleManager = new SaleManager();
    }

    // Productos típicos de una tienda de barrio
    obtenerProductosEjemplo() {
        return [
            // ... (todo el array de productos se mantiene igual)
            // ABARROTES
            { nombre: "Arroz Diana 1kg", precioCompra: 2.50, precioVenta: 3.50, stock: 20, categoria: "Abarrotes" },
            { nombre: "Azúcar Blanca 1kg", precioCompra: 3.00, precioVenta: 4.00, stock: 15, categoria: "Abarrotes" },
            { nombre: "Aceite Girasol 1L", precioCompra: 8.00, precioVenta: 10.00, stock: 12, categoria: "Abarrotes" },
            { nombre: "Harina PAN 1kg", precioCompra: 4.00, precioVenta: 5.50, stock: 18, categoria: "Abarrotes" },
            { nombre: "Sal Refisal 1kg", precioCompra: 1.50, precioVenta: 2.50, stock: 25, categoria: "Abarrotes" },

            // LÁCTEOS
            { nombre: "Leche Parmalat 1L", precioCompra: 4.50, precioVenta: 6.00, stock: 10, categoria: "Lácteos" },
            { nombre: "Queso Blanco 500g", precioCompra: 12.00, precioVenta: 16.00, stock: 8, categoria: "Lácteos" },
            { nombre: "Mantequilla 250g", precioCompra: 6.00, precioVenta: 8.50, stock: 6, categoria: "Lácteos" },
            { nombre: "Yogurt Natural 1L", precioCompra: 5.00, precioVenta: 7.00, stock: 9, categoria: "Lácteos" },

            // BEBIDAS
            { nombre: "Coca-Cola 2L", precioCompra: 6.00, precioVenta: 8.00, stock: 15, categoria: "Bebidas" },
            { nombre: "Pepsi 2L", precioCompra: 5.50, precioVenta: 7.50, stock: 12, categoria: "Bebidas" },
            { nombre: "Agua Mineral 500ml", precioCompra: 2.00, precioVenta: 3.00, stock: 30, categoria: "Bebidas" },
            { nombre: "Jugo Hit 1L", precioCompra: 4.00, precioVenta: 6.00, stock: 10, categoria: "Bebidas" },
            { nombre: "Café Fama 500g", precioCompra: 12.00, precioVenta: 16.00, stock: 8, categoria: "Bebidas" },

            // ENLATADOS
            { nombre: "Atún Enlatado 200g", precioCompra: 5.00, precioVenta: 7.00, stock: 12, categoria: "Enlatados" },
            { nombre: "Sardinas en Salsa", precioCompra: 3.50, precioVenta: 5.00, stock: 15, categoria: "Enlatados" },
            { nombre: "Maíz Dulce Enlatado", precioCompra: 4.00, precioVenta: 6.00, stock: 10, categoria: "Enlatados" },
            { nombre: "Frijoles Negros Lata", precioCompra: 3.00, precioVenta: 4.50, stock: 14, categoria: "Enlatados" },

            // LIMPIEZA
            { nombre: "Jabón Rey 3un", precioCompra: 4.00, precioVenta: 6.00, stock: 20, categoria: "Limpieza" },
            { nombre: "Detergente Ace 500g", precioCompra: 5.00, precioVenta: 7.50, stock: 12, categoria: "Limpieza" },
            { nombre: "Cloro Clorox 1L", precioCompra: 3.50, precioVenta: 5.00, stock: 18, categoria: "Limpieza" },
            { nombre: "Lavaplatos Axion", precioCompra: 4.50, precioVenta: 6.50, stock: 15, categoria: "Limpieza" },
            { nombre: "Papel Higiénico 4rollos", precioCompra: 8.00, precioVenta: 12.00, stock: 10, categoria: "Limpieza" },

            // SNACKS Y DULCES
            { nombre: "Galletas Oreo", precioCompra: 3.00, precioVenta: 4.50, stock: 25, categoria: "Snacks" },
            { nombre: "Papas Margarita", precioCompra: 2.50, precioVenta: 4.00, stock: 20, categoria: "Snacks" },
            { nombre: "Chocolate Hershey's", precioCompra: 2.00, precioVenta: 3.50, stock: 30, categoria: "Snacks" },
            { nombre: "Chicles Trident", precioCompra: 1.50, precioVenta: 2.50, stock: 40, categoria: "Snacks" },
            { nombre: "Mani con Pasas", precioCompra: 3.50, precioVenta: 5.00, stock: 15, categoria: "Snacks" },

            // PANADERÍA
            { nombre: "Pan Bimbo Grande", precioCompra: 6.00, precioVenta: 8.50, stock: 8, categoria: "Panadería" },
            { nombre: "Pan Francés Unidad", precioCompra: 0.50, precioVenta: 1.00, stock: 50, categoria: "Panadería" },
            { nombre: "Tostadas Integrales", precioCompra: 3.00, precioVenta: 4.50, stock: 12, categoria: "Panadería" },

            // CARNES Y EMBUTIDOS
            { nombre: "Jamón de Pierna 500g", precioCompra: 18.00, precioVenta: 24.00, stock: 6, categoria: "Carnes" },
            { nombre: "Salchichas Rancheras", precioCompra: 8.00, precioVenta: 12.00, stock: 10, categoria: "Carnes" },
            { nombre: "Mortadela 500g", precioCompra: 10.00, precioVenta: 14.00, stock: 8, categoria: "Carnes" },

            // HIGIENE PERSONAL
            { nombre: "Pasta Dental Colgate", precioCompra: 4.00, precioVenta: 6.00, stock: 15, categoria: "Higiene" },
            { nombre: "Jabón Dove", precioCompra: 3.00, precioVenta: 4.50, stock: 20, categoria: "Higiene" },
            { nombre: "Shampoo Sedal", precioCompra: 6.00, precioVenta: 9.00, stock: 10, categoria: "Higiene" },
            { nombre: "Desodorante Rexona", precioCompra: 5.00, precioVenta: 7.50, stock: 12, categoria: "Higiene" },

            // 🆕 PRODUCTOS CON STOCK BAJO PARA PROBAR ALERTAS
            { nombre: "Aceite de Oliva 500ml", precioCompra: 15.00, precioVenta: 20.00, stock: 2, categoria: "Abarrotes", stock_minimo: 5 },
            { nombre: "Mermelada de Fresa", precioCompra: 4.00, precioVenta: 6.00, stock: 1, categoria: "Abarrotes", stock_minimo: 5 },
            { nombre: "Leche Condensada", precioCompra: 5.00, precioVenta: 7.00, stock: 3, categoria: "Lácteos", stock_minimo: 5 },
            { nombre: "Queso Parmesano 200g", precioCompra: 8.00, precioVenta: 12.00, stock: 2, categoria: "Lácteos", stock_minimo: 5 },
            { nombre: "Energizante Red Bull", precioCompra: 7.00, precioVenta: 10.00, stock: 4, categoria: "Bebidas", stock_minimo: 5 },
            { nombre: "Jugo de Naranja 1L", precioCompra: 5.00, precioVenta: 7.50, stock: 1, categoria: "Bebidas", stock_minimo: 5 },
            { nombre: "Atún en Aceite", precioCompra: 6.00, precioVenta: 8.50, stock: 3, categoria: "Enlatados", stock_minimo: 5 },
            { nombre: "Sopa en Lata", precioCompra: 3.50, precioVenta: 5.00, stock: 2, categoria: "Enlatados", stock_minimo: 5 },
            { nombre: "Jabón Líquido", precioCompra: 6.00, precioVenta: 9.00, stock: 4, categoria: "Limpieza", stock_minimo: 5 },
            { nombre: "Suavizante de Ropa", precioCompra: 5.00, precioVenta: 7.50, stock: 2, categoria: "Limpieza", stock_minimo: 5 },
            { nombre: "Papas Fritas Artesanales", precioCompra: 4.00, precioVenta: 6.00, stock: 3, categoria: "Snacks", stock_minimo: 5 },
            { nombre: "Barra de Cereal", precioCompra: 2.00, precioVenta: 3.50, stock: 1, categoria: "Snacks", stock_minimo: 5 },
            { nombre: "Pan de Hamburguesa", precioCompra: 4.00, precioVenta: 6.00, stock: 2, categoria: "Panadería", stock_minimo: 5 },
            { nombre: "Tocino 200g", precioCompra: 12.00, precioVenta: 16.00, stock: 4, categoria: "Carnes", stock_minimo: 5 },
            { nombre: "Chorizo Parrillero", precioCompra: 10.00, precioVenta: 14.00, stock: 3, categoria: "Carnes", stock_minimo: 5 },
            { nombre: "Crema Dental Familiar", precioCompra: 5.00, precioVenta: 7.50, stock: 2, categoria: "Higiene", stock_minimo: 5 },
            { nombre: "Gel de Baño", precioCompra: 4.00, precioVenta: 6.00, stock: 1, categoria: "Higiene", stock_minimo: 5 },

            // 🆕 PRODUCTOS CRÍTICOS (stock = 0)
            { nombre: "Café Molido Premium", precioCompra: 15.00, precioVenta: 20.00, stock: 0, categoria: "Bebidas", stock_minimo: 5 },
            { nombre: "Miel de Abeja Pura", precioCompra: 12.00, precioVenta: 16.00, stock: 0, categoria: "Abarrotes", stock_minimo: 5 },
            { nombre: "Queso Crema 200g", precioCompra: 6.00, precioVenta: 9.00, stock: 0, categoria: "Lácteos", stock_minimo: 5 },
            { nombre: "Agua Tónica", precioCompra: 3.00, precioVenta: 4.50, stock: 0, categoria: "Bebidas", stock_minimo: 5 },
            { nombre: "Salsa de Tomate", precioCompra: 4.00, precioVenta: 6.00, stock: 0, categoria: "Enlatados", stock_minimo: 5 }
        ];
    }

    // En la clase PobladorProductos, modifica el método crearVentasDeEjemplo:

// Crear ventas de ejemplo para probar reportes
async crearVentasDeEjemplo() {
    console.log('\n💰 CREANDO VENTAS DE EJEMPLO...');
    
    const productos = this.productManager.getAllProducts();
    // Filtrar solo productos con stock disponible
    const productosConStock = productos.filter(p => p.stock > 0);
    
    if (productosConStock.length === 0) {
        console.log('❌ No hay productos con stock disponible para crear ventas');
        return [];
    }
    
    const ventasCreadas = [];
    
    // Crear ventas de diferentes días para probar reportes
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    const semanaPasada = new Date(hoy);
    semanaPasada.setDate(hoy.getDate() - 3);
    const mesPasado = new Date(hoy);
    mesPasado.setDate(hoy.getDate() - 15);

    // Ventas para hoy
    console.log('\n📅 VENTAS DE HOY:');
    for (let i = 0; i < 5; i++) {
        try {
            const productosVenta = [];
            const cantidadProductos = Math.floor(Math.random() * 3) + 1;
            
            for (let j = 0; j < cantidadProductos; j++) {
                const producto = productosConStock[Math.floor(Math.random() * productosConStock.length)];
                const cantidad = Math.floor(Math.random() * 2) + 1;
                
                // Verificar que no exceda el stock disponible
                const stockDisponible = producto.stock;
                const cantidadFinal = Math.min(cantidad, stockDisponible);
                
                if (cantidadFinal > 0) {
                    productosVenta.push({
                        productoId: producto.id,
                        nombre: producto.nombre,
                        cantidad: cantidadFinal,
                        precioUnitario: producto.precio_venta,
                        subtotal: cantidadFinal * producto.precio_venta
                    });
                }
            }
            
            if (productosVenta.length > 0) {
                const totalVenta = productosVenta.reduce((sum, item) => sum + item.subtotal, 0);
                const montoRecibido = Math.ceil(totalVenta + 10); // Dar un poco más para el cambio
                
                const venta = this.saleManager.registerSale(productosVenta, 'efectivo', montoRecibido);
                ventasCreadas.push(venta);
                console.log(`   ✅ Venta ${i+1}: Bs. ${venta.total} (${productosVenta.length} productos)`);
            }
        } catch (error) {
            console.log(`   ❌ Error en venta ${i+1}: ${error.message}`);
        }
    }

    // Ventas de ayer
    console.log('\n📅 VENTAS DE AYER:');
    for (let i = 0; i < 3; i++) {
        try {
            const productosVenta = [];
            const cantidadProductos = Math.floor(Math.random() * 2) + 1;
            
            for (let j = 0; j < cantidadProductos; j++) {
                const producto = productosConStock[Math.floor(Math.random() * productosConStock.length)];
                const cantidad = Math.floor(Math.random() * 2) + 1;
                
                // Verificar que no exceda el stock disponible
                const stockDisponible = producto.stock;
                const cantidadFinal = Math.min(cantidad, stockDisponible);
                
                if (cantidadFinal > 0) {
                    productosVenta.push({
                        productoId: producto.id,
                        nombre: producto.nombre,
                        cantidad: cantidadFinal,
                        precioUnitario: producto.precio_venta,
                        subtotal: cantidadFinal * producto.precio_venta
                    });
                }
            }
            
            if (productosVenta.length > 0) {
                // Simular fecha de ayer
                const venta = this.simularVentaConFecha(productosVenta, ayer);
                ventasCreadas.push(venta);
                console.log(`   ✅ Venta ${i+1}: Bs. ${venta.total} (${productosVenta.length} productos)`);
            }
        } catch (error) {
            console.log(`   ❌ Error en venta ${i+1}: ${error.message}`);
        }
    }

    // Ventas de la semana pasada
    console.log('\n📅 VENTAS DE HACE 3 DÍAS:');
    for (let i = 0; i < 4; i++) {
        try {
            const productosVenta = [];
            const cantidadProductos = Math.floor(Math.random() * 3) + 1;
            
            for (let j = 0; j < cantidadProductos; j++) {
                const producto = productosConStock[Math.floor(Math.random() * productosConStock.length)];
                const cantidad = Math.floor(Math.random() * 2) + 1;
                
                // Verificar que no exceda el stock disponible
                const stockDisponible = producto.stock;
                const cantidadFinal = Math.min(cantidad, stockDisponible);
                
                if (cantidadFinal > 0) {
                    productosVenta.push({
                        productoId: producto.id,
                        nombre: producto.nombre,
                        cantidad: cantidadFinal,
                        precioUnitario: producto.precio_venta,
                        subtotal: cantidadFinal * producto.precio_venta
                    });
                }
            }
            
            if (productosVenta.length > 0) {
                const venta = this.simularVentaConFecha(productosVenta, semanaPasada);
                ventasCreadas.push(venta);
                console.log(`   ✅ Venta ${i+1}: Bs. ${venta.total} (${productosVenta.length} productos)`);
            }
        } catch (error) {
            console.log(`   ❌ Error en venta ${i+1}: ${error.message}`);
        }
    }

    // Ventas del mes pasado
    console.log('\n📅 VENTAS DE HACE 15 DÍAS:');
    for (let i = 0; i < 6; i++) {
        try {
            const productosVenta = [];
            const cantidadProductos = Math.floor(Math.random() * 4) + 1;
            
            for (let j = 0; j < cantidadProductos; j++) {
                const producto = productosConStock[Math.floor(Math.random() * productosConStock.length)];
                const cantidad = Math.floor(Math.random() * 3) + 1;
                
                // Verificar que no exceda el stock disponible
                const stockDisponible = producto.stock;
                const cantidadFinal = Math.min(cantidad, stockDisponible);
                
                if (cantidadFinal > 0) {
                    productosVenta.push({
                        productoId: producto.id,
                        nombre: producto.nombre,
                        cantidad: cantidadFinal,
                        precioUnitario: producto.precio_venta,
                        subtotal: cantidadFinal * producto.precio_venta
                    });
                }
            }
            
            if (productosVenta.length > 0) {
                const venta = this.simularVentaConFecha(productosVenta, mesPasado);
                ventasCreadas.push(venta);
                console.log(`   ✅ Venta ${i+1}: Bs. ${venta.total} (${productosVenta.length} productos)`);
            }
        } catch (error) {
            console.log(`   ❌ Error en venta ${i+1}: ${error.message}`);
        }
    }

    console.log(`\n💰 TOTAL VENTAS CREADAS: ${ventasCreadas.length}`);
    return ventasCreadas;
}

    // Método auxiliar para simular ventas con fecha específica
    simularVentaConFecha(productosVenta, fecha) {
        try {
            // Calcular total
            const total = productosVenta.reduce((sum, item) => sum + item.subtotal, 0);
            
            // Insertar venta manualmente con fecha específica
            const stmt = this.db.prepare(`
                INSERT INTO ventas (total, pago_efectivo, pago_tarjeta, pago_transferencia, cambio, fecha_hora)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            
            const result = stmt.run(total, total, 0, 0, 0, fecha.toISOString());
            const ventaId = result.lastInsertRowid;

            // Insertar detalles
            const detalleStmt = this.db.prepare(`
                INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal)
                VALUES (?, ?, ?, ?, ?)
            `);

            for (const item of productosVenta) {
                detalleStmt.run(ventaId, item.productoId, item.cantidad, item.precioUnitario, item.subtotal);
                
                // Actualizar stock
                const updateStmt = this.db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?');
                updateStmt.run(item.cantidad, item.productoId);
            }

            return {
                id: ventaId,
                total: total,
                cambio: 0,
                productos: productosVenta.length,
                fecha: fecha
            };

        } catch (error) {
            throw new Error(`Error al simular venta: ${error.message}`);
        }
    }

    async poblarBaseDeDatos() {
        try {
            console.log('🚀 Iniciando población de base de datos...\n');
            
            const productos = this.obtenerProductosEjemplo();
            let productosAgregados = 0;
            let productosConError = 0;

            for (const productoData of productos) {
                try {
                    const producto = this.productManager.addProduct(productoData);
                    console.log(`✅ ${producto.nombre} - Bs.${producto.precio_venta} - Stock: ${producto.stock}`);
                    productosAgregados++;
                } catch (error) {
                    console.log(`❌ Error con ${productoData.nombre}: ${error.message}`);
                    productosConError++;
                }
            }

            console.log('\n📊 RESUMEN DE POBLACIÓN:');
            console.log(`✅ Productos agregados: ${productosAgregados}`);
            console.log(`❌ Productos con error: ${productosConError}`);
            console.log(`📦 Total de productos: ${productos.length}`);
            
            // Mostrar productos por categoría
            const productosDB = this.productManager.getAllProducts();
            const porCategoria = {};
            
            productosDB.forEach(producto => {
                if (!porCategoria[producto.categoria]) {
                    porCategoria[producto.categoria] = 0;
                }
                porCategoria[producto.categoria]++;
            });

            console.log('\n🏷️ DISTRIBUCIÓN POR CATEGORÍA:');
            Object.keys(porCategoria).forEach(categoria => {
                console.log(`   ${categoria}: ${porCategoria[categoria]} productos`);
            });

            // 🆕 MOSTRAR PRODUCTOS CON STOCK BAJO
            console.log('\n⚠️  PRODUCTOS CON STOCK BAJO (para probar alertas):');
            const productosBajoStock = this.productManager.getLowStockProducts();
            if (productosBajoStock.length === 0) {
                console.log('   ✅ No hay productos con stock bajo');
            } else {
                productosBajoStock.forEach(producto => {
                    const faltante = (producto.stock_minimo || 5) - producto.stock;
                    console.log(`   ❗ ${producto.nombre} - Stock: ${producto.stock} (Faltan: ${faltante})`);
                });
                console.log(`   📊 Total productos con stock bajo: ${productosBajoStock.length}`);
            }

            // 🆕 CREAR VENTAS DE EJEMPLO
            await this.crearVentasDeEjemplo();

        } catch (error) {
            console.log('❌ Error general:', error.message);
        }
    }

    // Método para limpiar y repoblar (opcional)
    async limpiarYRepoblar() {
        try {
            console.log('🧹 Limpiando base de datos...');
            
            // Obtener todos los productos existentes
            const productosExistentes = this.productManager.getAllProducts();
            
            // Eliminar cada producto (soft delete)
            for (const producto of productosExistentes) {
                this.productManager.deleteProduct(producto.id);
            }
            
            console.log(`🗑️ ${productosExistentes.length} productos eliminados`);
            console.log('🔄 Repoblando base de datos...\n');
            
            await this.poblarBaseDeDatos();
            
        } catch (error) {
            console.log('❌ Error al limpiar y repoblar:', error.message);
        }
    }
}

// Ejecutar el poblador
const poblador = new PobladorProductos();

// Verificar si se pasa argumento para limpiar y repoblar
const argumento = process.argv[2];
if (argumento === '--clean') {
    poblador.limpiarYRepoblar();
} else {
    poblador.poblarBaseDeDatos();
}