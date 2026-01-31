import { api } from '../config/api';

// Floor endpoints
export const floorService = {
  // Get all floors
  getAll: async (includeInactive = true) => {
    const response = await api.get(`/admin/floors?includeInactive=${includeInactive}`);
    return response.data.data;
  },

  // Get floor by ID
  getById: async (id) => {
    const response = await api.get(`/admin/floors/${id}`);
    return response.data.data;
  },

  // Create floor
  create: async (data) => {
    const response = await api.post('/admin/floors', data);
    return response.data.data;
  },

  // Update floor
  update: async (id, data) => {
    const response = await api.put(`/admin/floors/${id}`, data);
    return response.data.data;
  },

  // Delete floor
  delete: async (id) => {
    const response = await api.delete(`/admin/floors/${id}`);
    return response.data.data;
  }
};

// Table endpoints
export const tableService = {
  // Get tables by floor
  getByFloor: async (floorId, includeInactive = true) => {
    const response = await api.get(`/admin/floors/${floorId}/tables?includeInactive=${includeInactive}`);
    return response.data.data;
  },

  // Get table by ID
  getById: async (id) => {
    const response = await api.get(`/admin/tables/${id}`);
    return response.data.data;
  },

  // Create table
  create: async (floorId, data) => {
    const response = await api.post(`/admin/floors/${floorId}/tables`, data);
    return response.data.data;
  },

  // Update table
  update: async (id, data) => {
    const response = await api.put(`/admin/tables/${id}`, data);
    return response.data.data;
  },

  // Delete table
  delete: async (id) => {
    const response = await api.delete(`/admin/tables/${id}`);
    return response.data.data;
  }
};
