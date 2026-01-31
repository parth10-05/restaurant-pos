import { orderService } from '../services/order.service.js';

export const orderController = {
  async createOrder(req, res, next) {
    try {
      const { tableId } = req.body;
      const userId = req.user.userId;
      const sessionId = req.session.id;

      if (!tableId) {
        return res.status(400).json({
          success: false,
          message: 'tableId is required',
        });
      }

      const order = await orderService.createOrder({
        sessionId,
        userId,
        tableId,
      });

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async getOrder(req, res, next) {
    try {
      const { id } = req.params;

      const order = await orderService.getOrderById(id);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async addOrderLine(req, res, next) {
    try {
      const { id } = req.params;
      const { productId, qty } = req.body;

      if (!productId || !qty) {
        return res.status(400).json({
          success: false,
          message: 'productId and qty are required',
        });
      }

      const order = await orderService.addOrderLine({
        orderId: id,
        productId,
        qty: parseInt(qty),
      });

      res.status(200).json({
        success: true,
        message: 'Item added to order',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateOrderLineQuantity(req, res, next) {
    try {
      const { id, lineId } = req.params;
      const { qty } = req.body;

      if (qty === undefined) {
        return res.status(400).json({
          success: false,
          message: 'qty is required',
        });
      }

      const order = await orderService.updateOrderLineQuantity({
        orderId: id,
        lineId: parseInt(lineId),
        qty: parseInt(qty),
      });

      res.status(200).json({
        success: true,
        message: qty === 0 ? 'Item removed from order' : 'Item quantity updated',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async sendToKitchen(req, res, next) {
    try {
      const { id } = req.params;

      const order = await orderService.sendToKitchen(id);

      res.status(200).json({
        success: true,
        message: 'Order sent to kitchen',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async completeOrder(req, res, next) {
    try {
      const { id } = req.params;

      const order = await orderService.completeOrder(id);

      res.status(200).json({
        success: true,
        message: 'Order completed',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async payOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { method } = req.body;

      if (!method) {
        return res.status(400).json({
          success: false,
          message: 'Payment method is required (cash, digital, or upi)',
        });
      }

      const order = await orderService.payOrder({
        orderId: id,
        method,
      });

      res.status(200).json({
        success: true,
        message: 'Payment successful',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async getSessionOrders(req, res, next) {
    try {
      const sessionId = req.session.id;

      const orders = await orderService.getOrdersBySession(sessionId);

      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  },
};