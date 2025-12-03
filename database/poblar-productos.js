// database/poblar-productos.js
const ProductManager = require('../core/managers/ProductManager');
const SaleManager = require('../core/managers/SaleManager');
const { initDatabase, Product, Sale } = require('../core/models');

// Script para poblar la base de datos usando Sequelize
// y los managers actuales (ProductManager / SaleManager)

class PobladorProductos {
  constructor() {
    this.productManager = new ProductManager();
    this.saleManager = new SaleManager();
  }

  // Productos típicos de una tienda de barrio
  obtenerProductosEjemplo() {
    return [
      // ABARROTES
      { nombre: 'Arroz Diana 1kg', precioCompra: 2.5, precioVenta: 3.5, stock: 20, categoria: 'Abarrotes' },
      { nombre: 'Azúcar Blanca 1kg', precioCompra: 3.0, precioVenta: 4.0, stock: 15, categoria: 'Abarrotes' },
      { nombre: 'Aceite Girasol 1L', precioCompra: 8.0, precioVenta: 10.0, stock: 12, categoria: 'Abarrotes' },
      { nombre: 'Harina PAN 1kg', precioCompra: 4.0, precioVenta: 5.5, stock: 18, categoria: 'Abarrotes' },
      { nombre: 'Sal Refisal 1kg', precioCompra: 1.5, precioVenta: 2.5, stock: 25, categoria: 'Abarrotes' },

      // LÁCTEOS
      { nombre: 'Leche Parmalat 1L', precioCompra: 4.5, precioVenta: 6.0, stock: 10, categoria: 'Lácteos' },
      { nombre: 'Queso Blanco 500g', precioCompra: 12.0, precioVenta: 16.0, stock: 8, categoria: 'Lácteos' },
      { nombre: 'Mantequilla 250g', precioCompra: 6.0, precioVenta: 8.5, stock: 6, categoria: 'Lácteos' },
      { nombre: 'Yogurt Natural 1L', precioCompra: 5.0, precioVenta: 7.0, stock: 9, categoria: 'Lácteos' },

      // BEBIDAS
      { nombre: 'Coca-Cola 2L', precioCompra: 6.0, precioVenta: 8.0, stock: 15, categoria: 'Bebidas' },
      { nombre: 'Pepsi 2L', precioCompra: 5.5, precioVenta: 7.5, stock: 12, categoria: 'Bebidas' },
      { nombre: 'Agua Mineral 500ml', precioCompra: 2.0, precioVenta: 3.0, stock: 30, categoria: 'Bebidas' },
      { nombre: 'Jugo Hit 1L', precioCompra: 4.0, precioVenta: 6.0, stock: 10, categoria: 'Bebidas' },
      { nombre: 'Café Fama 500g', precioCompra: 12.0, precioVenta: 16.0, stock: 8, categoria: 'Bebidas' },

      // ENLATADOS
      { nombre: 'Atún Enlatado 200g', precioCompra: 5.0, precioVenta: 7.0, stock: 12, categoria: 'Enlatados' },
      { nombre: 'Sardinas en Salsa', precioCompra: 3.5, precioVenta: 5.0, stock: 15, categoria: 'Enlatados' },
      { nombre: 'Maíz Dulce Enlatado', precioCompra: 4.0, precioVenta: 6.0, stock: 10, categoria: 'Enlatados' },
      { nombre: 'Frijoles Negros Lata', precioCompra: 3.0, precioVenta: 4.5, stock: 14, categoria: 'Enlatados' },

      // LIMPIEZA
      { nombre: 'Jabón Rey 3un', precioCompra: 4.0, precioVenta: 6.0, stock: 20, categoria: 'Limpieza' },
      { nombre: 'Detergente Ace 500g', precioCompra: 5.0, precioVenta: 7.5, stock: 12, categoria: 'Limpieza' },
      { nombre: 'Cloro Clorox 1L', precioCompra: 3.5, precioVenta: 5.0, stock: 18, categoria: 'Limpieza' },
      { nombre: 'Lavaplatos Axion', precioCompra: 4.5, precioVenta: 6.5, stock: 15, categoria: 'Limpieza' },
      { nombre: 'Papel Higiénico 4rollos', precioCompra: 8.0, precioVenta: 12.0, stock: 10, categoria: 'Limpieza' },

      // SNACKS Y DULCES
      { nombre: 'Galletas Oreo', precioCompra: 3.0, precioVenta: 4.5, stock: 25, categoria: 'Snacks' },
      { nombre: 'Papas Margarita', precioCompra: 2.5, precioVenta: 4.0, stock: 20, categoria: 'Snacks' },
      { nombre: "Chocolate Hershey's", precioCompra: 2.0, precioVenta: 3.5, stock: 30, categoria: 'Snacks' },
      { nombre: 'Chicles Trident', precioCompra: 1.5, precioVenta: 2.5, stock: 40, categoria: 'Snacks' },
      { nombre: 'Mani con Pasas', precioCompra: 3.5, precioVenta: 5.0, stock: 15, categoria: 'Snacks' },

      // PANADERÍA
      { nombre: 'Pan Bimbo Grande', precioCompra: 6.0, precioVenta: 8.5, stock: 8, categoria: 'Panadería' },
      { nombre: 'Pan Francés Unidad', precioCompra: 0.5, precioVenta: 1.0, stock: 50, categoria: 'Panadería' },
      { nombre: 'Tostadas Integrales', precioCompra: 3.0, precioVenta: 4.5, stock: 12, categoria: 'Panadería' },

      // CARNES Y EMBUTIDOS
      { nombre: 'Jamón de Pierna 500g', precioCompra: 18.0, precioVenta: 24.0, stock: 6, categoria: 'Carnes' },
      { nombre: 'Salchichas Rancheras', precioCompra: 8.0, precioVenta: 12.0, stock: 10, categoria: 'Carnes' },
      { nombre: 'Mortadela 500g', precioCompra: 10.0, precioVenta: 14.0, stock: 8, categoria: 'Carnes' },

      // HIGIENE PERSONAL
      { nombre: 'Pasta Dental Colgate', precioCompra: 4.0, precioVenta: 6.0, stock: 15, categoria: 'Higiene' },
      { nombre: 'Jabón Dove', precioCompra: 3.0, precioVenta: 4.5, stock: 20, categoria: 'Higiene' },
      { nombre: 'Shampoo Sedal', precioCompra: 6.0, precioVenta: 9.0, stock: 10, categoria: 'Higiene' },
      { nombre: 'Desodorante Rexona', precioCompra: 5.0, precioVenta: 7.5, stock: 12, categoria: 'Higiene' },

      // 🆕 PRODUCTOS CON STOCK BAJO PARA PROBAR ALERTAS
      { nombre: 'Aceite de Oliva 500ml', precioCompra: 15.0, precioVenta: 20.0, stock: 2, categoria: 'Abarrotes', stock_minimo: 5 },
      { nombre: 'Mermelada de Fresa', precioCompra: 4.0, precioVenta: 6.0, stock: 1, categoria: 'Abarrotes', stock_minimo: 5 },
      { nombre: 'Leche Condensada', precioCompra: 5.0, precioVenta: 7.0, stock: 3, categoria: 'Lácteos', stock_minimo: 5 },
      { nombre: 'Queso Parmesano 200g', precioCompra: 8.0, precioVenta: 12.0, stock: 2, categoria: 'Lácteos', stock_minimo: 5 },
      { nombre: 'Energizante Red Bull', precioCompra: 7.0, precioVenta: 10.0, stock: 4, categoria: 'Bebidas', stock_minimo: 5 },
      { nombre: 'Jugo de Naranja 1L', precioCompra: 5.0, precioVenta: 7.5, stock: 1, categoria: 'Bebidas', stock_minimo: 5 },
      { nombre: 'Atún en Aceite', precioCompra: 6.0, precioVenta: 8.5, stock: 3, categoria: 'Enlatados', stock_minimo: 5 },
      { nombre: 'Sopa en Lata', precioCompra: 3.5, precioVenta: 5.0, stock: 2, categoria: 'Enlatados', stock_minimo: 5 },
      { nombre: 'Jabón Líquido', precioCompra: 6.0, precioVenta: 9.0, stock: 4, categoria: 'Limpieza', stock_minimo: 5 },
      { nombre: 'Suavizante de Ropa', precioCompra: 5.0, precioVenta: 7.5, stock: 2, categoria: 'Limpieza', stock_minimo: 5 },
      { nombre: 'Papas Fritas Artesanales', precioCompra: 4.0, precioVenta: 6.0, stock: 3, categoria: 'Snacks', stock_minimo: 5 },
      { nombre: 'Barra de Cereal', precioCompra: 2.0, precioVenta: 3.5, stock: 1, categoria: 'Snacks', stock_minimo: 5 },
      { nombre: 'Pan de Hamburguesa', precioCompra: 4.0, precioVenta: 6.0, stock: 2, categoria: 'Panadería', stock_minimo: 5 },
      { nombre: 'Tocino 200g', precioCompra: 12.0, precioVenta: 16.0, stock: 4, categoria: 'Carnes', stock_minimo: 5 },
      { nombre: 'Chorizo Parrillero', precioCompra: 10.0, precioVenta: 14.0, stock: 3, categoria: 'Carnes', stock_minimo: 5 },
      { nombre: 'Crema Dental Familiar', precioCompra: 5.0, precioVenta: 7.5, stock: 2, categoria: 'Higiene', stock_minimo: 5 },
      { nombre: 'Gel de Baño', precioCompra: 4.0, precioVenta: 6.0, stock: 1, categoria: 'Higiene', stock_minimo: 5 },

      // 🆕 PRODUCTOS CRÍTICOS (stock = 0)
      { nombre: 'Café Molido Premium', precioCompra: 15.0, precioVenta: 20.0, stock: 0, categoria: 'Bebidas', stock_minimo: 5 },
      { nombre: 'Miel de Abeja Pura', precioCompra: 12.0, precioVenta: 16.0, stock: 0, categoria: 'Abarrotes', stock_minimo: 5 },
      { nombre: 'Queso Crema 200g', precioCompra: 6.0, precioVenta: 9.0, stock: 0, categoria: 'Lácteos', stock_minimo: 5 },
      { nombre: 'Agua Tónica', precioCompra: 3.0, precioVenta: 4.5, stock: 0, categoria: 'Bebidas', stock_minimo: 5 },
      { nombre: 'Salsa de Tomate', precioCompra: 4.0, precioVenta: 6.0, stock: 0, categoria: 'Enlatados', stock_minimo: 5 },
    ];
  }

  // Crear ventas de ejemplo para probar reportes (usando SaleManager + Sale)
  async crearVentasDeEjemplo() {
    console.log('\n💰 CREANDO VENTAS DE EJEMPLO...');

    const productos = await this.productManager.getAllProducts();
    const productosConStock = productos.filter((p) => p.stock > 0);

    if (!productosConStock.length) {
      console.log('❌ No hay productos con stock disponible para crear ventas');
      return [];
    }

    const ventasCreadas = [];

    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    const hace3Dias = new Date(hoy);
    hace3Dias.setDate(hoy.getDate() - 3);
    const hace15Dias = new Date(hoy);
    hace15Dias.setDate(hoy.getDate() - 15);

    // Helper para armar una venta aleatoria
    const crearVentaRandom = () => {
      const productosVenta = [];
      const cantidadProductos = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < cantidadProductos; j++) {
        const producto =
          productosConStock[Math.floor(Math.random() * productosConStock.length)];
        if (!producto || producto.stock <= 0) continue;

        const cantidad = Math.floor(Math.random() * 3) + 1;
        const cantidadFinal = Math.min(cantidad, producto.stock);

        if (cantidadFinal > 0) {
          productosVenta.push({
            productoId: producto.id,
            nombre: producto.nombre,
            cantidad: cantidadFinal,
            precioUnitario: Number(producto.precio_venta),
            subtotal: cantidadFinal * Number(producto.precio_venta),
          });
        }
      }

      return productosVenta;
    };

    // Ventas de HOY (usar registerSale directamente)
    console.log('\n📅 VENTAS DE HOY:');
    for (let i = 0; i < 5; i++) {
      try {
        const productosVenta = crearVentaRandom();
        if (!productosVenta.length) continue;

        const totalVenta = productosVenta.reduce((s, item) => s + item.subtotal, 0);
        const montoRecibido = Math.ceil(totalVenta + 10);

        const venta = await this.saleManager.registerSale(
          productosVenta,
          'efectivo',
          montoRecibido
        );
        ventasCreadas.push({ ...venta, fecha: new Date() });

        console.log(
          `   ✅ Venta HOY ${i + 1}: Bs.${venta.total.toFixed(
            2
          )} (${productosVenta.length} productos)`
        );
      } catch (error) {
        console.log(`   ❌ Error en venta HOY ${i + 1}: ${error.message}`);
      }
    }

    // Helper para crear ventas en fechas pasadas:
    const crearVentasEnFecha = async (cantidadVentas, fechaBase, label) => {
      console.log(`\n📅 VENTAS ${label}:`);
      for (let i = 0; i < cantidadVentas; i++) {
        try {
          const productosVenta = crearVentaRandom();
          if (!productosVenta.length) continue;

          const totalVenta = productosVenta.reduce((s, item) => s + item.subtotal, 0);
          const montoRecibido = Math.ceil(totalVenta + 10);

          const venta = await this.saleManager.registerSale(
            productosVenta,
            'efectivo',
            montoRecibido
          );

          // Ajustar la fecha de la venta luego de creada
          const fecha = new Date(fechaBase);
          // pequeño random de horas/minutos para que no todas tengan la misma hora
          fecha.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));

          await Sale.update(
            { fecha_hora: fecha },
            { where: { id: venta.id } }
          );

          ventasCreadas.push({ ...venta, fecha });

          console.log(
            `   ✅ Venta ${label} ${i + 1}: Bs.${venta.total.toFixed(
              2
            )} (${productosVenta.length} productos)`
          );
        } catch (error) {
          console.log(`   ❌ Error en venta ${label} ${i + 1}: ${error.message}`);
        }
      }
    };

    // Ventas de AYER
    await crearVentasEnFecha(3, ayer, 'DE AYER');

    // Ventas de hace 3 días
    await crearVentasEnFecha(4, hace3Dias, 'DE HACE 3 DÍAS');

    // Ventas de hace 15 días
    await crearVentasEnFecha(6, hace15Dias, 'DE HACE 15 DÍAS');

    console.log(`\n💰 TOTAL VENTAS CREADAS: ${ventasCreadas.length}`);
    return ventasCreadas;
  }

  async poblarBaseDeDatos() {
    try {
      console.log('🚀 Iniciando población de base de datos...\n');

      const productos = this.obtenerProductosEjemplo();
      let productosAgregados = 0;
      let productosConError = 0;

      for (const productoData of productos) {
        try {
          const producto = await this.productManager.addProduct({
            nombre: productoData.nombre,
            categoria: productoData.categoria || 'General',
            precio_compra: Number(productoData.precioCompra),
            precio_venta: Number(productoData.precioVenta),
            stock: Number(productoData.stock ?? 0),
            stock_minimo: Number(productoData.stock_minimo ?? 5),
            codigo_barras: null,
          });

          console.log(
            `✅ ${producto.nombre} - Bs.${producto.precio_venta} - Stock: ${producto.stock}`
          );
          productosAgregados++;
        } catch (error) {
          console.log(`❌ Error con ${productoData.nombre}: ${error.message}`);
          productosConError++;
        }
      }

      console.log('\n📊 RESUMEN DE POBLACIÓN:');
      console.log(`✅ Productos agregados: ${productosAgregados}`);
      console.log(`❌ Productos con error: ${productosConError}`);
      console.log(`📦 Total de productos en arreglo: ${productos.length}`);

      // Mostrar productos por categoría desde la BD
      const productosDB = await this.productManager.getAllProducts();
      const porCategoria = {};

      productosDB.forEach((producto) => {
        if (!porCategoria[producto.categoria]) {
          porCategoria[producto.categoria] = 0;
        }
        porCategoria[producto.categoria]++;
      });

      console.log('\n🏷️ DISTRIBUCIÓN POR CATEGORÍA:');
      Object.keys(porCategoria).forEach((categoria) => {
        console.log(`   ${categoria}: ${porCategoria[categoria]} productos`);
      });

      // Mostrar productos con stock bajo
      console.log('\n⚠️  PRODUCTOS CON STOCK BAJO (para probar alertas):');
      const productosBajoStock = await this.productManager.getLowStockProducts();
      if (!productosBajoStock.length) {
        console.log('   ✅ No hay productos con stock bajo');
      } else {
        productosBajoStock.forEach((producto) => {
          const faltante = (producto.stock_minimo || 5) - producto.stock;
          console.log(
            `   ❗ ${producto.nombre} - Stock: ${producto.stock} (Faltan: ${faltante})`
          );
        });
        console.log(`   📊 Total productos con stock bajo: ${productosBajoStock.length}`);
      }

      // Crear ventas de ejemplo
      await this.crearVentasDeEjemplo();
    } catch (error) {
      console.log('❌ Error general en poblarBaseDeDatos:', error.message);
    }
  }

  // Limpiar y repoblar (soft delete usando ProductManager)
  async limpiarYRepoblar() {
    try {
      console.log('🧹 Limpiando base de datos (soft delete de productos)...');

      const productosExistentes = await this.productManager.getAllProducts();
      for (const producto of productosExistentes) {
        await this.productManager.deleteProduct(producto.id);
      }

      console.log(`🗑️ ${productosExistentes.length} productos marcados como inactivos`);
      console.log('🔄 Repoblando base de datos...\n');

      await this.poblarBaseDeDatos();
    } catch (error) {
      console.log('❌ Error al limpiar y repoblar:', error.message);
    }
  }
}

// Ejecutar el poblador con inicialización de Sequelize
(async () => {
  try {
    console.log('🗄️ Inicializando base de datos (poblar-productos)...');
    await initDatabase();

    const poblador = new PobladorProductos();
    const argumento = process.argv[2];

    if (argumento === '--clean') {
      await poblador.limpiarYRepoblar();
    } else {
      await poblador.poblarBaseDeDatos();
    }

    console.log('\n✅ Script de población finalizado.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al ejecutar el script de población:', err.message);
    process.exit(1);
  }
})();
