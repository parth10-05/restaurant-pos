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
};

export default kitchenService;
