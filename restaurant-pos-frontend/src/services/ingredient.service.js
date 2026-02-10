import { api } from '../config/api';

export const ingredientService = {
  // Get all ingredients
  async getAll(filters = {}) {
    try {
      const params = {};
      if (filters.search) {
        params.search = filters.search;
      }
      
      const response = await api.get('/admin/ingredients', { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch ingredients',
      };
    }
  },

  // Search ingredients by name
  async search(query) {
    try {
      const response = await api.get('/admin/ingredients/search', {
        params: { q: query },
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to search ingredients',
      };
    }
  },

  // Get single ingredient
  async getById(id) {
    try {
      const response = await api.get(`/admin/ingredients/${id}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch ingredient',
      };
    }
  },

  // Create ingredient
  async create(data) {
    try {
      const response = await api.post('/admin/ingredients', data);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create ingredient',
      };
    }
  },

  // Update ingredient
  async update(id, data) {
    try {
      const response = await api.put(`/admin/ingredients/${id}`, data);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update ingredient',
      };
    }
  },

  // Delete ingredient
  async delete(id) {
    try {
      const response = await api.delete(`/admin/ingredients/${id}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete ingredient',
      };
    }
  },
};
