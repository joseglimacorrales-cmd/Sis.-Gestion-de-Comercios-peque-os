const ProductManager = require('../core/managers/ProductManager');
const readline = require('readline');

class ConsoleApp {
    constructor() {
        this.productManager = new ProductManager();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    limpiarConsola() {
        console.clear();
    }

    mostrarMenuPrincipal() {
        console.log('\n=== SISTEMA DE TIENDA DE BARRIO ===');
        console.log('1. Agregar Producto');
        console.log('2. Ver Todos los Productos');
        console.log('3. Ver Productos con Stock Bajo');
        console.log('4. Actualizar Producto');
        console.log('5. Eliminar Producto');
        console.log('6. Salir');

        this.rl.question('\nSelecciona una opcion: ', (opcion) => {
            switch (opcion) {
                case '1': this.agregarProducto(); break;
                case '2': this.mostrarTodosProductos(); break;
                case '3': this.mostrarProductosStockBajo(); break;
                case '4': this.actualizarProducto(); break;
                case '5': this.eliminarProducto(); break;
                case '6': this.salir(); break;
                default: 
                    console.log('Opcion no valida');
                    this.mostrarMenuPrincipal();
            }
        });
    }

    agregarProducto() {
        console.log('\n--- AGREGAR PRODUCTO ---');
        
        this.rl.question('Nombre: ', (nombre) => {
            this.rl.question('Precio de Compra: ', (precioCompra) => {
                this.rl.question('Precio de Venta: ', (precioVenta) => {
                    this.rl.question('Stock: ', (stock) => {
                        this.rl.question('Categoria: ', (categoria) => {
                            try {
                                const producto = this.productManager.addProduct({
                                    nombre,
                                    precioCompra: parseFloat(precioCompra),
                                    precioVenta: parseFloat(precioVenta),
                                    stock: parseInt(stock),
                                    categoria: categoria || 'General'
                                });
                                console.log('Producto agregado:', producto);
                            } catch (error) {
                                console.log('Error:', error.message);
                            }
                            this.mostrarMenuPrincipal();
                        });
                    });
                });
            });
        });
    }

    mostrarTodosProductos() {
        console.log('\n--- TODOS LOS PRODUCTOS ---');
        try {
            const productos = this.productManager.getAllProducts();
            if (productos.length === 0) {
                console.log('No hay productos registrados');
            } else {
                productos.forEach((producto, indice) => {
                    console.log(`${indice + 1}. ${producto.nombre} - Bs.${producto.precio_venta} (Stock: ${producto.stock})`);
                });
            }
        } catch (error) {
            console.log('Error:', error.message);
        }
        this.mostrarMenuPrincipal();
    }

    mostrarProductosStockBajo() {
        console.log('\n--- PRODUCTOS CON STOCK BAJO ---');
        try {
            const productos = this.productManager.getLowStockProducts();
            if (productos.length === 0) {
                console.log('No hay productos con stock bajo');
            } else {
                console.log(`Se encontraron ${productos.length} productos con stock bajo:\n`);
                productos.forEach((producto, indice) => {
                    console.log(`${indice + 1}. ${producto.nombre}`);
                    console.log(`   Stock actual: ${producto.stock}`);
                    console.log(`   Stock mínimo: ${producto.stock_minimo || 5}`);
                    console.log(`   Deficit: ${(producto.stock_minimo || 5) - producto.stock} unidades`);
                    console.log('---');
                });
            }
        } catch (error) {
            console.log('Error:', error.message);
        }
        this.mostrarMenuPrincipal();
    }

    actualizarProducto() {
        console.log('\n--- ACTUALIZAR PRODUCTO ---');
        
        try {
            const productos = this.productManager.getAllProducts();
            if (productos.length === 0) {
                console.log('No hay productos para actualizar');
                return this.mostrarMenuPrincipal();
            }
            
            productos.forEach(producto => {
                console.log(`${producto.id}. ${producto.nombre} - Stock: ${producto.stock}`);
            });
            
            this.rl.question('\nID del producto a actualizar: ', (id) => {
                const idProducto = parseInt(id);
                
                const producto = this.productManager.getProductById(idProducto);
                if (!producto) {
                    console.log('Producto no encontrado');
                    return this.mostrarMenuPrincipal();
                }
                
                console.log(`\nActualizando: ${producto.nombre}`);
                
                this.rl.question('Nuevo nombre (Enter para mantener actual): ', (nombre) => {
                    this.rl.question('Nuevo precio de compra (Enter para mantener actual): ', (precioCompra) => {
                        this.rl.question('Nuevo precio de venta (Enter para mantener actual): ', (precioVenta) => {
                            this.rl.question('Nuevo stock (Enter para mantener actual): ', (stock) => {
                                this.rl.question('Nueva categoria (Enter para mantener actual): ', (categoria) => {
                                    
                                    const datosActualizacion = {};
                                    if (nombre) datosActualizacion.nombre = nombre;
                                    if (precioCompra) datosActualizacion.precio_compra = parseFloat(precioCompra);
                                    if (precioVenta) datosActualizacion.precio_venta = parseFloat(precioVenta);
                                    if (stock) datosActualizacion.stock = parseInt(stock);
                                    if (categoria) datosActualizacion.categoria = categoria;
                                    
                                    try {
                                        const productoActualizado = this.productManager.updateProduct(idProducto, datosActualizacion);
                                        console.log('Producto actualizado:', productoActualizado.nombre);
                                    } catch (error) {
                                        console.log('Error:', error.message);
                                    }
                                    this.mostrarMenuPrincipal();
                                });
                            });
                        });
                    });
                });
            });
            
        } catch (error) {
            console.log('Error:', error.message);
            this.mostrarMenuPrincipal();
        }
    }

    eliminarProducto() {
        console.log('\n--- ELIMINAR PRODUCTO ---');
        try {
            const productos = this.productManager.getAllProducts();
            if (productos.length === 0) {
                console.log('No hay productos para eliminar');
                return this.mostrarMenuPrincipal();
            }
            
            productos.forEach(producto => {
                console.log(`${producto.id}. ${producto.nombre}`);
            });
            
            this.rl.question('\nID del producto a eliminar: ', (id) => {
                const idProducto = parseInt(id);
                const producto = this.productManager.getProductById(idProducto);
                if (!producto) {
                    console.log(' Producto no encontrado');
                    return this.mostrarMenuPrincipal();
                }
                
                this.rl.question(`¿Estás seguro de eliminar "${producto.nombre}"? (s/n): `, (confirmacion) => {
                    if (confirmacion.toLowerCase() === 's') {
                        try {
                            this.productManager.deleteProduct(idProducto);
                            console.log('Producto eliminado:', producto.nombre);
                        } catch (error) {
                            console.log('Error:', error.message);
                        }
                    } else {
                        console.log('Eliminacion cancelada');
                    }
                    this.mostrarMenuPrincipal();
                });
            });
            
        } catch (error) {
            console.log('Error:', error.message);
            this.mostrarMenuPrincipal();
        }
    }

    salir() {
        console.log('¡Hasta pronto!');
        this.rl.close();
        process.exit(0);
    }

    iniciar() {
        console.log('Iniciando sistema de tienda...');
        this.mostrarMenuPrincipal();
    }
}

const app = new ConsoleApp();
app.iniciar();