import prisma from '../prisma/client.js';

/**
 * POS Configuration Service
 * 
 * CRITICAL RULES:
 * - Only ONE PosConfig row must exist in the database
 * - Configuration controls runtime POS behavior:
 *   - Payment methods available at checkout
 *   - Kitchen Display order routing
 *   - UPI QR code generation
 * - This is NOT cosmetic configuration
 */

export const posConfigService = {
  /**
   * Get POS Configuration (singleton)
   * Creates default config if none exists
   */
  async getConfig() {
    let config = await prisma.posConfig.findFirst();

    // If no config exists, create default
    if (!config) {
      config = await prisma.posConfig.create({
        data: {
          posName: 'Restaurant POS',
          defaultTax: 5.0,
          enableKitchenDisplay: true,
          enableCustomerDisplay: false,
          enableCash: true,
          enableDigital: true,
          enableUpi: false,
          upiId: null,
        },
      });
    }

    return config;
  },

  /**
   * Update POS Configuration
   * Validates input and updates singleton config
   */
  async updateConfig(data) {
    // Validation
    if (data.posName && data.posName.trim().length === 0) {
      const error = new Error('POS Name cannot be empty');
      error.statusCode = 400;
      throw error;
    }

    if (data.defaultTax !== undefined) {
      if (data.defaultTax < 0 || data.defaultTax > 100) {
        const error = new Error('Tax percentage must be between 0 and 100');
        error.statusCode = 400;
        throw error;
      }
    }

    // If UPI is enabled, UPI ID is required
    if (data.enableUpi && !data.upiId) {
      const error = new Error('UPI ID is required when UPI payment is enabled');
      error.statusCode = 400;
      throw error;
    }

    // Get existing config
    let config = await this.getConfig();

    // Update config
    config = await prisma.posConfig.update({
      where: { id: config.id },
      data: {
        ...(data.posName !== undefined && { posName: data.posName }),
        ...(data.defaultTax !== undefined && { defaultTax: data.defaultTax }),
        ...(data.enableKitchenDisplay !== undefined && { enableKitchenDisplay: data.enableKitchenDisplay }),
        ...(data.enableCustomerDisplay !== undefined && { enableCustomerDisplay: data.enableCustomerDisplay }),
        ...(data.enableCash !== undefined && { enableCash: data.enableCash }),
        ...(data.enableDigital !== undefined && { enableDigital: data.enableDigital }),
        ...(data.enableUpi !== undefined && { enableUpi: data.enableUpi }),
        ...(data.upiId !== undefined && { upiId: data.upiId }),
      },
    });

    return config;
  },

  /**
   * Get available payment methods based on config
   * Used by POS checkout to determine valid payment options
   */
  async getAvailablePaymentMethods() {
    const config = await this.getConfig();
    const methods = [];

    if (config.enableCash) methods.push('cash');
    if (config.enableDigital) methods.push('digital');
    if (config.enableUpi && config.upiId) methods.push('upi');

    return methods;
  },
};