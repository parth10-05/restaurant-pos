import { reportService } from '../services/report.service.js';

export const reportController = {
  /**
   * GET /admin/reports/summary
   */
  async getSummary(req, res, next) {
    try {
      const { from, to } = req.query;
      const summary = await reportService.getSalesSummary(from, to);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /admin/reports/payments
   */
  async getPaymentReport(req, res, next) {
    try {
      const { from, to } = req.query;
      const payments = await reportService.getRevenueByPaymentMethod(from, to);

      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /admin/reports/sessions
   */
  async getSessionReport(req, res, next) {
    try {
      const { from, to } = req.query;
      const sessions = await reportService.getSessionReport(from, to);

      res.status(200).json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /admin/reports/products
   */
  async getProductReport(req, res, next) {
    try {
      const { from, to } = req.query;
      const products = await reportService.getProductPerformance(from, to);

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /admin/reports/categories
   */
  async getCategoryReport(req, res, next) {
    try {
      const { from, to } = req.query;
      const categories = await reportService.getCategoryPerformance(from, to);

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  },
};