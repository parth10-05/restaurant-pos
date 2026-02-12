import PDFDocument from 'pdfkit';
import prisma from '../prisma/client.js';

// Generate receipt PDF for an order
export const generateReceipt = async (orderId) => {
  // Fetch order with all relations
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderLines: true,
      payment: true,
      user: { select: { email: true, role: true } },
      table: {
        include: { floor: true }
      }
    }
  });
  
  if (!order) {
    throw new Error('Order not found');
  }
  
  if (order.status !== 'paid') {
    throw new Error('Only paid orders can generate receipts');
  }
  
  // Fetch receipt settings
  let settings = await prisma.receiptSettings.findFirst();
  if (!settings) {
    // Create default settings if none exist
    settings = await prisma.receiptSettings.create({
      data: {
        restaurantName: 'Sample Restaurant',
        address: '',
        showOrderNumber: true,
        showCashier: true,
        showPaymentMethod: true,
        showItemTax: true,
        showTotalTax: true,
        showQrCode: false,
        paperWidth: '80mm',
        fontScale: 'normal'
      }
    });
  }
  
  // Calculate paper width in points (1mm = 2.83465 points)
  const paperWidthMap = {
    '58mm': 164,   // ~58mm
    '80mm': 227,   // ~80mm
    'A4': 595      // A4 width
  };
  
  const pageWidth = paperWidthMap[settings.paperWidth] || 227;
  const pageHeight = 842; // Auto-height, will extend as needed
  
  // Font size based on scale
  const fontSizeMap = {
    'small': { normal: 8, header: 12, title: 16 },
    'normal': { normal: 10, header: 14, title: 18 },
    'large': { normal: 12, header: 16, title: 20 }
  };
  const fontSize = fontSizeMap[settings.fontScale] || fontSizeMap.normal;
  
  // Create PDF document
  const doc = new PDFDocument({
    size: [pageWidth, pageHeight],
    margins: { top: 20, bottom: 20, left: 10, right: 10 }
  });
  
  const centerX = pageWidth / 2;
  let y = 30;
  
  // Helper functions
  const centerText = (text, yPos, size = fontSize.normal) => {
    doc.fontSize(size).text(text, 0, yPos, { width: pageWidth, align: 'center' });
  };
  
  const leftRightText = (left, right, yPos, size = fontSize.normal) => {
    doc.fontSize(size);
    doc.text(left, 15, yPos, { width: pageWidth * 0.6, align: 'left' });
    doc.text(right, 15, yPos, { width: pageWidth - 30, align: 'right' });
  };
  
  // Header - Restaurant Name
  doc.fontSize(fontSize.title).font('Helvetica-Bold');
  centerText(settings.restaurantName, y, fontSize.title);
  y += fontSize.title + 5;
  
  doc.font('Helvetica');
  
  // Address
  if (settings.address) {
    doc.fontSize(fontSize.normal);
    centerText(settings.address, y);
    y += fontSize.normal + 3;
  }
  
  // Phone
  if (settings.phone) {
    centerText(`Tel: ${settings.phone}`, y);
    y += fontSize.normal + 3;
  }
  
  // GST Number
  if (settings.gstNumber) {
    centerText(`GST: ${settings.gstNumber}`, y);
    y += fontSize.normal + 3;
  }
  
  y += 10;
  doc.moveTo(15, y).lineTo(pageWidth - 15, y).stroke();
  y += 10;
  
  // Order Number
  if (settings.showOrderNumber) {
    doc.fontSize(fontSize.header).font('Helvetica-Bold');
    centerText(`Order #${order.id.substring(0, 8).toUpperCase()}`, y, fontSize.header);
    y += fontSize.header + 5;
    doc.font('Helvetica');
  }
  
  // Date & Time
  doc.fontSize(fontSize.normal);
  const orderDate = new Date(order.createdAt);
  centerText(orderDate.toLocaleString('en-IN'), y);
  y += fontSize.normal + 3;
  
  // Table info
  centerText(`Table: ${order.table.floor.name} - ${order.table.number}`, y);
  y += fontSize.normal + 3;
  
  // Cashier
  if (settings.showCashier) {
    centerText(`Cashier: ${order.user.email}`, y);
    y += fontSize.normal + 3;
  }
  
  y += 5;
  doc.moveTo(15, y).lineTo(pageWidth - 15, y).stroke();
  y += 10;
  
  // Items header
  doc.fontSize(fontSize.normal).font('Helvetica-Bold');
  doc.text('Item', 15, y, { width: pageWidth * 0.5, align: 'left' });
  doc.text('Qty', pageWidth * 0.55, y, { width: pageWidth * 0.15, align: 'center' });
  doc.text('Price', pageWidth * 0.7, y, { width: pageWidth * 0.3 - 15, align: 'right' });
  y += fontSize.normal + 5;
  
  doc.moveTo(15, y).lineTo(pageWidth - 15, y).stroke();
  y += 5;
  doc.font('Helvetica');
  
  // Order items
  let subtotal = 0;
  let totalTax = 0;
  
  for (const line of order.orderLines) {
    const lineTotal = line.price * line.qty;
    subtotal += lineTotal;
    totalTax += line.taxAmount;
    
    // Item name
    doc.fontSize(fontSize.normal);
    doc.text(line.name, 15, y, { width: pageWidth * 0.5, align: 'left' });
    
    // Quantity
    doc.text(line.qty.toString(), pageWidth * 0.55, y, { width: pageWidth * 0.15, align: 'center' });
    
    // Price
    doc.text(`₹${lineTotal.toFixed(2)}`, pageWidth * 0.7, y, { width: pageWidth * 0.3 - 15, align: 'right' });
    y += fontSize.normal + 2;
    
    // Item tax (if enabled)
    if (settings.showItemTax && line.taxAmount > 0) {
      doc.fontSize(fontSize.normal - 1);
      doc.text(`  (Tax: ₹${line.taxAmount.toFixed(2)})`, 15, y, { width: pageWidth * 0.5, align: 'left' });
      y += fontSize.normal;
    }
    
    y += 2;
  }
  
  y += 5;
  doc.moveTo(15, y).lineTo(pageWidth - 15, y).stroke();
  y += 10;
  
  // Totals
  doc.fontSize(fontSize.normal);
  leftRightText('Subtotal:', `₹${subtotal.toFixed(2)}`, y);
  y += fontSize.normal + 3;
  
  if (settings.showTotalTax && totalTax > 0) {
    leftRightText('Tax:', `₹${totalTax.toFixed(2)}`, y);
    y += fontSize.normal + 3;
  }
  
  doc.font('Helvetica-Bold').fontSize(fontSize.header);
  leftRightText('Total:', `₹${order.total.toFixed(2)}`, y, fontSize.header);
  y += fontSize.header + 5;
  doc.font('Helvetica');
  
  y += 5;
  doc.moveTo(15, y).lineTo(pageWidth - 15, y).stroke();
  y += 10;
  
  // Payment method
  if (settings.showPaymentMethod && order.payment) {
    doc.fontSize(fontSize.normal);
    const paymentMethod = order.payment.method.charAt(0).toUpperCase() + order.payment.method.slice(1);
    centerText(`Payment: ${paymentMethod}`, y);
    y += fontSize.normal + 5;
  }
  
  y += 10;
  
  // Footer text
  if (settings.footerText) {
    doc.fontSize(fontSize.normal - 1);
    centerText(settings.footerText, y, fontSize.normal - 1);
    y += fontSize.normal + 5;
  }
  
  // Thank you message
  doc.fontSize(fontSize.normal).font('Helvetica-Bold');
  centerText('Thank You! Visit Again', y);
  
  return doc;
};
