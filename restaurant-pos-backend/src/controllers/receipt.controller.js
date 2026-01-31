import * as receiptService from '../services/receipt.service.js';

// GET /orders/:orderId/receipt
export const downloadReceipt = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Generate PDF
    const pdfDoc = await receiptService.generateReceipt(orderId);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${orderId.substring(0, 8)}.pdf`);
    
    // Pipe PDF to response
    pdfDoc.pipe(res);
    pdfDoc.end();
    
  } catch (error) {
    console.error('Error generating receipt:', error);
    
    if (error.message === 'Order not found') {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (error.message === 'Only paid orders can generate receipts') {
      return res.status(400).json({ error: 'Only paid orders can generate receipts' });
    }
    
    res.status(500).json({ error: 'Failed to generate receipt' });
  }
};
