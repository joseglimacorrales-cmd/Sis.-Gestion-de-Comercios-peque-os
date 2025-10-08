const inquirer = require('inquirer').default;
const ProductManager = require('../core/managers/ProductManager');
const SaleManager = require('../core/managers/SaleManager');

class TUIApp {
    constructor() {
        this.productManager = new ProductManager();
        this.saleManager = new SaleManager();
    }

    clearScreen(title) {
    this.forceClear();
    console.log('╔════════════════════════════════════════╗');
    console.log(`║           ${title} ║`);
    console.log('╚════════════════════════════════════════╝\n');
}


  forceClear() {
    try {
        process.stdout.write('\x1b[3J\x1b[2J\x1b[1J\x1b[H\x1bc');
    } catch {
        try {
            const { execSync } = require('child_process');
            execSync('cls', { stdio: 'inherit' });
        } catch {
            console.clear();
        }
    }
}

    async waitForContinue() {
        await inquirer.prompt([
            {
                type: 'input',
                name: 'continue',
                message: 'Presiona Enter para continuar...'
            }
        ]);
        this.forceClear();
    }

    async showMainMenu() {
        this.clearScreen('🏪 TIENDA DE BARRIO - TUI');

        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'MENÚ PRINCIPAL:',
                choices: [
                    { name: '📦 Gestión de Productos', value: 'products' },
                    { name: '💰 Sistema de Ventas', value: 'sales' },
                    { name: '📊 Reportes y Estadísticas', value: 'reports' },
                    new inquirer.Separator(),
                    { name: '🚪 Salir del Sistema', value: 'exit' }
                ]
            }
        ]);

        switch (answers.action) {
            case 'products':
                await this.showProductsMenu();
                break;
            case 'sales':
                await this.showSalesMenu();
                break;
            case 'reports':
                await this.showReportsMenu();
                break;
            case 'exit':
                this.salir();
                break;
        }
    }

    async showProductsMenu() {
        this.clearScreen('📦 GESTIÓN DE PRODUCTOS');

        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: '¿Qué deseas hacer?',
                choices: [
                    { name: '👁️ Ver todos los productos', value: 'view_all' },
                    { name: '➕ Agregar nuevo producto', value: 'add' },
                    { name: '✏️ Editar producto existente', value: 'update' },
                    { name: '🗑️ Eliminar producto', value: 'delete' },
                    { name: '🔍 Buscar producto', value: 'search' },
                    { name: '⚠️ Ver productos con stock bajo', value: 'low_stock' },
                    new inquirer.Separator(),
                    { name: '🔙 Volver al menú principal', value: 'back' }
                ]
            }
        ]);

        switch (answers.action) {
            case 'view_all':
                await this.mostrarTodosProductos();
                break;
            case 'add':
                await this.agregarProducto();
                break;
            case 'update':
                await this.actualizarProducto();
                break;
            case 'delete':
                await this.eliminarProducto();
                break;
            case 'search':
                await this.buscarProducto();
                break;
            case 'low_stock':
                await this.mostrarStockBajo();
                break;
            case 'back':
                await this.showMainMenu();
                break;
        }
    }

    async mostrarTodosProductos() {
        this.clearScreen('👁️ TODOS LOS PRODUCTOS');

        try {
            const productos = this.productManager.getAllProducts();
            
            if (productos.length === 0) {
                console.log('📭 No hay productos registrados en el sistema.');
            } else {
                console.log(`📊 Total de productos: ${productos.length}\n`);
                
                for (let i = 0; i < productos.length; i += 15) {
                    const chunk = productos.slice(i, i + 15);
                    
                    chunk.forEach((producto, index) => {
                        const globalIndex = i + index + 1;
                        console.log(`${globalIndex}. ${producto.nombre}`);
                        console.log(`   💰 Precio: Bs.${producto.precio_venta}`);
                        console.log(`   📦 Stock: ${producto.stock} unidades`);
                        console.log(`   🏷️ Categoría: ${producto.categoria}`);
                        console.log(`   🆔 ID: ${producto.id}`);
                        if (producto.stock <= (producto.stock_minimo || 5)) {
                            console.log(`   ⚠️  ALERTA: Stock bajo!`);
                        }
                        console.log('   ──────────────────────');
                    });

                    if (i + 15 < productos.length) {
                        console.log(`\n📄 Mostrando ${Math.min(i + 15, productos.length)} de ${productos.length} productos`);
                        const continuar = await inquirer.prompt([
                            {
                                type: 'confirm',
                                name: 'next',
                                message: '¿Ver más productos?',
                                default: true
                            }
                        ]);
                        
                        if (!continuar.next) break;
                        this.clearScreen('👁️ TODOS LOS PRODUCTOS - CONTINUACIÓN');
                    }
                }
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }

        await this.waitForContinue();
        await this.showProductsMenu();
    }

    // ➕ AGREGAR PRODUCTO
    async agregarProducto() {
        this.clearScreen('➕ AGREGAR NUEVO PRODUCTO');

        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'nombre',
                message: 'Nombre del producto:',
                validate: (input) => input.trim() ? true : '❌ El nombre no puede estar vacío'
            },
            {
                type: 'number',
                name: 'precio_compra',
                message: 'Precio de compra (Bs.):',
                validate: (input) => input > 0 ? true : '❌ El precio debe ser mayor a 0'
            },
            {
                type: 'number',
                name: 'precio_venta',
                message: 'Precio de venta (Bs.):',
                validate: (input) => input > 0 ? true : '❌ El precio debe ser mayor a 0'
            },
            {
                type: 'number',
                name: 'stock',
                message: 'Stock inicial:',
                default: 0,
                validate: (input) => input >= 0 ? true : '❌ El stock no puede ser negativo'
            },
            {
                type: 'input',
                name: 'categoria',
                message: 'Categoría:',
                default: 'General'
            },
            {
                type: 'number',
                name: 'stock_minimo',
                message: 'Stock mínimo para alertas:',
                default: 5,
                validate: (input) => input >= 0 ? true : '❌ El stock mínimo no puede ser negativo'
            }
        ]);

        try {
            const producto = this.productManager.addProduct({
                nombre: answers.nombre,
                precioCompra: answers.precio_compra,
                precioVenta: answers.precio_venta,
                stock: answers.stock,
                categoria: answers.categoria,
                stockMinimo: answers.stock_minimo
            });
            
            console.log('\n✅ ¡Producto agregado exitosamente!');
            console.log(`📝 Nombre: ${producto.nombre}`);
            console.log(`💰 Precio venta: Bs.${producto.precio_venta}`);
            console.log(`📦 Stock: ${producto.stock} unidades`);
            console.log(`🎯 Stock mínimo: ${producto.stock_minimo} unidades`);
            
        } catch (error) {
            console.log('❌ Error:', error.message);
        }

        // Preguntar si agregar otro
        const { agregarOtro } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'agregarOtro',
                message: '¿Deseas agregar otro producto?',
                default: false
            }
        ]);

        if (agregarOtro) {
            await this.agregarProducto();
        } else {
            await this.showProductsMenu();
        }
    }

    async actualizarProducto() {
        this.clearScreen('✏️ EDITAR PRODUCTO');

        try {
            const productos = this.productManager.getAllProducts();
            
            if (productos.length === 0) {
                console.log('📭 No hay productos para editar.');
                await this.waitForContinue();
                await this.showProductsMenu();
                return;
            }

            const productoChoice = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'productoId',
                    message: 'Selecciona el producto a editar:',
                    choices: productos.map(p => ({
                        name: `${p.nombre} - Bs.${p.precio_venta} (Stock: ${p.stock})`,
                        value: p.id
                    }))
                }
            ]);

            const producto = this.productManager.getProductById(productoChoice.productoId);
            
            if (!producto) {
                console.log('❌ Producto no encontrado.');
                await this.waitForContinue();
                await this.showProductsMenu();
                return;
            }

            console.log(`\n📝 Editando: ${producto.nombre}`);
            console.log('─────────────────────────────────────');

            const updates = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'nombre',
                    message: 'Nuevo nombre:',
                    default: producto.nombre
                },
                {
                    type: 'number',
                    name: 'precio_compra',
                    message: 'Nuevo precio de compra:',
                    default: producto.precio_compra
                },
                {
                    type: 'number',
                    name: 'precio_venta',
                    message: 'Nuevo precio de venta:',
                    default: producto.precio_venta
                },
                {
                    type: 'number',
                    name: 'stock',
                    message: 'Nuevo stock:',
                    default: producto.stock
                },
                {
                    type: 'input',
                    name: 'categoria',
                    message: 'Nueva categoría:',
                    default: producto.categoria
                },
                {
                    type: 'number',
                    name: 'stock_minimo',
                    message: 'Nuevo stock mínimo:',
                    default: producto.stock_minimo || 5
                }
            ]);

            const updateData = {};
            if (updates.nombre !== producto.nombre) updateData.nombre = updates.nombre;
            if (updates.precio_compra !== producto.precio_compra) updateData.precio_compra = updates.precio_compra;
            if (updates.precio_venta !== producto.precio_venta) updateData.precio_venta = updates.precio_venta;
            if (updates.stock !== producto.stock) updateData.stock = updates.stock;
            if (updates.categoria !== producto.categoria) updateData.categoria = updates.categoria;
            if (updates.stock_minimo !== (producto.stock_minimo || 5)) updateData.stock_minimo = updates.stock_minimo;

            if (Object.keys(updateData).length === 0) {
                console.log('ℹ️ No se realizaron cambios.');
            } else {
                const productoActualizado = this.productManager.updateProduct(producto.id, updateData);
                console.log('\n✅ ¡Producto actualizado exitosamente!');
                console.log(`📝 Nombre: ${productoActualizado.nombre}`);
                console.log(`💰 Precio venta: Bs.${productoActualizado.precio_venta}`);
                console.log(`📦 Stock: ${productoActualizado.stock} unidades`);
            }

        } catch (error) {
            console.log('❌ Error:', error.message);
        }

        await this.waitForContinue();
        await this.showProductsMenu();
    }

    // 🗑️ ELIMINAR PRODUCTO
    async eliminarProducto() {
        this.clearScreen('🗑️ ELIMINAR PRODUCTO');

        try {
            const productos = this.productManager.getAllProducts();
            
            if (productos.length === 0) {
                console.log('📭 No hay productos para eliminar.');
                await this.waitForContinue();
                await this.showProductsMenu();
                return;
            }

            // Seleccionar producto a eliminar
            const productoChoice = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'productoId',
                    message: 'Selecciona el producto a eliminar:',
                    choices: productos.map(p => ({
                        name: `${p.nombre} - Bs.${p.precio_venta} (Stock: ${p.stock})`,
                        value: p.id
                    }))
                }
            ]);

            const producto = this.productManager.getProductById(productoChoice.productoId);
            
            if (!producto) {
                console.log('❌ Producto no encontrado.');
                await this.waitForContinue();
                await this.showProductsMenu();
                return;
            }

            // Confirmación de eliminación
            const confirmacion = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirmar',
                    message: `¿Estás seguro de eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`,
                    default: false
                }
            ]);

            if (confirmacion.confirmar) {
                this.productManager.deleteProduct(producto.id);
                console.log(`\n✅ ¡Producto "${producto.nombre}" eliminado exitosamente!`);
            } else {
                console.log('❌ Eliminación cancelada.');
            }

        } catch (error) {
            console.log('❌ Error:', error.message);
        }

        await this.waitForContinue();
        await this.showProductsMenu();
    }

    async buscarProducto() {
        this.clearScreen('🔍 BUSCAR PRODUCTO');

        const searchType = await inquirer.prompt([
            {
                type: 'list',
                name: 'tipo',
                message: '¿Cómo quieres buscar?',
                choices: [
                    { name: '🔤 Por nombre', value: 'nombre' },
                    { name: '🏷️ Por categoría', value: 'categoria' },
                    { name: '📦 Por stock bajo', value: 'stock_bajo' },
                    { name: '🔙 Volver', value: 'back' }
                ]
            }
        ]);

        if (searchType.tipo === 'back') {
            await this.showProductsMenu();
            return;
        }

        try {
            let productos = [];
            let termino = '';

            if (searchType.tipo === 'nombre') {
                const busqueda = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'termino',
                        message: 'Ingresa el nombre a buscar:'
                    }
                ]);
                termino = busqueda.termino.toLowerCase();
                productos = this.productManager.getAllProducts().filter(p => 
                    p.nombre.toLowerCase().includes(termino)
                );
            } 
            else if (searchType.tipo === 'categoria') {
                const categorias = [...new Set(this.productManager.getAllProducts().map(p => p.categoria))];
                const categoriaChoice = await inquirer.prompt([
                    {
                        type: 'list',
                        name: 'categoria',
                        message: 'Selecciona categoría:',
                        choices: categorias
                    }
                ]);
                termino = categoriaChoice.categoria;
                productos = this.productManager.getAllProducts().filter(p => 
                    p.categoria === categoriaChoice.categoria
                );
            }
            else if (searchType.tipo === 'stock_bajo') {
                productos = this.productManager.getLowStockProducts();
                termino = 'stock bajo';
            }

            console.log(`\n📊 Resultados de búsqueda (${productos.length} productos):`);
            if (termino) console.log(`🔍 Término: "${termino}"\n`);

            if (productos.length === 0) {
                console.log('❌ No se encontraron productos.');
            } else {
                for (let i = 0; i < productos.length; i += 15) {
                    const chunk = productos.slice(i, i + 15);
                    
                    chunk.forEach((producto, index) => {
                        const globalIndex = i + index + 1;
                        console.log(`${globalIndex}. ${producto.nombre}`);
                        console.log(`   💰 Precio: Bs.${producto.precio_venta}`);
                        console.log(`   📦 Stock: ${producto.stock} unidades`);
                        console.log(`   🏷️ Categoría: ${producto.categoria}`);
                        console.log(`   🆔 ID: ${producto.id}`);
                        if (producto.stock <= (producto.stock_minimo || 5)) {
                            console.log(`   ⚠️  ALERTA: Stock bajo!`);
                        }
                        console.log('   ──────────────────────');
                    });

                    if (i + 15 < productos.length) {
                        console.log(`\n📄 Mostrando ${Math.min(i + 15, productos.length)} de ${productos.length} productos`);
                        const continuar = await inquirer.prompt([
                            {
                                type: 'confirm',
                                name: 'next',
                                message: '¿Ver más resultados?',
                                default: true
                            }
                        ]);
                        
                        if (!continuar.next) break;
                        this.clearScreen('🔍 BUSCAR PRODUCTO - CONTINUACIÓN');
                    }
                }
            }

        } catch (error) {
            console.log('❌ Error:', error.message);
        }

        await this.waitForContinue();
        await this.showProductsMenu();
    }

    // ⚠️ PRODUCTOS CON STOCK BAJO
    async mostrarStockBajo() {
        this.clearScreen('⚠️ PRODUCTOS CON STOCK BAJO');

        try {
            const productos = this.productManager.getLowStockProducts();
            
            if (productos.length === 0) {
                console.log('✅ ¡Excelente! No hay productos con stock bajo.');
            } else {
                console.log(`🚨 ALERTA: ${productos.length} productos necesitan reposición:\n`);
                
                productos.forEach((producto, index) => {
                    const deficit = (producto.stock_minimo || 5) - producto.stock;
                    console.log(`${index + 1}. ${producto.nombre}`);
                    console.log(`   📦 Stock actual: ${producto.stock} unidades`);
                    console.log(`   🎯 Stock mínimo: ${producto.stock_minimo || 5} unidades`);
                    console.log(`   ❗ Déficit: ${deficit} unidades`);
                    console.log(`   🏷️ Categoría: ${producto.categoria}`);
                    console.log(`   💰 Precio: Bs.${producto.precio_venta}`);
                    console.log('   ──────────────────────');
                });
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }

        await this.waitForContinue();
        await this.showProductsMenu();
    }

    async showSalesMenu() {
        this.clearScreen('💰 SISTEMA DE VENTAS');
        console.log('🔧 Módulo de ventas en desarrollo...');
        console.log('📅 Disponible la próxima semana');
        await this.waitForContinue();
        await this.showMainMenu();
    }

    async showReportsMenu() {
        this.clearScreen('📊 REPORTES Y ESTADÍSTICAS');
        console.log('🔧 Módulo de reportes en desarrollo...');
        console.log('📅 Disponible la próxima semana');
        await this.waitForContinue();
        await this.showMainMenu();
    }

    salir() {
    this.forceClear();
    console.log('\n👋 ¡Gracias por usar el sistema! Hasta pronto.\n');
    setTimeout(() => {
        this.forceClear();
        process.exit(0);
    }, 400);
}

    async iniciar() {
        this.forceClear();
        console.log('🚀 Iniciando Sistema de Tienda TUI...');
        await this.showMainMenu();
    }
}

const app = new TUIApp();
app.iniciar();