import { api } from '../config/api';

export const reportService = {
  /**
   * Get sales summary
   * @param {string} from - Start date (YYYY-MM-DD)
   * @param {string} to - End date (YYYY-MM-DD)
   */
  async getSummary(from, to) {
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await api.get('/admin/reports/summary', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching sales summary:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to fetch summary' };
    }
  },

  /**
   * Get revenue by payment method
   * @param {string} from - Start date (YYYY-MM-DD)
   * @param {string} to - End date (YYYY-MM-DD)
   */
  async getPaymentReport(from, to) {
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await api.get('/admin/reports/payments', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching payment report:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to fetch payment report' };
    }
  },

  /**
   * Get session report
   * @param {string} from - Start date (YYYY-MM-DD)
   * @param {string} to - End date (YYYY-MM-DD)
   */
  async getSessionReport(from, to) {
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await api.get('/admin/reports/sessions', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching session report:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to fetch session report' };
    }
  },

  /**
   * Get product performance report
   * @param {string} from - Start date (YYYY-MM-DD)
   * @param {string} to - End date (YYYY-MM-DD)
   */
  async getProductReport(from, to) {
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await api.get('/admin/reports/products', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Error fetching product report:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to fetch product report' };
    }
  },
};
