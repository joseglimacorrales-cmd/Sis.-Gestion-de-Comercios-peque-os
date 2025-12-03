const ProductManager = require('../core/managers/ProductManager'); // 📦
const SaleManager = require('../core/managers/SaleManager');       // 💵
const { initDatabase } = require('../core/models');                // 🗄️ Sequelize + modelos
const PdfService = require('../core/services/PdfService');         // 📄 PDF stock bajo
const readline = require('readline');                              // 🖊️

class ConsoleApp {
  constructor() {
    this.productManager = new ProductManager();  // 🛍️
    this.saleManager = new SaleManager();        // 💳
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
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
    console.log('8️⃣  Ver Ventas Semanales');
    console.log('9️⃣  Ver Ventas Mensuales (últimos 30 días)');
    console.log('🔟  Generar PDF Stock Bajo');
    console.log('📊 11. Ver Productos Más Vendidos');
    console.log('📈 12. Ver Estadísticas Avanzadas (30 días)');
    console.log('❌ 13. Cancelar Venta');
    console.log('🚪 14. Salir');

    this.rl.question('\n➡️ Selecciona una opción: ', (opcion) => {
      switch (opcion) {
        case '1':
          this.agregarProducto();
          break;
        case '2':
          this.mostrarTodosProductos();
          break;
        case '3':
          this.mostrarProductosStockBajo();
          break;
        case '4':
          this.actualizarProducto();
          break;
        case '5':
          this.eliminarProducto();
          break;
        case '6':
          this.registrarVenta();
          break;
        case '7':
          this.verVentasDelDia();
          break;
        case '8':
          this.verventassemanales();
          break;
        case '9':
          this.verventasmensuales();
          break;
        case '10':
          this.generarPDFbajoStock();
          break;
        case '11':
          this.verProductosMasVendidos();
          break;
        case '12':
          this.verEstadisticasAvanzadas();
          break;
        case '13':
          this.cancelarVenta();
          break;
        case '14':
          this.salir();
          break;
        default:
          console.log('❌ Opción no válida');
          this.mostrarMenuPrincipal();
      }
    });
  }

  // ===================== PRODUCTOS =====================

  agregarProducto() {
    console.log('\n➕ --- AGREGAR PRODUCTO ---');
    this.rl.question('📝 Nombre: ', (nombre) => {
      this.rl.question('💰 Precio de Compra: ', (precioCompra) => {
        this.rl.question('💵 Precio de Venta: ', (precioVenta) => {
          this.rl.question('📦 Stock: ', (stock) => {
            this.rl.question('🏷️ Categoría: ', async (categoria) => {
              try {
                const producto = await this.productManager.addProduct({
                  nombre,
                  categoria: categoria || 'General',
                  precio_compra: parseFloat(precioCompra),
                  precio_venta: parseFloat(precioVenta),
                  stock: parseInt(stock, 10),
                });
                console.log('✅ Producto agregado:');
                console.log(
                  `   🆔 ${producto.id} - ${producto.nombre} - Bs.${producto.precio_venta} (Stock: ${producto.stock})`
                );
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

  async mostrarTodosProductos() {
    console.log('\n📦 --- TODOS LOS PRODUCTOS ---');
    try {
      const productos = await this.productManager.getAllProducts();
      if (!productos.length) {
        console.log('ℹ️ No hay productos registrados');
      } else {
        productos.forEach((producto, indice) => {
          console.log(
            `${indice + 1}. [${producto.id}] ${producto.nombre} - 💵 Bs.${producto.precio_venta} (Stock: ${producto.stock})`
          );
        });
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    this.mostrarMenuPrincipal();
  }

  async mostrarProductosStockBajo() {
    console.log('\n⚠️ --- PRODUCTOS CON STOCK BAJO ---');
    try {
      const productos = await this.productManager.getLowStockProducts();
      if (!productos.length) {
        console.log('✅ No hay productos con stock bajo');
      } else {
        console.log(`⚠️ Se encontraron ${productos.length} productos con stock bajo:\n`);
        productos.forEach((producto, indice) => {
          const minimo = producto.stock_minimo || 5;
          const deficit = minimo - producto.stock;
          console.log(`${indice + 1}. ${producto.nombre}`);
          console.log(`   📦 Stock actual: ${producto.stock}`);
          console.log(`   🏷️ Stock mínimo: ${minimo}`);
          console.log(`   ❗ Déficit: ${deficit} unidades`);
          console.log('---');
        });
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    this.mostrarMenuPrincipal();
  }

  async actualizarProducto() {
    console.log('\n✏️ --- ACTUALIZAR PRODUCTO ---');
    try {
      const productos = await this.productManager.getAllProducts();
      if (!productos.length) {
        console.log('ℹ️ No hay productos para actualizar');
        return this.mostrarMenuPrincipal();
      }

      productos.forEach((producto) => {
        console.log(`${producto.id}. ${producto.nombre} - 📦 Stock: ${producto.stock}`);
      });

      this.rl.question('\n🆔 ID del producto a actualizar: ', async (id) => {
        const idProducto = parseInt(id, 10);
        const producto = await this.productManager.getProductById(idProducto);
        if (!producto) {
          console.log('❌ Producto no encontrado');
          return this.mostrarMenuPrincipal();
        }

        console.log(`\n🔄 Actualizando: ${producto.nombre}`);

        this.rl.question('📝 Nuevo nombre (Enter para mantener actual): ', (nombre) => {
          this.rl.question(
            '💰 Nuevo precio de compra (Enter para mantener actual): ',
            (precioCompra) => {
              this.rl.question(
                '💵 Nuevo precio de venta (Enter para mantener actual): ',
                (precioVenta) => {
                  this.rl.question(
                    '📦 Nuevo stock (Enter para mantener actual): ',
                    (stock) => {
                      this.rl.question(
                        '🏷️ Nueva categoría (Enter para mantener actual): ',
                        async (categoria) => {
                          const datosActualizacion = {};
                          if (nombre) datosActualizacion.nombre = nombre;
                          if (precioCompra)
                            datosActualizacion.precio_compra = parseFloat(precioCompra);
                          if (precioVenta)
                            datosActualizacion.precio_venta = parseFloat(precioVenta);
                          if (stock) datosActualizacion.stock = parseInt(stock, 10);
                          if (categoria) datosActualizacion.categoria = categoria;

                          try {
                            const productoActualizado =
                              await this.productManager.updateProduct(
                                idProducto,
                                datosActualizacion
                              );
                            console.log(
                              '✅ Producto actualizado:',
                              productoActualizado.nombre
                            );
                          } catch (error) {
                            console.log('❌ Error:', error.message);
                          }
                          this.mostrarMenuPrincipal();
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        });
      });
    } catch (error) {
      console.log('❌ Error:', error.message);
      this.mostrarMenuPrincipal();
    }
  }

  async eliminarProducto() {
    console.log('\n🗑️ --- ELIMINAR PRODUCTO ---');
    try {
      const productos = await this.productManager.getAllProducts();
      if (!productos.length) {
        console.log('ℹ️ No hay productos para eliminar');
        return this.mostrarMenuPrincipal();
      }

      productos.forEach((producto) => {
        console.log(`${producto.id}. ${producto.nombre}`);
      });

      this.rl.question('\n🆔 ID del producto a eliminar: ', async (id) => {
        const idProducto = parseInt(id, 10);
        const producto = await this.productManager.getProductById(idProducto);
        if (!producto) {
          console.log('❌ Producto no encontrado');
          return this.mostrarMenuPrincipal();
        }

        this.rl.question(
          `⚠️ ¿Estás seguro de eliminar "${producto.nombre}"? (s/n): `,
          async (confirmacion) => {
            if (confirmacion.toLowerCase() === 's') {
              try {
                await this.productManager.deleteProduct(idProducto);
                console.log('✅ Producto eliminado:', producto.nombre);
              } catch (error) {
                console.log('❌ Error:', error.message);
              }
            } else {
              console.log('❌ Eliminación cancelada');
            }
            this.mostrarMenuPrincipal();
          }
        );
      });
    } catch (error) {
      console.log('❌ Error:', error.message);
      this.mostrarMenuPrincipal();
    }
  }

  async mostrarProductosRapido() {
    console.log('\n📦 --- TODOS LOS PRODUCTOS ---');
    try {
      const productos = await this.productManager.getAllProducts();
      if (!productos.length) {
        console.log('ℹ️ No hay productos registrados');
      } else {
        productos.forEach((producto) => {
          console.log(
            `🆔 ${producto.id} - ${producto.nombre} - 💵 Bs.${producto.precio_venta} (Stock: ${producto.stock})`
          );
        });
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  // ===================== VENTAS =====================

  async registrarVenta() {
    console.log('\n🛒 --- REGISTRAR VENTA ---');

    await this.mostrarProductosRapido();

    const ventaProductos = [];

    const agregarProducto = () => {
      this.rl.question('🆔 ID del producto a vender (0 para terminar): ', async (id) => {
        if (id === '0') {
          if (!ventaProductos.length) {
            console.log('❌ Debes agregar al menos un producto');
            return agregarProducto();
          }

          console.log('\n📋 RESUMEN DE VENTA:');
          let total = 0;
          ventaProductos.forEach((item) => {
            console.log(
              `   🛍️ ${item.nombre} x${item.cantidad} - 💵 Bs.${item.subtotal.toFixed(2)}`
            );
            total += item.subtotal;
          });
          console.log(`💰 TOTAL: Bs.${total.toFixed(2)}`);

          this.rl.question(
            '\n💳 Método de pago (efectivo/tarjeta/transferencia): ',
            (metodo) => {
              this.rl.question('💵 Monto recibido: Bs.', async (monto) => {
                try {
                  const resultado = await this.saleManager.registerSale(
                    ventaProductos,
                    metodo,
                    parseFloat(monto)
                  );
                  console.log('✅ Venta registrada correctamente');
                  console.log(
                    `   🆔 ID: ${resultado.id} | Total: Bs.${resultado.total.toFixed(
                      2
                    )} | Cambio: Bs.${resultado.cambio.toFixed(2)}`
                  );
                  console.log(
                    `   🛍️ Productos en la venta: ${resultado.productos}`
                  );
                } catch (error) {
                  console.log('❌ Error al registrar venta:', error.message);
                }
                this.mostrarMenuPrincipal();
              });
            }
          );
          return;
        }

        this.rl.question('🔢 Cantidad: ', async (cantidad) => {
          try {
            const product = await this.productManager.getProductById(
              parseInt(id, 10)
            );
            if (!product) throw new Error('Producto no encontrado');
            const cant = parseInt(cantidad, 10);
            if (product.stock < cant)
              throw new Error(
                `Stock insuficiente. Disponible: ${product.stock}`
              );

            const subtotal = product.precio_venta * cant;
            ventaProductos.push({
              productoId: product.id,
              nombre: product.nombre,
              cantidad: cant,
              precioUnitario: product.precio_venta,
              subtotal,
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

  async verVentasDelDia() {
    console.log('\n📊 --- VENTAS DEL DÍA ---');
    try {
      const ventas = await this.saleManager.getTodaySales();
      if (!ventas.length) {
        console.log('ℹ️ No hay ventas registradas hoy');
      } else {
        ventas.forEach((venta) => {
          const fechaLocal = new Date(venta.fecha_hora);
          console.log(
            `🕒 ${fechaLocal.toLocaleString()} - 💰 Total: Bs.${venta.total} - 🛍️ Productos: ${venta.total_productos}`
          );
        });
        const totalHoy = ventas.reduce((sum, v) => sum + Number(v.total), 0);
        console.log(`💵 TOTAL DEL DÍA: Bs.${totalHoy.toFixed(2)}`);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    this.mostrarMenuPrincipal();
  }

  async verventassemanales() {
    console.log('\n--- VENTAS SEMANALES (últimos 7 días) ---');
    try {
      const stats = await this.saleManager.getSalesStats(7);

      if (!stats.length) {
        console.log('📊 No hay ventas en la última semana');
      } else {
        console.log('\n📅 VENTAS POR DÍA:');
        let totalVentas = 0;
        let ingresosTotales = 0;

        stats.forEach((dia) => {
          const ventasDia = Number(dia.total_ventas);
          const ingresosDia = Number(dia.ingresos_totales);
          console.log(
            `   ${dia.fecha}: ${ventasDia} ventas - Bs.${ingresosDia.toFixed(
              2
            )}`
          );
          totalVentas += ventasDia;
          ingresosTotales += ingresosDia;
        });

        console.log('\n💰 TOTALES DE LA SEMANA:');
        console.log(`   Ventas totales: ${totalVentas}`);
        console.log(`   Ingresos totales: Bs.${ingresosTotales.toFixed(2)}`);
        console.log(
          `   Promedio diario: Bs.${(ingresosTotales / stats.length).toFixed(
            2
          )}`
        );
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    this.mostrarMenuPrincipal();
  }

  async verventasmensuales() {
    console.log('\n--- VENTAS MENSUALES (últimos 30 días) ---');
    try {
      const stats = await this.saleManager.getSalesStats(30);

      if (!stats.length) {
        console.log('📊 No hay ventas en el último mes');
      } else {
        let totalVentas = 0;
        let ingresosTotales = 0;

        stats.forEach((dia) => {
          const ventasDia = Number(dia.total_ventas);
          const ingresosDia = Number(dia.ingresos_totales);
          console.log(
            `   ${dia.fecha}: ${ventasDia} ventas - Bs.${ingresosDia.toFixed(
              2
            )}`
          );
          totalVentas += ventasDia;
          ingresosTotales += ingresosDia;
        });

        console.log('\n📋 RESUMEN (30 días):');
        console.log(`   🛍️ Ventas totales: ${totalVentas}`);
        console.log(`   💰 Ingresos totales: Bs.${ingresosTotales.toFixed(2)}`);
        console.log(
          `   📊 Promedio diario: Bs.${(ingresosTotales / stats.length).toFixed(
            2
          )}`
        );
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    this.mostrarMenuPrincipal();
  }

  // ===================== REPORTES / PDF =====================

  async generarPDFbajoStock() {
    console.log('\n--- GENERAR PDF DE STOCK BAJO ---');
    try {
      const productosBajoStock =
        await this.saleManager.getLowStockProductsByCategory();

      if (!productosBajoStock.length) {
        console.log('✅ No hay productos con stock bajo');
        this.mostrarMenuPrincipal();
        return;
      }

      console.log(
        `📋 Generando PDF para ${productosBajoStock.length} productos con stock bajo...`
      );

      const pdfService = new PdfService();
      const resultado = await pdfService.generateLowStockReport(
        productosBajoStock
      );

      console.log(resultado.message);
      console.log(`📁 Archivo guardado en: ${resultado.filePath}`);
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    this.mostrarMenuPrincipal();
  }

  async verProductosMasVendidos() {
    console.log('\n🏆 --- PRODUCTOS MÁS VENDIDOS ---');
    try {
      const productosMasVendidos =
        await this.saleManager.getTopSellingProducts(10);

      if (!productosMasVendidos.length) {
        console.log('📊 No hay datos de ventas aún');
      } else {
        console.log('\n🏅 TOP 10 PRODUCTOS MÁS VENDIDOS:\n');
        productosMasVendidos.forEach((producto, index) => {
          console.log(`${index + 1}. ${producto.nombre}`);
          console.log(
            `   📦 Vendidos: ${producto.total_vendido} unidades`
          );
          console.log(
            `   💰 Ingresos: Bs.${Number(
              producto.total_ingresos
            ).toFixed(2)}`
          );
          console.log(`   🏷️ Categoría: ${producto.categoria}`);
          console.log('---');
        });
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    this.mostrarMenuPrincipal();
  }

  async verEstadisticasAvanzadas() {
    console.log('\n📈 --- ESTADÍSTICAS AVANZADAS (30 días) ---');
    try {
      const estadisticas = await this.saleManager.getSalesStats(30);

      if (!estadisticas.length) {
        console.log('📊 No hay suficientes datos para estadísticas');
      } else {
        console.log('\n📊 ESTADÍSTICAS DE LOS ÚLTIMOS 30 DÍAS:\n');

        let totalVentas = 0;
        let totalIngresos = 0;
        let mejorDia = { fecha: '', ingresos: 0 };

        estadisticas.forEach((dia) => {
          const ventasDia = Number(dia.total_ventas);
          const ingresosDia = Number(dia.ingresos_totales);
          const promedioVenta = Number(dia.promedio_por_venta);

          console.log(`📅 ${dia.fecha}:`);
          console.log(`   🛍️ Ventas: ${ventasDia}`);
          console.log(`   💰 Ingresos: Bs.${ingresosDia.toFixed(2)}`);
          console.log(
            `   📊 Promedio por venta: Bs.${promedioVenta.toFixed(2)}`
          );
          console.log('---');

          totalVentas += ventasDia;
          totalIngresos += ingresosDia;

          if (ingresosDia > mejorDia.ingresos) {
            mejorDia = { fecha: dia.fecha, ingresos: ingresosDia };
          }
        });

        console.log('\n📋 RESUMEN GENERAL:');
        console.log(`   📅 Días con ventas: ${estadisticas.length}`);
        console.log(`   🛍️ Total de ventas: ${totalVentas}`);
        console.log(`   💰 Ingresos totales: Bs.${totalIngresos.toFixed(2)}`);
        console.log(
          `   📊 Promedio diario: Bs.${(
            totalIngresos / estadisticas.length
          ).toFixed(2)}`
        );
        console.log(
          `   🏆 Mejor día: ${mejorDia.fecha} (Bs.${mejorDia.ingresos.toFixed(
            2
          )})`
        );
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    this.mostrarMenuPrincipal();
  }

  async cancelarVenta() {
    console.log('\n❌ --- CANCELAR VENTA ---');
    try {
      const ventasRecientes = await this.saleManager.getTodaySales();

      if (!ventasRecientes.length) {
        console.log('📊 No hay ventas recientes para cancelar');
        this.mostrarMenuPrincipal();
        return;
      }

      console.log('\n🛒 VENTAS RECIENTES DEL DÍA:\n');
      ventasRecientes.forEach((venta) => {
        const fecha = new Date(venta.fecha_hora).toLocaleTimeString();
        console.log(
          `🆔 ${venta.id} - ${fecha} - Total: Bs.${venta.total} - Productos: ${venta.total_productos}`
        );
      });

      this.rl.question('\n🆔 ID de la venta a cancelar: ', async (idVenta) => {
        const ventaId = parseInt(idVenta, 10);
        const ventaSeleccionada = ventasRecientes.find(
          (v) => v.id === ventaId
        );

        if (!ventaSeleccionada) {
          console.log('❌ Venta no encontrada');
          this.mostrarMenuPrincipal();
          return;
        }

        console.log('\n📋 RESUMEN DE LA VENTA:');
        console.log(
          `   Fecha: ${new Date(
            ventaSeleccionada.fecha_hora
          ).toLocaleString()}`
        );
        console.log(`   Total: Bs.${ventaSeleccionada.total}`);

        this.rl.question(
          '\n⚠️ ¿Estás seguro de cancelar esta venta? (s/n): ',
          async (confirmacion) => {
            if (confirmacion.toLowerCase() === 's') {
              try {
                const resultado = await this.saleManager.cancelSale(ventaId);
                console.log('✅ ' + resultado.mensaje);
                console.log('📦 Stock restaurado exitosamente');
              } catch (error) {
                console.log('❌ Error al cancelar venta:', error.message);
              }
            } else {
              console.log('❌ Cancelación abortada');
            }
            this.mostrarMenuPrincipal();
          }
        );
      });
    } catch (error) {
      console.log('❌ Error:', error.message);
      this.mostrarMenuPrincipal();
    }
  }

  // ===================== SISTEMA =====================

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

// ========= ARRANQUE: primero BD, luego app =========

(async () => {
  try {
    console.log('🗄️ Inicializando base de datos...');
    await initDatabase(); // crea tablas y datos demo si hace falta
    const app = new ConsoleApp();
    app.iniciar();
  } catch (error) {
    console.error('❌ Error al inicializar la aplicación:', error.message);
    process.exit(1);
  }
})();
