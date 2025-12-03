const inquirer = require('inquirer').default;
const ProductManager = require('../core/managers/ProductManager');
const SaleManager = require('../core/managers/SaleManager');
const { initDatabase } = require('../core/models');

const stripAnsiImport = require('strip-ansi');
const stringWidthImport = require('string-width');
const chalkImport = require('chalk');

const stripAnsi = stripAnsiImport.default || stripAnsiImport;
const stringWidth = stringWidthImport.default || stringWidthImport;
const chalk = chalkImport.default || chalkImport;

function visualWidth(text) {
  const clean = stripAnsi(text || '');
  return stringWidth(clean);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class TUIApp {
  constructor() {
    this.productManager = new ProductManager();
    this.saleManager = new SaleManager();
  }

  clearScreen(title) {
    this.forceClear();
    console.log();

    const padding = 2;
    const minWidth = 40;

    const contentWidth = visualWidth(title);
    const baseWidth = contentWidth + padding * 2;
    const totalWidth = Math.max(baseWidth, minWidth);

    const extra = totalWidth - (contentWidth + padding * 2);
    const leftPadding = padding + Math.floor(extra / 2);
    const rightPadding = padding + Math.ceil(extra / 2);

    const top = chalk.cyan('╔' + '═'.repeat(totalWidth) + '╗');
    const middle =
      chalk.cyan('║') +
      ' '.repeat(leftPadding) +
      chalk.bold.white(title) +
      ' '.repeat(rightPadding) +
      chalk.cyan('║');
    const bottom = chalk.cyan('╚' + '═'.repeat(totalWidth) + '╝');

    console.log(top);
    console.log(middle);
    console.log(bottom + '\n');
  }

  forceClear() {
    try {
      if (process.platform === 'win32') {
        process.stdout.write('\x1bc');
      } else {
        process.stdout.write('\x1b[3J\x1b[2J\x1b[H');
      }
    } catch {
      console.clear();
    }
  }

  async waitForContinue() {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Presiona Enter para continuar...',
      },
    ]);
    this.forceClear();
  }

  formatBs(n) {
    if (typeof n !== 'number') n = Number(n || 0);
    return `Bs.${n.toFixed(2)}`;
  }

  toLocal(dateStrOrDate) {
    const d = new Date(dateStrOrDate);
    return d.toLocaleString();
  }

  async showIntro() {
    this.forceClear();

    const titulo = 'TIENDA DE BARRIO - TUI';
    const padding = 2;
    const contentWidth = visualWidth(titulo);
    const totalWidth = contentWidth + padding * 2;

    const top = '╔' + '═'.repeat(totalWidth) + '╗';
    const middle = '║' + ' '.repeat(padding) + titulo + ' '.repeat(padding) + '║';
    const bottom = '╚' + '═'.repeat(totalWidth) + '╝';

    console.log(top);
    console.log(middle);
    console.log(bottom + '\n');

    const mensaje = 'Iniciando sistema...';
    const frames = ['|', '/', '-', '\\'];

    for (let i = 0; i < 24; i++) {
      const frame = frames[i % frames.length];
      process.stdout.write(`\r${mensaje} ${frame} `);
      await sleep(80);
    }

    process.stdout.write(`\r${mensaje} ✅\n`);
    await sleep(400);

    this.forceClear();
  }

  // MENU PRINCIPAL
  async showMainMenu() {
    this.clearScreen('TIENDA DE BARRIO - TUI');

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: chalk.bold('MENÚ PRINCIPAL:'),
        choices: [
          { name: '📦 Gestión de Productos', value: 'products' },
          { name: '💰 Sistema de Ventas', value: 'sales' },
          { name: '📊 Reportes y Estadísticas', value: 'reports' },
          new inquirer.Separator(),
          { name: '🚪 Salir del Sistema', value: 'exit' },
        ],
      },
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

  // PRODUCTOS
  async showProductsMenu() {
    this.clearScreen('GESTIÓN DE PRODUCTOS');

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: chalk.bold('¿Qué deseas hacer?'),
        choices: [
          { name: '👁️ Ver todos los productos', value: 'view_all' },
          { name: '➕ Agregar nuevo producto', value: 'add' },
          { name: '✏️ Editar producto existente', value: 'update' },
          { name: '🗑️ Eliminar producto', value: 'delete' },
          { name: '🔍 Buscar producto', value: 'search' },
          { name: '⚠️ Ver productos con stock bajo', value: 'low_stock' },
          { name: '📦 Editar stock de productos con stock bajo', value: 'edit_low_stock' },
          { name: '🔙 Volver al menú principal', value: 'back' },
        ],
      },
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
      case 'edit_low_stock':
        await this.editarStockBajoTUI();
        break;
      case 'back':
        await this.showMainMenu();
        break;
    }
  }

  async mostrarTodosProductos() {
    this.clearScreen('TODOS LOS PRODUCTOS');

    try {
      const productos = await this.productManager.getAllProducts();

      if (productos.length === 0) {
        console.log(chalk.yellow('📭 No hay productos registrados en el sistema.'));
      } else {
        console.log(chalk.bold(`📊 Total de productos: ${productos.length}\n`));

        for (let i = 0; i < productos.length; i += 15) {
          const chunk = productos.slice(i, i + 15);

          chunk.forEach((producto, index) => {
            const globalIndex = String(i + index + 1).padEnd(3);
            console.log(chalk.cyan(`${globalIndex} ${producto.nombre}`));
            console.log(`   💰 Precio: ${chalk.green(this.formatBs(producto.precio_venta))}`);
            console.log(`   📦 Stock: ${chalk.white(producto.stock)} unidades`);
            console.log(`   🏷️ Categoría: ${chalk.magenta(producto.categoria)}`);
            console.log(`   🆔 ID: ${chalk.gray(producto.id)}`);
            if (producto.stock <= (producto.stock_minimo || 5)) {
              console.log(chalk.yellow('   ⚠️  ALERTA: Stock bajo!'));
            }
            console.log(chalk.gray('   ───────────────────────────────────'));
          });

          if (i + 15 < productos.length) {
            console.log(
              `\n📄 Mostrando ${chalk.bold(
                Math.min(i + 15, productos.length)
              )} de ${chalk.bold(productos.length)} productos`
            );
            const continuar = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'next',
                message: '¿Ver más productos?',
                default: true,
              },
            ]);

            if (!continuar.next) break;
            this.clearScreen('TODOS LOS PRODUCTOS - CONTINUACIÓN');
          }
        }
      }
    } catch (error) {
      console.log(chalk.red('❌ Error:'), chalk.red(error.message));
    }

    await this.waitForContinue();
    await this.showProductsMenu();
  }

  async agregarProducto() {
    this.clearScreen('AGREGAR NUEVO PRODUCTO');

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'nombre',
        message: 'Nombre del producto:',
        validate: (input) => (input.trim() ? true : '❌ El nombre no puede estar vacío'),
      },
      {
        type: 'number',
        name: 'precio_compra',
        message: 'Precio de compra (Bs.):',
        validate: (input) => (input > 0 ? true : '❌ El precio debe ser mayor a 0'),
      },
      {
        type: 'number',
        name: 'precio_venta',
        message: 'Precio de venta (Bs.):',
        validate: (input) => (input > 0 ? true : '❌ El precio debe ser mayor a 0'),
      },
      {
        type: 'number',
        name: 'stock',
        message: 'Stock inicial:',
        default: 0,
        validate: (input) => (input >= 0 ? true : '❌ El stock no puede ser negativo'),
      },
      {
        type: 'input',
        name: 'categoria',
        message: 'Categoría:',
        default: 'General',
      },
      {
        type: 'input',
        name: 'codigo_barras',
        message: 'Código de barras (opcional):',
        default: '',
      },
      {
        type: 'number',
        name: 'stock_minimo',
        message: 'Stock mínimo para alertas:',
        default: 5,
        validate: (input) => (input >= 0 ? true : '❌ El stock mínimo no puede ser negativo'),
      },
    ]);

    try {
      const producto = await this.productManager.addProduct({
        nombre: answers.nombre,
        categoria: answers.categoria,
        precio_compra: answers.precio_compra,
        precio_venta: answers.precio_venta,
        stock: answers.stock,
        stock_minimo: answers.stock_minimo,
        codigo_barras: answers.codigo_barras || null,
      });

      console.log(chalk.green('\n✅ ¡Producto agregado exitosamente!'));
      console.log(`📝 Nombre: ${chalk.cyan(producto.nombre)}`);
      console.log(`💰 Precio venta: ${chalk.green(this.formatBs(producto.precio_venta))}`);
      console.log(`📦 Stock: ${producto.stock} unidades`);
      console.log(`🎯 Stock mínimo: ${producto.stock_minimo} unidades`);
    } catch (error) {
      console.log(chalk.red('❌ Error:'), chalk.red(error.message));
    }

    const { agregarOtro } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'agregarOtro',
        message: '¿Deseas agregar otro producto?',
        default: false,
      },
    ]);

    if (agregarOtro) {
      await this.agregarProducto();
    } else {
      await this.showProductsMenu();
    }
  }

  async actualizarProducto() {
    this.clearScreen('EDITAR PRODUCTO');

    try {
      const productos = await this.productManager.getAllProducts();

      if (productos.length === 0) {
        console.log(chalk.yellow('📭 No hay productos para editar.'));
        await this.waitForContinue();
        await this.showProductsMenu();
        return;
      }

      const productoChoice = await inquirer.prompt([
        {
          type: 'list',
          name: 'productoId',
          message: 'Selecciona el producto a editar:',
          choices: productos.map((p) => ({
            name: `${p.nombre} - ${this.formatBs(p.precio_venta)} (Stock: ${p.stock})`,
            value: p.id,
          })),
        },
      ]);

      const producto = await this.productManager.getProductById(productoChoice.productoId);

      if (!producto) {
        console.log(chalk.red('❌ Producto no encontrado.'));
        await this.waitForContinue();
        await this.showProductsMenu();
        return;
      }

      console.log(chalk.bold(`\n📝 Editando: ${producto.nombre}`));
      console.log(chalk.gray('─────────────────────────────────────'));

      const updates = await inquirer.prompt([
        {
          type: 'input',
          name: 'nombre',
          message: 'Nuevo nombre:',
          default: producto.nombre,
        },
        {
          type: 'number',
          name: 'precio_compra',
          message: 'Nuevo precio de compra:',
          default: producto.precio_compra,
        },
        {
          type: 'number',
          name: 'precio_venta',
          message: 'Nuevo precio de venta:',
          default: producto.precio_venta,
        },
        {
          type: 'number',
          name: 'stock',
          message: 'Nuevo stock:',
          default: producto.stock,
        },
        {
          type: 'input',
          name: 'categoria',
          message: 'Nueva categoría:',
          default: producto.categoria,
        },
        {
          type: 'number',
          name: 'stock_minimo',
          message: 'Nuevo stock mínimo:',
          default: producto.stock_minimo || 5,
        },
      ]);

      const updateData = {};
      if (updates.nombre !== producto.nombre) updateData.nombre = updates.nombre;
      if (updates.precio_compra !== producto.precio_compra)
        updateData.precio_compra = updates.precio_compra;
      if (updates.precio_venta !== producto.precio_venta)
        updateData.precio_venta = updates.precio_venta;
      if (updates.stock !== producto.stock) updateData.stock = updates.stock;
      if (updates.categoria !== producto.categoria) updateData.categoria = updates.categoria;
      if (updates.stock_minimo !== (producto.stock_minimo || 5))
        updateData.stock_minimo = updates.stock_minimo;

      if (Object.keys(updateData).length === 0) {
        console.log(chalk.yellow('ℹ️ No se realizaron cambios.'));
      } else {
        const productoActualizado = await this.productManager.updateProduct(
          producto.id,
          updateData
        );
        console.log(chalk.green('\n✅ ¡Producto actualizado exitosamente!'));
        console.log(`📝 Nombre: ${chalk.cyan(productoActualizado.nombre)}`);
        console.log(
          `💰 Precio venta: ${chalk.green(this.formatBs(productoActualizado.precio_venta))}`
        );
        console.log(`📦 Stock: ${productoActualizado.stock} unidades`);
      }
    } catch (error) {
      console.log(chalk.red('❌ Error:'), chalk.red(error.message));
    }

    await this.waitForContinue();
    await this.showProductsMenu();
  }

  async eliminarProducto() {
    this.clearScreen('ELIMINAR PRODUCTO');

    try {
      const productos = await this.productManager.getAllProducts();

      if (productos.length === 0) {
        console.log(chalk.yellow('📭 No hay productos para eliminar.'));
        await this.waitForContinue();
        await this.showProductsMenu();
        return;
      }

      const productoChoice = await inquirer.prompt([
        {
          type: 'list',
          name: 'productoId',
          message: 'Selecciona el producto a eliminar:',
          choices: productos.map((p) => ({
            name: `${p.nombre} - ${this.formatBs(p.precio_venta)} (Stock: ${p.stock})`,
            value: p.id,
          })),
        },
      ]);

      const producto = await this.productManager.getProductById(productoChoice.productoId);

      if (!producto) {
        console.log(chalk.red('❌ Producto no encontrado.'));
        await this.waitForContinue();
        await this.showProductsMenu();
        return;
      }

      const confirmacion = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmar',
          message: `¿Estás seguro de eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`,
          default: false,
        },
      ]);

      if (confirmacion.confirmar) {
        await this.productManager.deleteProduct(producto.id);
        console.log(chalk.green(`\n✅ ¡Producto "${producto.nombre}" eliminado exitosamente!`));
      } else {
        console.log(chalk.yellow('❌ Eliminación cancelada.'));
      }
    } catch (error) {
      console.log(chalk.red('❌ Error:'), chalk.red(error.message));
    }

    await this.waitForContinue();
    await this.showProductsMenu();
  }

  async buscarProducto() {
    this.clearScreen('BUSCAR PRODUCTO');

    const searchType = await inquirer.prompt([
      {
        type: 'list',
        name: 'tipo',
        message: chalk.bold('¿Cómo quieres buscar?'),
        choices: [
          { name: '🔤 Por nombre', value: 'nombre' },
          { name: '🏷️ Por categoría', value: 'categoria' },
          { name: '📦 Por stock bajo', value: 'stock_bajo' },
          { name: '🔙 Volver', value: 'back' },
        ],
      },
    ]);

    if (searchType.tipo === 'back') {
      await this.showProductsMenu();
      return;
    }

    try {
      const allProducts = await this.productManager.getAllProducts();
      let productos = [];
      let termino = '';

      if (searchType.tipo === 'nombre') {
        const busqueda = await inquirer.prompt([
          {
            type: 'input',
            name: 'termino',
            message: 'Ingresa el nombre a buscar:',
          },
        ]);
        termino = busqueda.termino.toLowerCase();
        productos = allProducts.filter((p) => p.nombre.toLowerCase().includes(termino));
      } else if (searchType.tipo === 'categoria') {
        const categorias = [...new Set(allProducts.map((p) => p.categoria))];
        const categoriaChoice = await inquirer.prompt([
          {
            type: 'list',
            name: 'categoria',
            message: 'Selecciona categoría:',
            choices: categorias,
          },
        ]);
        termino = categoriaChoice.categoria;
        productos = allProducts.filter((p) => p.categoria === categoriaChoice.categoria);
      } else if (searchType.tipo === 'stock_bajo') {
        productos = await this.productManager.getLowStockProducts();
        termino = 'stock bajo';
      }

      console.log(
        chalk.bold(`\n📊 Resultados de búsqueda (${productos.length} productos):`)
      );
      if (termino) console.log(`🔍 Término: "${termino}"\n`);

      if (productos.length === 0) {
        console.log(chalk.yellow('❌ No se encontraron productos.'));
      } else {
        for (let i = 0; i < productos.length; i += 15) {
          const chunk = productos.slice(i, i + 15);

          chunk.forEach((producto, index) => {
            const globalIndex = String(i + index + 1).padEnd(3);
            console.log(chalk.cyan(`${globalIndex} ${producto.nombre}`));
            console.log(`   💰 Precio: ${chalk.green(this.formatBs(producto.precio_venta))}`);
            console.log(`   📦 Stock: ${producto.stock} unidades`);
            console.log(`   🏷️ Categoría: ${chalk.magenta(producto.categoria)}`);
            console.log(`   🆔 ID: ${chalk.gray(producto.id)}`);
            if (producto.stock <= (producto.stock_minimo || 5)) {
              console.log(chalk.yellow('   ⚠️  ALERTA: Stock bajo!'));
            }
            console.log(chalk.gray('   ───────────────────────────────────'));
          });

          if (i + 15 < productos.length) {
            console.log(
              `\n📄 Mostrando ${Math.min(i + 15, productos.length)} de ${productos.length} productos`
            );
            const continuar = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'next',
                message: '¿Ver más resultados?',
                default: true,
              },
            ]);

            if (!continuar.next) break;
            this.clearScreen('BUSCAR PRODUCTO - CONTINUACIÓN');
          }
        }
      }
    } catch (error) {
      console.log(chalk.red('❌ Error:'), chalk.red(error.message));
    }

    await this.waitForContinue();
    await this.showProductsMenu();
  }

  async mostrarStockBajo() {
    this.clearScreen('PRODUCTOS CON STOCK BAJO');

    try {
      const productos = await this.productManager.getLowStockProducts();

      if (productos.length === 0) {
        console.log(chalk.green('✅ ¡Excelente! No hay productos con stock bajo.'));
      } else {
        console.log(
          chalk.bold(`🚨 ALERTA: ${productos.length} productos necesitan reposición:\n`)
        );

        productos.forEach((producto, index) => {
          const deficit = (producto.stock_minimo || 5) - producto.stock;
          console.log(chalk.cyan(`${index + 1}. ${producto.nombre}`));
          console.log(`   📦 Stock actual: ${producto.stock} unidades`);
          console.log(`   🎯 Stock mínimo: ${producto.stock_minimo || 5} unidades`);
          console.log(`   ❗ Déficit: ${deficit} unidades`);
          console.log(`   🏷️ Categoría: ${chalk.magenta(producto.categoria)}`);
          console.log(`   💰 Precio: ${chalk.green(this.formatBs(producto.precio_venta))}`);
          console.log(chalk.gray('   ───────────────────────────────────'));
        });
      }
    } catch (error) {
      console.log(chalk.red('❌ Error:'), chalk.red(error.message));
    }

    await this.waitForContinue();
    await this.showProductsMenu();
  }

  async editarStockBajoTUI() {
    this.clearScreen('EDITAR STOCK DE PRODUCTOS CON STOCK BAJO');

    try {
      let seguir = true;

      while (seguir) {
        const productos = await this.productManager.getLowStockProducts();

        if (!productos.length) {
          console.log('✅ ¡Excelente! No hay productos con stock bajo.');
          await this.waitForContinue();
          return;
        }

        const { productoId } = await inquirer.prompt([
          {
            type: 'list',
            name: 'productoId',
            message: 'Selecciona el producto cuyo stock quieres editar:',
            choices: productos.map((p) => ({
              name: `${p.nombre} (Stock actual: ${p.stock} / Mínimo: ${p.stock_minimo || 5})`,
              value: p.id,
            })),
          },
        ]);

        const producto = await this.productManager.getProductById(productoId);
        if (!producto) {
          console.log('❌ Producto no encontrado.');
          break;
        }

        const { nuevoStock } = await inquirer.prompt([
          {
            type: 'number',
            name: 'nuevoStock',
            message: `Nuevo stock para "${producto.nombre}" (actual: ${producto.stock}):`,
            validate: (n) =>
              n >= 0 ? true : '❌ El stock no puede ser negativo',
          },
        ]);

        await this.productManager.updateProduct(producto.id, { stock: nuevoStock });

        console.log(
          `✅ Stock actualizado. "${producto.nombre}": ${producto.stock} → ${nuevoStock}`
        );

        const { editarOtro } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'editarOtro',
            message: '¿Quieres editar el stock de otro producto con stock bajo?',
            default: false,
          },
        ]);

        if (!editarOtro) {
          seguir = false;
        }
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    await this.waitForContinue();
    await this.showProductsMenu();
  }

  // VENTAS
  async showSalesMenu() {
    this.clearScreen('SISTEMA DE VENTAS');

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: chalk.bold('¿Qué deseas hacer?'),
        choices: [
          { name: '🛒 Registrar nueva venta', value: 'register' },
          { name: '📆 Ver ventas del día', value: 'today' },
          { name: '🗓️ Ver ventas semanales (últimos 7 días)', value: 'weekly' },
          { name: '🗓️ Ver ventas mensuales (últimos 30 días)', value: 'monthly' },
          new inquirer.Separator(),
          { name: '❌ Cancelar una venta', value: 'cancel' },
          { name: '🔙 Volver al menú principal', value: 'back' },
        ],
      },
    ]);

    switch (action) {
      case 'register':
        await this.registrarVentaTUI();
        break;
      case 'today':
        await this.verVentasDelDiaTUI();
        break;
      case 'weekly':
        await this.verVentasSemanalesTUI();
        break;
      case 'monthly':
        await this.verVentasMensualesTUI();
        break;
      case 'cancel':
        await this.cancelarVentaTUI();
        break;
      case 'back':
        await this.showMainMenu();
        return;
    }

    await this.waitForContinue();
    await this.showSalesMenu();
  }

  async registrarVentaTUI() {
    this.clearScreen('REGISTRAR VENTA');

    const productos = await this.productManager.getAllProducts();
    if (!productos.length) {
      console.log(chalk.yellow('📭 No hay productos para vender.'));
      return;
    }

    const ventaProductos = [];
    while (true) {
      const { productoId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'productoId',
          message: 'Selecciona un producto (o "Terminar"):',
          choices: [
            ...productos.map((p) => ({
              name: `#${p.id} ${p.nombre} — ${this.formatBs(p.precio_venta)} (Stock: ${p.stock})`,
              value: p.id,
            })),
            new inquirer.Separator(),
            { name: '✅ Terminar selección', value: 0 },
          ],
        },
      ]);

      if (productoId === 0) {
        if (!ventaProductos.length) console.log(chalk.yellow('🔎 No hay productos en la venta.'));
        break;
      }

      const p = await this.productManager.getProductById(productoId);
      if (!p) {
        console.log(chalk.red('❌ Producto no encontrado.'));
        continue;
      }

      const { cantidad } = await inquirer.prompt([
        {
          type: 'number',
          name: 'cantidad',
          message: `Cantidad para "${p.nombre}" (disponible: ${p.stock}):`,
          validate: (n) => (n > 0 && n <= p.stock ? true : `Debe ser >0 y ≤ ${p.stock}`),
        },
      ]);

      const subtotal = Number(p.precio_venta) * Number(cantidad);
      ventaProductos.push({
        productoId: p.id,
        nombre: p.nombre,
        cantidad: Number(cantidad),
        precioUnitario: Number(p.precio_venta),
        subtotal,
      });
      console.log(
        chalk.green(`✅ Agregado: ${p.nombre} x${cantidad} — ${this.formatBs(subtotal)}`)
      );
    }

    if (!ventaProductos.length) return;

    console.log(chalk.bold('\n📋 RESUMEN:'));
    const total = ventaProductos.reduce((s, i) => s + i.subtotal, 0);
    ventaProductos.forEach((i) =>
      console.log(`   • ${i.nombre} x${i.cantidad} — ${this.formatBs(i.subtotal)}`)
    );
    console.log(`\n💰 TOTAL: ${chalk.bold.green(this.formatBs(total))}`);

    const { metodo } = await inquirer.prompt([
      {
        type: 'list',
        name: 'metodo',
        message: 'Método de pago:',
        choices: ['efectivo', 'tarjeta', 'transferencia'],
      },
    ]);

    const { monto } = await inquirer.prompt([
      {
        type: 'number',
        name: 'monto',
        message: 'Monto recibido:',
        validate: (n) => (n >= total ? true : `Debe ser ≥ ${total}`),
      },
    ]);

    try {
      const res = await this.saleManager.registerSale(ventaProductos, metodo, Number(monto));
      console.log(chalk.green('\n✅ Venta registrada correctamente.'));
      console.log(`🧾 ID de venta: ${chalk.cyan(res.id)}`);
      console.log(`💰 Total: ${chalk.green(this.formatBs(res.total))}`);
      console.log(`💵 Cambio: ${chalk.green(this.formatBs(res.cambio))}`);
      console.log(`🛍️ Productos en la venta: ${res.productos}`);
    } catch (err) {
      console.log(chalk.red('❌ Error al registrar venta:'), chalk.red(err.message));
    }
  }

  async verVentasDelDiaTUI() {
    this.clearScreen('VENTAS DEL DÍA');
    try {
      const ventas = await this.saleManager.getTodaySales();
      if (!ventas.length) {
        console.log(chalk.yellow('📭 No hay ventas registradas hoy.'));
        return;
      }

      ventas.forEach((v) => {
        console.log(
          `🧾 #${chalk.cyan(v.id)} — ${this.toLocal(v.fecha_hora)} — Total: ${chalk.green(
            this.formatBs(v.total)
          )} — Items: ${v.total_productos}`
        );
      });
      const total = ventas.reduce((s, v) => s + Number(v.total), 0);
      console.log(chalk.gray('\n=============================='));
      console.log(`🛍️ Ventas: ${chalk.bold(ventas.length)}`);
      console.log(`💵 Total del día: ${chalk.bold.green(this.formatBs(total))}`);
    } catch (e) {
      console.log(chalk.red('❌ Error:'), chalk.red(e.message));
    }
  }

  async verVentasSemanalesTUI() {
    this.clearScreen('VENTAS SEMANALES (últimos 7 días)');
    try {
      const stats = await this.saleManager.getSalesStats(7);
      if (!stats.length) {
        console.log(chalk.yellow('📭 No hay ventas en la última semana.'));
        return;
      }

      console.log(chalk.bold('📅 Por día:\n'));
      let totalVentas = 0;
      let ingresosTotales = 0;

      stats.forEach((d) => {
        const ventasDia = Number(d.total_ventas);
        const ingresosDia = Number(d.ingresos_totales);
        console.log(
          `• ${d.fecha}: ${ventasDia} ventas — ${chalk.green(
            this.formatBs(ingresosDia)
          )} (prom: ${this.formatBs(d.promedio_por_venta)})`
        );
        totalVentas += ventasDia;
        ingresosTotales += ingresosDia;
      });

      console.log(chalk.gray('\n=============================='));
      console.log(`🛍️ Ventas totales: ${chalk.bold(totalVentas)}`);
      console.log(
        `💵 Ingresos totales: ${chalk.bold.green(this.formatBs(ingresosTotales))}`
      );
      console.log(
        `📈 Promedio diario: ${chalk.green(
          this.formatBs(ingresosTotales / stats.length)
        )}`
      );
    } catch (e) {
      console.log(chalk.red('❌ Error:'), chalk.red(e.message));
    }
  }

  async verVentasMensualesTUI() {
    this.clearScreen('VENTAS MENSUALES (últimos 30 días)');
    try {
      const stats = await this.saleManager.getSalesStats(30);
      if (!stats.length) {
        console.log(chalk.yellow('📭 No hay ventas en los últimos 30 días.'));
        return;
      }

      stats.forEach((d) => {
        console.log(
          `• ${d.fecha}: ${d.total_ventas} ventas — ${chalk.green(
            this.formatBs(d.ingresos_totales)
          )} (prom: ${this.formatBs(d.promedio_por_venta)})`
        );
      });
    } catch (e) {
      console.log(chalk.red('❌ Error:'), chalk.red(e.message));
    }
  }

  async verProductosMasVendidosTUI() {
    this.clearScreen('PRODUCTOS MÁS VENDIDOS');
    try {
      const top = await this.saleManager.getTopSellingProducts(10);
      if (!top.length) {
        console.log(chalk.yellow('📭 No hay datos de ventas aún.'));
        return;
      }

      top.forEach((p, i) => {
        console.log(chalk.cyan(`${i + 1}. ${p.nombre}`));
        console.log(`   📦 Vendidos: ${p.total_vendido} unidades`);
        console.log(`   💰 Ingresos: ${chalk.green(this.formatBs(p.total_ingresos))}`);
        console.log(`   🏷️ Categoría: ${chalk.magenta(p.categoria)}`);
        console.log(chalk.gray('   ───────────────────────────────────'));
      });
    } catch (e) {
      console.log(chalk.red('❌ Error:'), chalk.red(e.message));
    }
  }

  async verEstadisticasAvanzadasTUI() {
    this.clearScreen('ESTADÍSTICAS (30 DÍAS)');
    try {
      const stats = await this.saleManager.getSalesStats(30);
      if (!stats.length) {
        console.log(chalk.yellow('📭 No hay suficientes datos para estadísticas.'));
        return;
      }

      let totalVentas = 0,
        totalIngresos = 0;
      let mejorDia = { fecha: '', ingresos: 0 };

      stats.forEach((d) => {
        console.log(chalk.cyan(`📅 ${d.fecha}`));
        console.log(`   🛍️ Ventas: ${d.total_ventas}`);
        console.log(`   💰 Ingresos: ${chalk.green(this.formatBs(d.ingresos_totales))}`);
        console.log(
          `   📊 Promedio por venta: ${this.formatBs(d.promedio_por_venta)}`
        );
        console.log(chalk.gray('   ───────────────────────────────────'));

        const ventasDia = Number(d.total_ventas);
        const ingresosDia = Number(d.ingresos_totales);

        totalVentas += ventasDia;
        totalIngresos += ingresosDia;
        if (ingresosDia > mejorDia.ingresos) {
          mejorDia = { fecha: d.fecha, ingresos: ingresosDia };
        }
      });

      console.log(chalk.bold('\n📋 RESUMEN GENERAL'));
      console.log(`   📅 Días con ventas: ${stats.length}`);
      console.log(`   🛍️ Total de ventas: ${totalVentas}`);
      console.log(`   💵 Ingresos totales: ${chalk.green(this.formatBs(totalIngresos))}`);
      console.log(
        `   📈 Promedio diario: ${chalk.green(
          this.formatBs(totalIngresos / stats.length)
        )}`
      );
      console.log(
        `   🏆 Mejor día: ${chalk.cyan(mejorDia.fecha)} (${chalk.green(
          this.formatBs(mejorDia.ingresos)
        )})`
      );
    } catch (e) {
      console.log(chalk.red('❌ Error:'), chalk.red(e.message));
    }
  }

  async cancelarVentaTUI() {
    this.clearScreen('CANCELAR VENTA');
    try {
      const ventas = await this.saleManager.getTodaySales();
      if (!ventas.length) {
        console.log(chalk.yellow('📭 No hay ventas recientes para cancelar.'));
        return;
      }

      const { ventaId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'ventaId',
          message: 'Selecciona la venta a cancelar:',
          choices: ventas.map((v) => ({
            name: `#${v.id} — ${this.toLocal(v.fecha_hora)} — ${this.formatBs(
              v.total
            )} — Items: ${v.total_productos}`,
            value: v.id,
          })),
        },
      ]);

      const ventaSeleccionada = ventas.find((v) => v.id === ventaId);
      if (!ventaSeleccionada) {
        console.log(chalk.red('❌ Venta no encontrada.'));
        return;
      }

      console.log(chalk.bold('\n📋 RESUMEN DE LA VENTA'));
      console.log(`   Fecha: ${this.toLocal(ventaSeleccionada.fecha_hora)}`);
      console.log(`   Total: ${chalk.green(this.formatBs(ventaSeleccionada.total))}`);
      console.log(`   Items: ${ventaSeleccionada.total_productos}`);

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: '¿Confirmas la cancelación?',
          default: false,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow('❌ Cancelación abortada.'));
        return;
      }

      const res = await this.saleManager.cancelSale(ventaId);
      console.log(chalk.green(res.mensaje));
      console.log(chalk.green('📦 Stock restaurado.'));
    } catch (e) {
      console.log(chalk.red('❌ Error:'), chalk.red(e.message));
    }
  }

  async generarPDFbajoStockTUI() {
    this.clearScreen('PDF: STOCK BAJO');
    try {
      const productos = await this.saleManager.getLowStockProductsByCategory();
      if (!productos.length) {
        console.log(chalk.green('✅ No hay productos con stock bajo.'));
        return;
      }

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Se generará un PDF con ${productos.length} productos. ¿Continuar?`,
          default: true,
        },
      ]);
      if (!confirm) {
        console.log(chalk.yellow('❌ Operación cancelada.'));
        return;
      }

      const PdfService = require('../core/services/PdfService');
      const pdfService = new PdfService();
      const res = await pdfService.generateLowStockReport(productos);

      console.log(chalk.green(res.message));
      console.log(`📁 Archivo: ${chalk.cyan(res.filePath)}`);
    } catch (e) {
      console.log(chalk.red('❌ Error:'), chalk.red(e.message));
    }
  }

  // REPORTES
  async showReportsMenu() {
    this.clearScreen('REPORTES Y ESTADÍSTICAS');

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: chalk.bold('Selecciona un reporte:'),
        choices: [
          { name: '🏆 Top productos', value: 'top' },
          { name: '📈 Estadísticas (30 días)', value: 'stats' },
          { name: '📄 PDF Stock Bajo', value: 'pdf_low' },
          new inquirer.Separator(),
          { name: '🔙 Volver', value: 'back' },
        ],
      },
    ]);

    switch (action) {
      case 'top':
        await this.verProductosMasVendidosTUI();
        break;
      case 'stats':
        await this.verEstadisticasAvanzadasTUI();
        break;
      case 'pdf_low':
        await this.generarPDFbajoStockTUI();
        break;
      case 'back':
        await this.showMainMenu();
        return;
    }

    await this.waitForContinue();
    await this.showReportsMenu();
  }

  // SALIR
  salir() {
    this.forceClear();
    console.log(chalk.green('\n👋 ¡Gracias por usar el sistema! Hasta pronto.\n'));
    setTimeout(() => {
      this.forceClear();
      process.exit(0);
    }, 400);
  }

  async iniciar() {
    await this.showIntro();
    await this.showMainMenu();
  }
}

// ARRANQUE: primero inicializar BD con Sequelize, luego la TUI
(async () => {
  try {
    console.log('🗄️ Inicializando base de datos (TUI)...');
    await initDatabase();
    const app = new TUIApp();
    await app.iniciar();
  } catch (err) {
    console.error('❌ Error al iniciar la TUI:', err.message);
    process.exit(1);
  }
})();
