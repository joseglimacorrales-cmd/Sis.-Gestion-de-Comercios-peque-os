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
                const doc = new PDFDocument();
                const filePath = path.join(this.reportsDir, filename || `stock-bajo-${new Date().toISOString().split('T')[0]}.pdf`);
                
                // Pipe el PDF a un archivo
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // Encabezado del documento
                doc.fontSize(20)
                   .font('Helvetica-Bold')
                   .fillColor('#2c3e50')
                   .text('REPORTE DE STOCK BAJO', 100, 100, { align: 'center' });

                doc.fontSize(12)
                   .font('Helvetica')
                   .fillColor('#7f8c8d')
                   .text(`Generado el: ${new Date().toLocaleDateString()}`, 100, 130, { align: 'center' });

                // Información resumen
                let yPosition = 180;
                
                doc.fontSize(14)
                   .fillColor('#e74c3c')
                   .text(`Total de productos con stock bajo: ${productos.length}`, 100, yPosition);
                
                yPosition += 30;

                // Agrupar por categoría
                const productosPorCategoria = {};
                productos.forEach(producto => {
                    if (!productosPorCategoria[producto.categoria]) {
                        productosPorCategoria[producto.categoria] = [];
                    }
                    productosPorCategoria[producto.categoria].push(producto);
                });

                // Generar tabla por categoría
                Object.keys(productosPorCategoria).forEach(categoria => {
                    const productosCategoria = productosPorCategoria[categoria];
                    
                    // Título de categoría
                    doc.fontSize(12)
                       .font('Helvetica-Bold')
                       .fillColor('#2c3e50')
                       .text(`Categoría: ${categoria} (${productosCategoria.length} productos)`, 100, yPosition);
                    
                    yPosition += 25;

                    // Encabezados de tabla
                    doc.fontSize(10)
                       .font('Helvetica-Bold')
                       .fillColor('#34495e');
                    
                    doc.text('Producto', 100, yPosition);
                    doc.text('Stock Actual', 250, yPosition);
                    doc.text('Stock Mínimo', 320, yPosition);
                    doc.text('Faltante', 390, yPosition);
                    doc.text('Precio Compra', 450, yPosition);
                    
                    yPosition += 20;
                    doc.moveTo(100, yPosition).lineTo(520, yPosition).stroke();
                    yPosition += 10;

                    // Productos de la categoría
                    doc.font('Helvetica')
                       .fillColor('#2c3e50');

                    productosCategoria.forEach(producto => {
                        // Verificar si necesita nueva página
                        if (yPosition > 700) {
                            doc.addPage();
                            yPosition = 100;
                        }

                        doc.text(producto.nombre, 100, yPosition, { width: 140 });
                        doc.text(producto.stock.toString(), 250, yPosition);
                        doc.text(producto.stock_minimo.toString(), 320, yPosition);
                        
                        // Faltante en rojo si es crítico
                        const faltante = producto.stock_minimo - producto.stock;
                        if (faltante > 0) {
                            doc.fillColor('#e74c3c')
                               .text(faltante.toString(), 390, yPosition)
                               .fillColor('#2c3e50');
                        } else {
                            doc.text('0', 390, yPosition);
                        }
                        
                        doc.text(`Bs.${producto.precio_compra}`, 450, yPosition);
                        
                        yPosition += 20;
                    });

                    yPosition += 20; // Espacio entre categorías
                });

                // Pie de página
                doc.fontSize(8)
                   .fillColor('#7f8c8d')
                   .text('Sistema de Gestión de Tienda - Reporte automático', 100, 750, { align: 'center' });

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