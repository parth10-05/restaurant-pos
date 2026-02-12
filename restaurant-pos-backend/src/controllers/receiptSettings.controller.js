import prisma from '../prisma/client.js';

// Get receipt settings (create default if doesn't exist)
export const getReceiptSettings = async (req, res) => {
  try {
    let settings = await prisma.receiptSettings.findFirst();
    
    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.receiptSettings.create({
        data: {
          restaurantName: 'Sample Restaurant',
          address: '',
          phone: null,
          gstNumber: null,
          logoUrl: null,
          showOrderNumber: true,
          showCashier: true,
          showPaymentMethod: true,
          showItemTax: true,
          showTotalTax: true,
          showQrCode: false,
          paperWidth: '80mm',
          fontScale: 'normal',
          footerText: null
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching receipt settings:', error);
    res.status(500).json({ error: 'Failed to fetch receipt settings' });
  }
};

// Update receipt settings
export const updateReceiptSettings = async (req, res) => {
  try {
    const {
      restaurantName,
      address,
      phone,
      gstNumber,
      logoUrl,
      showOrderNumber,
      showCashier,
      showPaymentMethod,
      showItemTax,
      showTotalTax,
      showQrCode,
      paperWidth,
      fontScale,
      footerText
    } = req.body;
    
    // Validate paper width
    const validPaperWidths = ['58mm', '80mm', 'A4'];
    if (paperWidth && !validPaperWidths.includes(paperWidth)) {
      return res.status(400).json({ error: 'Invalid paper width. Must be 58mm, 80mm, or A4' });
    }
    
    // Validate font scale
    const validFontScales = ['small', 'normal', 'large'];
    if (fontScale && !validFontScales.includes(fontScale)) {
      return res.status(400).json({ error: 'Invalid font scale. Must be small, normal, or large' });
    }
    
    // Get existing settings
    let settings = await prisma.receiptSettings.findFirst();
    
    if (!settings) {
      // Create new settings
      settings = await prisma.receiptSettings.create({
        data: {
          restaurantName: restaurantName || 'Sample Restaurant',
          address: address || '',
          phone,
          gstNumber,
          logoUrl,
          showOrderNumber: showOrderNumber !== undefined ? showOrderNumber : true,
          showCashier: showCashier !== undefined ? showCashier : true,
          showPaymentMethod: showPaymentMethod !== undefined ? showPaymentMethod : true,
          showItemTax: showItemTax !== undefined ? showItemTax : true,
          showTotalTax: showTotalTax !== undefined ? showTotalTax : true,
          showQrCode: showQrCode !== undefined ? showQrCode : false,
          paperWidth: paperWidth || '80mm',
          fontScale: fontScale || 'normal',
          footerText
        }
      });
    } else {
      // Update existing settings
      settings = await prisma.receiptSettings.update({
        where: { id: settings.id },
        data: {
          ...(restaurantName !== undefined && { restaurantName }),
          ...(address !== undefined && { address }),
          ...(phone !== undefined && { phone }),
          ...(gstNumber !== undefined && { gstNumber }),
          ...(logoUrl !== undefined && { logoUrl }),
          ...(showOrderNumber !== undefined && { showOrderNumber }),
          ...(showCashier !== undefined && { showCashier }),
          ...(showPaymentMethod !== undefined && { showPaymentMethod }),
          ...(showItemTax !== undefined && { showItemTax }),
          ...(showTotalTax !== undefined && { showTotalTax }),
          ...(showQrCode !== undefined && { showQrCode }),
          ...(paperWidth !== undefined && { paperWidth }),
          ...(fontScale !== undefined && { fontScale }),
          ...(footerText !== undefined && { footerText })
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating receipt settings:', error);
    res.status(500).json({ error: 'Failed to update receipt settings' });
  }
};
