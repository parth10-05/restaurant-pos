import { api } from '../config/api';

export const categoryService = {
  // Get all categories with product counts
  async getAll(includeInactive = false) {
    try {
      const params = includeInactive ? { includeInactive: 'true' } : {};
      const response = await api.get('/admin/categories', { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch categories',
      };
    }
  },

  // Get single category
  async getById(id) {
    try {
      const response = await api.get(`/admin/categories/${id}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch category',
      };
    }
  },

  // Create category
  async create(data) {
    try {
      const response = await api.post('/admin/categories', data);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create category',
      };
    }
  },

  // Update category
  async update(id, data) {
    try {
      const response = await api.put(`/admin/categories/${id}`, data);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update category',
      };
    }
  },

  // Delete category (soft delete)
  async delete(id) {
    try {
      const response = await api.delete(`/admin/categories/${id}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete category',
      };
    }
  },
};

export const productService = {
  // Get all products with optional filters
  async getAll(filters = {}) {
    try {
      const params = {};
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.isActive !== undefined) params.isActive = filters.isActive;
      if (filters.search) params.search = filters.search;

      const response = await api.get('/admin/products', { params });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch products',
      };
    }
  },

  // Get single product
  async getById(id) {
    try {
      const response = await api.get(`/admin/products/${id}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch product',
      };
    }
  },

  // Create product
  async create(data) {
    try {
      const response = await api.post('/admin/products', data);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create product',
      };
    }
  },

  // Update product
  async update(id, data) {
    try {
      const response = await api.put(`/admin/products/${id}`, data);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update product',
      };
    }
  },

  // Delete product
  async delete(id) {
    try {
      const response = await api.delete(`/admin/products/${id}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete product',
      };
    }
  },
};
