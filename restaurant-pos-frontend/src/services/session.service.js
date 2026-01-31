import { api } from '../config/api';

export const sessionService = {
  // Get current active session
  async getCurrentSession() {
    try {
      const response = await api.get('/sessions/current');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch current session',
      };
    }
  },

  // Get session history (last 30 days by default)
  async getSessionHistory(from, to) {
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      
      const response = await api.get('/admin/reports/sessions', { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch session history',
      };
    }
  },

  // Open new session
  async openSession() {
    try {
      const response = await api.post('/sessions/open');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to open session',
      };
    }
  },

  // Close current session
  async closeSession() {
    try {
      const response = await api.post('/sessions/close');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to close session',
      };
    }
  },
};
