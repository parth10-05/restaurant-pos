import { posConfigService } from '../services/posConfig.service.js';

export const posConfigController = {
  async getConfig(req, res, next) {
    try {
      const config = await posConfigService.getConfig();

      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateConfig(req, res, next) {
    try {
      const config = await posConfigService.updateConfig(req.body);

      res.status(200).json({
        success: true,
        message: 'POS Configuration updated successfully',
        data: config,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAvailablePaymentMethods(req, res, next) {
    try {
      const methods = await posConfigService.getAvailablePaymentMethods();

      res.status(200).json({
        success: true,
        data: methods,
      });
    } catch (error) {
      next(error);
    }
  },
};