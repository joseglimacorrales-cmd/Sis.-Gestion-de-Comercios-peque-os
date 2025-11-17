// core/services/PdfService.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PdfService {
    constructor() {
        this.reportsDir = path.join(__dirname, '../../reports');
        // Asegurar que existe la carpeta de reportes
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }

    // GENERAR PDF DE PRODUCTOS CON STOCK BAJO
    generateLowStockReport(productos, filename = null) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const filePath = path.join(this.reportsDir, filename || `stock-bajo-${new Date().toISOString().split('T')[0]}.pdf`);
                
                // Pipe el PDF a un archivo
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // Variables para control de páginas
                let yPosition = 100;
                const pageWidth = doc.page.width - 100;
                const marginLeft = 50;
                const marginRight = 50;

                // Función para verificar y agregar nueva página
                const verificarEspacio = (alturaNecesaria = 30) => {
                    if (yPosition + alturaNecesaria > doc.page.height - 50) {
                        doc.addPage();
                        yPosition = 100;
                        return true;
                    }
                    return false;
                };

                // ENCABEZADO DEL DOCUMENTO (solo en primera página)
                doc.fontSize(20)
                   .font('Helvetica-Bold')
                   .fillColor('#2c3e50')
                   .text('REPORTE DE STOCK BAJO', marginLeft, 50, { 
                       align: 'center',
                       width: pageWidth
                   });

                doc.fontSize(12)
                   .font('Helvetica')
                   .fillColor('#7f8c8d')
                   .text(`Generado el: ${new Date().toLocaleDateString()}`, marginLeft, 75, { 
                       align: 'center',
                       width: pageWidth
                   });

                // INFORMACIÓN RESUMEN
                doc.fontSize(14)
                   .fillColor('#e74c3c')
                   .text(`Total de productos con stock bajo: ${productos.length}`, marginLeft, 120);
                
                yPosition = 160;

                // Agrupar por categoría
                const productosPorCategoria = {};
                productos.forEach(producto => {
                    if (!productosPorCategoria[producto.categoria]) {
                        productosPorCategoria[producto.categoria] = [];
                    }
                    productosPorCategoria[producto.categoria].push(producto);
                });

                // GENERAR TABLA POR CATEGORÍA
                Object.keys(productosPorCategoria).forEach(categoria => {
                    const productosCategoria = productosPorCategoria[categoria];
                    
                    // Verificar espacio para la categoría (título + encabezados + al menos 2 productos)
                    verificarEspacio(80);
                    
                    // TÍTULO DE CATEGORÍA
                    doc.fontSize(12)
                       .font('Helvetica-Bold')
                       .fillColor('#2c3e50')
                       .text(`Categoría: ${categoria} (${productosCategoria.length} productos)`, marginLeft, yPosition);
                    
                    yPosition += 25;

                    // DIBUJAR ENCABEZADOS DE TABLA
                    doc.fontSize(10)
                       .font('Helvetica-Bold')
                       .fillColor('#34495e');
                    
                    // Encabezados de columna
                    doc.text('Producto', marginLeft, yPosition, { width: 150 });
                    doc.text('Stock Actual', marginLeft + 160, yPosition, { width: 80 });
                    doc.text('Stock Mínimo', marginLeft + 250, yPosition, { width: 80 });
                    doc.text('Faltante', marginLeft + 340, yPosition, { width: 60 });
                    doc.text('Precio Compra', marginLeft + 410, yPosition, { width: 80 });
                    
                    yPosition += 20;
                    
                    // Línea separadora
                    doc.moveTo(marginLeft, yPosition)
                       .lineTo(marginLeft + 490, yPosition)
                       .stroke();
                    
                    yPosition += 10;

                    // PRODUCTOS DE LA CATEGORÍA
                    doc.font('Helvetica')
                       .fontSize(10)
                       .fillColor('#2c3e50');

                    productosCategoria.forEach(producto => {
                        // Verificar espacio para cada fila
                        if (verificarEspacio(25)) {
                            // Redibujar encabezados si hay nueva página
                            doc.fontSize(10)
                               .font('Helvetica-Bold')
                               .fillColor('#34495e');
                            
                            doc.text('Producto', marginLeft, yPosition, { width: 150 });
                            doc.text('Stock Actual', marginLeft + 160, yPosition, { width: 80 });
                            doc.text('Stock Mínimo', marginLeft + 250, yPosition, { width: 80 });
                            doc.text('Faltante', marginLeft + 340, yPosition, { width: 60 });
                            doc.text('Precio Compra', marginLeft + 410, yPosition, { width: 80 });
                            
                            yPosition += 20;
                            doc.moveTo(marginLeft, yPosition)
                               .lineTo(marginLeft + 490, yPosition)
                               .stroke();
                            yPosition += 10;
                            
                            doc.font('Helvetica')
                               .fillColor('#2c3e50');
                        }

                        // CONTENIDO DE LA FILA
                        const faltante = Math.max(0, producto.stock_minimo - producto.stock);
                        
                        doc.text(producto.nombre, marginLeft, yPosition, { 
                            width: 150,
                            ellipsis: true 
                        });
                        
                        doc.text(producto.stock.toString(), marginLeft + 160, yPosition, { width: 80 });
                        doc.text(producto.stock_minimo.toString(), marginLeft + 250, yPosition, { width: 80 });
                        
                        // FALTANTE EN ROJO SI ES CRÍTICO
                        if (faltante > 0) {
                            doc.fillColor('#e74c3c')
                               .text(faltante.toString(), marginLeft + 340, yPosition, { width: 60 })
                               .fillColor('#2c3e50');
                        } else {
                            doc.text('0', marginLeft + 340, yPosition, { width: 60 });
                        }
                        
                        doc.text(`Bs. ${producto.precio_compra}`, marginLeft + 410, yPosition, { width: 80 });
                        
                        yPosition += 20;
                    });

                    yPosition += 15; // Espacio entre categorías
                });

                doc.end();

                stream.on('finish', () => {
                    resolve({
                        filePath: filePath,
                        filename: path.basename(filePath),
                        message: `✅ PDF generado exitosamente: ${path.basename(filePath)}`
                    });
                });

                stream.on('error', (error) => {
                    reject(new Error(`Error al generar PDF: ${error.message}`));
                });

            } catch (error) {
                reject(new Error(`Error en generación de PDF: ${error.message}`));
            }
        });
    }
}

module.exports = PdfService;