import { api } from '../config/api';

/**
 * Kitchen service for managing kitchen orders and item status
 */
const kitchenService = {
  /**
   * Get all kitchen orders with item-level tracking
   * @param {string} station - Filter by kitchen station (optional)
   * @returns {Promise<Array>} List of kitchen orders
   */
  async getKitchenOrders(station = 'ALL') {
    const response = await api.get('/kitchen/orders', {
      params: { station }
    });
    return response.data.data;
  },

  /**
   * Update kitchen item status
   * @param {number} itemId - Order line item ID
   * @param {string} status - New status (PENDING, PREPARING, READY)
   * @returns {Promise<Object>} Updated item
   */
  async updateItemStatus(itemId, status) {
    const response = await api.put(`/kitchen/items/${itemId}/status`, { status });
    return response.data.data;
  },

  // ─── STOCK MANAGEMENT ────────────────────────────────────────────────

  /**
   * Get all ingredient stock levels
   * @returns {Promise<Array>} List of ingredients with stock info
   */
  async getStock() {
    const response = await api.get('/kitchen/stock');
    return response.data.data;
  },

  /**
   * Get low stock alerts
   * @returns {Promise<Array>} List of ingredients below minimum stock
   */
  async getLowStockAlerts() {
    const response = await api.get('/kitchen/stock/alerts');
    return response.data;
  },

  /**
   * Update ingredient stock to specific value
   * @param {string} ingredientId - Ingredient UUID
   * @param {number} quantity - New stock quantity
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Updated stock info
   */
  async updateStock(ingredientId, quantity, notes = '') {
    const response = await api.put(`/kitchen/stock/${ingredientId}`, { quantity, notes });
    return response.data.data;
  },

  /**
   * Add stock to an ingredient
   * @param {string} ingredientId - Ingredient UUID
   * @param {number} quantity - Quantity to add
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Updated stock info
   */
  async addStock(ingredientId, quantity, notes = '') {
    const response = await api.post(`/kitchen/stock/${ingredientId}/add`, { quantity, notes });
    return response.data.data;
  },

  /**
   * Get stock history for an ingredient
   * @param {string} ingredientId - Ingredient UUID
   * @param {number} limit - Number of entries to fetch
   * @returns {Promise<Array>} List of ledger entries
   */
  async getStockHistory(ingredientId, limit = 20) {
    const response = await api.get(`/kitchen/stock/${ingredientId}/history`, {
      params: { limit }
    });
    return response.data.data;
  },
};

export default kitchenService;
