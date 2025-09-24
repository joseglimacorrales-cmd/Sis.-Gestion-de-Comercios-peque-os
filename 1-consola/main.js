const ProductManager = require('../core/managers/ProductManager'); // 📦
const SaleManager = require('../core/managers/SaleManager');       // 💵
const readline = require('readline');                               // 🖊️

class ConsoleApp {
    constructor() {
        this.productManager = new ProductManager();  // 🛍️
        this.saleManager = new SaleManager();        // 💳
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    limpiarConsola() {
        console.clear(); // 🧹
    }

    mostrarMenuPrincipal() {
        console.log('\n=== 🏪 SISTEMA DE TIENDA DE BARRIO 🏪 ===');
        console.log('1️⃣  Agregar Producto');
        console.log('2️⃣  Ver Todos los Productos');
        console.log('3️⃣  Ver Productos con Stock Bajo');
        console.log('4️⃣  Actualizar Producto');
        console.log('5️⃣  Eliminar Producto');
        console.log('6️⃣  Registrar Venta');
        console.log('7️⃣  Ver Ventas del Día');
        console.log('8️⃣  Salir');

        this.rl.question('\n➡️ Selecciona una opción: ', (opcion) => {
            switch (opcion) {
                case '1': this.agregarProducto(); break;
                case '2': this.mostrarTodosProductos(); break;
                case '3': this.mostrarProductosStockBajo(); break;
                case '4': this.actualizarProducto(); break;
                case '5': this.eliminarProducto(); break;
                case '6': this.registrarVenta(); break;
                case '7': this.verVentasDelDia(); break;
                case '8': this.salir(); break;
                default: 
                    console.log('❌ Opción no válida');
                    this.mostrarMenuPrincipal();
            }
        });
    }

    agregarProducto() {
        console.log('\n➕ --- AGREGAR PRODUCTO ---');
        this.rl.question('📝 Nombre: ', (nombre) => {
            this.rl.question('💰 Precio de Compra: ', (precioCompra) => {
                this.rl.question('💵 Precio de Venta: ', (precioVenta) => {
                    this.rl.question('📦 Stock: ', (stock) => {
                        this.rl.question('🏷️ Categoría: ', (categoria) => {
                            try {
                                const producto = this.productManager.addProduct({
                                    nombre,
                                    precioCompra: parseFloat(precioCompra),
                                    precioVenta: parseFloat(precioVenta),
                                    stock: parseInt(stock),
                                    categoria: categoria || 'General'
                                });
                                console.log('✅ Producto agregado:', producto);
                            } catch (error) {
                                console.log('❌ Error:', error.message);
                            }
                            this.mostrarMenuPrincipal();
                        });
                    });
                });
            });
        });
    }

    mostrarTodosProductos() {
        console.log('\n📦 --- TODOS LOS PRODUCTOS ---');
        try {
            const productos = this.productManager.getAllProducts();
            if (productos.length === 0) {
                console.log('ℹ️ No hay productos registrados');
            } else {
                productos.forEach((producto, indice) => {
                    console.log(`${indice + 1}. ${producto.nombre} - 💵 Bs.${producto.precio_venta} (Stock: ${producto.stock})`);
                });
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }
        this.mostrarMenuPrincipal();
    }

    mostrarProductosStockBajo() {
        console.log('\n⚠️ --- PRODUCTOS CON STOCK BAJO ---');
        try {
            const productos = this.productManager.getLowStockProducts();
            if (productos.length === 0) {
                console.log('✅ No hay productos con stock bajo');
            } else {
                console.log(`⚠️ Se encontraron ${productos.length} productos con stock bajo:\n`);
                productos.forEach((producto, indice) => {
                    console.log(`${indice + 1}. ${producto.nombre}`);
                    console.log(`   📦 Stock actual: ${producto.stock}`);
                    console.log(`   🏷️ Stock mínimo: ${producto.stock_minimo || 5}`);
                    console.log(`   ❗ Déficit: ${(producto.stock_minimo || 5) - producto.stock} unidades`);
                    console.log('---');
                });
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }
        this.mostrarMenuPrincipal();
    }

    actualizarProducto() {
        console.log('\n✏️ --- ACTUALIZAR PRODUCTO ---');
        try {
            const productos = this.productManager.getAllProducts();
            if (productos.length === 0) {
                console.log('ℹ️ No hay productos para actualizar');
                return this.mostrarMenuPrincipal();
            }
            
            productos.forEach(producto => {
                console.log(`${producto.id}. ${producto.nombre} - 📦 Stock: ${producto.stock}`);
            });
            
            this.rl.question('\n🆔 ID del producto a actualizar: ', (id) => {
                const idProducto = parseInt(id);
                const producto = this.productManager.getProductById(idProducto);
                if (!producto) {
                    console.log('❌ Producto no encontrado');
                    return this.mostrarMenuPrincipal();
                }
                
                console.log(`\n🔄 Actualizando: ${producto.nombre}`);
                
                this.rl.question('📝 Nuevo nombre (Enter para mantener actual): ', (nombre) => {
                    this.rl.question('💰 Nuevo precio de compra (Enter para mantener actual): ', (precioCompra) => {
                        this.rl.question('💵 Nuevo precio de venta (Enter para mantener actual): ', (precioVenta) => {
                            this.rl.question('📦 Nuevo stock (Enter para mantener actual): ', (stock) => {
                                this.rl.question('🏷️ Nueva categoría (Enter para mantener actual): ', (categoria) => {
                                    const datosActualizacion = {};
                                    if (nombre) datosActualizacion.nombre = nombre;
                                    if (precioCompra) datosActualizacion.precio_compra = parseFloat(precioCompra);
                                    if (precioVenta) datosActualizacion.precio_venta = parseFloat(precioVenta);
                                    if (stock) datosActualizacion.stock = parseInt(stock);
                                    if (categoria) datosActualizacion.categoria = categoria;
                                    
                                    try {
                                        const productoActualizado = this.productManager.updateProduct(idProducto, datosActualizacion);
                                        console.log('✅ Producto actualizado:', productoActualizado.nombre);
                                    } catch (error) {
                                        console.log('❌ Error:', error.message);
                                    }
                                    this.mostrarMenuPrincipal();
                                });
                            });
                        });
                    });
                });
            });
            
        } catch (error) {
            console.log('❌ Error:', error.message);
            this.mostrarMenuPrincipal();
        }
    }

    eliminarProducto() {
        console.log('\n🗑️ --- ELIMINAR PRODUCTO ---');
        try {
            const productos = this.productManager.getAllProducts();
            if (productos.length === 0) {
                console.log('ℹ️ No hay productos para eliminar');
                return this.mostrarMenuPrincipal();
            }
            
            productos.forEach(producto => {
                console.log(`${producto.id}. ${producto.nombre}`);
            });
            
            this.rl.question('\n🆔 ID del producto a eliminar: ', (id) => {
                const idProducto = parseInt(id);
                const producto = this.productManager.getProductById(idProducto);
                if (!producto) {
                    console.log('❌ Producto no encontrado');
                    return this.mostrarMenuPrincipal();
                }
                
                this.rl.question(`⚠️ ¿Estás seguro de eliminar "${producto.nombre}"? (s/n): `, (confirmacion) => {
                    if (confirmacion.toLowerCase() === 's') {
                        try {
                            this.productManager.deleteProduct(idProducto);
                            console.log('✅ Producto eliminado:', producto.nombre);
                        } catch (error) {
                            console.log('❌ Error:', error.message);
                        }
                    } else {
                        console.log('❌ Eliminación cancelada');
                    }
                    this.mostrarMenuPrincipal();
                });
            });
            
        } catch (error) {
            console.log('❌ Error:', error.message);
            this.mostrarMenuPrincipal();
        }
    }

    mostrarProductosRapido() {
        console.log('\n📦 --- TODOS LOS PRODUCTOS ---');
        try {
            const productos = this.productManager.getAllProducts();
            if (productos.length === 0) {
                console.log('ℹ️ No hay productos registrados');
            } else {
                productos.forEach(producto => {
                console.log(`🆔 ${producto.id} - ${producto.nombre} - 💵 Bs.${producto.precio_venta} (Stock: ${producto.stock})`);
                });
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }
    }

    registrarVenta() {
        console.log('\n🛒 --- REGISTRAR VENTA ---');
    
        this.mostrarProductosRapido();
    
        const ventaProductos = [];
        const saleManager = new SaleManager();
    
        const agregarProducto = () => {
            this.rl.question('🆔 ID del producto a vender (0 para terminar): ', async (id) => {
                if (id === '0') {
                    if (ventaProductos.length === 0) {
                        console.log('❌ Debes agregar al menos un producto');
                        agregarProducto();
                        return;
                    }
                    
                    console.log('\n📋 RESUMEN DE VENTA:');
                    let total = 0;
                    ventaProductos.forEach(item => {
                        console.log(`   🛍️ ${item.nombre} x${item.cantidad} - 💵 Bs.${item.subtotal}`);
                        total += item.subtotal;
                    });
                    console.log(`💰 TOTAL: Bs.${total}`);
                    
                    this.rl.question('\n💳 Método de pago (efectivo/tarjeta/transferencia): ', (metodo) => {
                        this.rl.question('💵 Monto recibido: Bs.', async (monto) => {
                            try {
                                const resultado = await saleManager.registerSale(
                                    ventaProductos, 
                                    metodo, 
                                    parseFloat(monto)
                                );
                                console.log(`✅ ${resultado.mensaje}`);
                                console.log(`📦 Stock actualizado para ${resultado.productos} productos`);
                            } catch (error) {
                                console.log('❌ Error al registrar venta:', error.message);
                            }
                            this.mostrarMenuPrincipal();
                        });
                    });
                    return;
                }
                
                this.rl.question('🔢 Cantidad: ', (cantidad) => {
                    try {
                        const product = this.productManager.getProductById(parseInt(id));
                        if (!product) throw new Error('Producto no encontrado');
                        if (product.stock < parseInt(cantidad)) throw new Error(`Stock insuficiente. Disponible: ${product.stock}`);
                        
                        const subtotal = product.precio_venta * parseInt(cantidad);
                        ventaProductos.push({
                            productoId: product.id,
                            nombre: product.nombre,
                            cantidad: parseInt(cantidad),
                            precioUnitario: product.precio_venta,
                            subtotal: subtotal
                        });
                        console.log(`✅ ${product.nombre} agregado a la venta`);
                        agregarProducto();
                    } catch (error) {
                        console.log('❌ Error:', error.message);
                        agregarProducto();
                    }
                });
            });
        };
        agregarProducto();
    }

    verVentasDelDia() {
        console.log('\n📊 --- VENTAS DEL DÍA ---');
        try {
            const saleManager = new SaleManager();
            const ventas = saleManager.getTodaySales();
            
            if (ventas.length === 0) {
                console.log('ℹ️ No hay ventas registradas hoy');
            } else {
                ventas.forEach(venta => {
                    const fechaUTC = new Date(venta.fecha_hora);
                    const fechaLocal = new Date(fechaUTC.getTime() - 4 * 60 * 60 * 1000); // UTC−4
                    console.log(`🕒 ${fechaLocal.toLocaleString()} - 💰 Total: Bs.${venta.total} - 🛍️ Productos: ${venta.total_productos}`);
                });
                const totalHoy = ventas.reduce((sum, v) => sum + v.total, 0);
                console.log(`💵 TOTAL DEL DÍA: Bs.${totalHoy}`);
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }
        this.mostrarMenuPrincipal();
    }

    salir() {
        console.log('👋 ¡Hasta pronto!');
        this.rl.close();
        process.exit(0);
    }

    iniciar() {
        console.log('🚀 Iniciando sistema de tienda...');
        this.mostrarMenuPrincipal();
    }
}

const app = new ConsoleApp();
app.iniciar();
