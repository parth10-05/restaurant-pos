import { api } from '../config/api';

/**
 * Order Service
 * Handles order-related API calls for cashier operations
 */

/**
 * Create a new order for a table
 */
export const createOrder = async (tableId) => {
  try {
    const response = await api.post('/orders', { tableId });
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create order',
    };
  }
};

/**
 * Add a product line item to an order
 */
export const addOrderLine = async (orderId, productId, qty) => {
  try {
    const response = await api.post(`/orders/${orderId}/lines`, { 
      productId, 
      qty 
    });
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Error adding order line:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to add item to order',
    };
  }
};

/**
 * Update quantity of an order line item
 */
export const updateOrderLineQuantity = async (orderId, lineId, qty) => {
  try {
    const response = await api.patch(`/orders/${orderId}/lines/${lineId}`, { qty });
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Error updating order line quantity:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update item quantity',
    };
  }
};

/**
 * Get all orders for the current session
 * Requires an open session
 */
export const getSessionOrders = async () => {
  try {
    const response = await api.get('/orders');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error fetching session orders:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch orders',
    };
  }
};

/**
 * Get a single order by ID
 */
export const getOrderById = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch order',
    };
  }
};

/**
 * Send order to kitchen
 */
export const sendToKitchen = async (orderId) => {
  try {
    const response = await api.patch(`/orders/${orderId}/send`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Error sending to kitchen:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to send order to kitchen',
    };
  }
};

/**
 * Complete order (ready for payment)
 */
export const completeOrder = async (orderId) => {
  try {
    const response = await api.patch(`/orders/${orderId}/complete`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Error completing order:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to complete order',
    };
  }
};

/**
 * Get active order for a table
 */
export const getActiveOrderForTable = async (tableId) => {
  try {
    const response = await api.get(`/cashier/tables/${tableId}/active-order`);
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Error fetching active order:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch active order',
    };
  }
};

/**
 * Pay for an order
 */
export const payOrder = async (orderId, method) => {
  try {
    const response = await api.post(`/orders/${orderId}/pay`, { method });
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to process payment',
    };
  }
};

export const orderService = {
  createOrder,
  addOrderLine,
  updateOrderLineQuantity,
  getSessionOrders,
  getOrderById,
  sendToKitchen,
  completeOrder,
  getActiveOrderForTable,
  payOrder,
};
