import prisma from '../prisma/client.js';
import { kitchenService } from './kitchen.service.js';
import { emitNewOrder } from '../socket/kitchen.socket.js';

// Valid order states
const ORDER_STATUS = {
  DRAFT: 'draft',
  SENT_TO_KITCHEN: 'sent_to_kitchen',
  COMPLETED: 'completed',
  PAID: 'paid',
};

// Valid payment methods
const PAYMENT_METHODS = ['cash', 'digital', 'upi'];

export const orderService = {
  async createOrder({ sessionId, userId, tableId }) {
    // Verify table exists
    const table = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      const error = new Error('Table not found');
      error.statusCode = 404;
      throw error;
    }

    // Create order with draft status
    const order = await prisma.order.create({
      data: {
        sessionId,
        userId,
        tableId,
        status: ORDER_STATUS.DRAFT,
        total: 0,
      },
      include: {
        table: true,
        orderLines: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return order;
  },

  async getOrderById(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: {
          include: {
            floor: true,
          },
        },
        orderLines: true,
        payment: true,
        kitchenTicket: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    return order;
  },

  async addOrderLine({ orderId, productId, qty }) {
    // Get order and verify status
    const order = await this.getOrderById(orderId);

    // Allow adding items to draft, sent_to_kitchen, or completed orders
    // (completed allows corrections before payment)
    if (order.status === ORDER_STATUS.PAID) {
      const error = new Error(
        'Cannot add items to paid order.'
      );
      error.statusCode = 400;
      throw error;
    }

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    if (qty <= 0) {
      const error = new Error('Quantity must be greater than 0');
      error.statusCode = 400;
      throw error;
    }

    // Check if product already exists in order (and not sent yet)
    const existingLine = await prisma.orderLine.findFirst({
      where: {
        orderId,
        productId,
        sentToKitchen: false,
      },
    });

    let orderLine;

    if (existingLine) {
      // Update existing unsent line quantity
      orderLine = await prisma.orderLine.update({
        where: { id: existingLine.id },
        data: {
          qty: existingLine.qty + qty,
        },
      });
    } else {
      // Create new order line (not sent yet)
      orderLine = await prisma.orderLine.create({
        data: {
          orderId,
          productId,
          name: product.name,
          price: product.price,
          qty,
          sentToKitchen: false,
        },
      });
    }

    // Recalculate order total
    const allLines = await prisma.orderLine.findMany({
      where: { orderId },
    });

    const newTotal = allLines.reduce((sum, line) => {
      return sum + line.price * line.qty;
    }, 0);

    // Update order total
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { total: newTotal },
      include: {
        table: true,
        orderLines: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return updatedOrder;
  },

  async sendToKitchen(orderId) {
    // Get order and verify status
    const order = await this.getOrderById(orderId);

    // Allow sending from draft, sent_to_kitchen (incremental), or completed status
    if (order.status === ORDER_STATUS.PAID) {
      const error = new Error(
        'Cannot send paid order to kitchen.'
      );
      error.statusCode = 400;
      throw error;
    }

    // Get only unsent order lines
    const unsentLines = order.orderLines.filter(line => !line.sentToKitchen);

    if (unsentLines.length === 0) {
      const error = new Error('No new items to send to kitchen.');
      error.statusCode = 400;
      throw error;
    }

    // Mark unsent lines as sent
    await prisma.orderLine.updateMany({
      where: {
        orderId,
        sentToKitchen: false,
      },
      data: {
        sentToKitchen: true,
      },
    });

    // Update order status to sent_to_kitchen if it was draft
    let updatedOrder;
    if (order.status === ORDER_STATUS.DRAFT) {
      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: ORDER_STATUS.SENT_TO_KITCHEN },
        include: {
          table: true,
          orderLines: true,
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });
    } else {
      // Just reload the order with updated lines
      updatedOrder = await this.getOrderById(orderId);
    }

    // Create or update kitchen ticket with new items
    let ticket = await prisma.kitchenTicket.findUnique({
      where: { orderId },
    });

    if (!ticket) {
      ticket = await kitchenService.createTicket(orderId);
    }

    // Emit to kitchen via WebSocket (only new items)
    emitNewOrder({
      ...ticket,
      newItems: unsentLines,
    });

    return updatedOrder;
  },

  async completeOrder(orderId) {
    // Get order and verify status
    const order = await this.getOrderById(orderId);

    if (order.status === ORDER_STATUS.PAID) {
      const error = new Error('Order is already paid.');
      error.statusCode = 400;
      throw error;
    }

    if (order.status === ORDER_STATUS.DRAFT) {
      const error = new Error(
        'Cannot complete draft order. Send to kitchen first.'
      );
      error.statusCode = 400;
      throw error;
    }

    // Check if there are unsent items
    const unsentLines = order.orderLines.filter(line => !line.sentToKitchen);
    if (unsentLines.length > 0) {
      const error = new Error(
        'Cannot complete order. There are unsent items. Send them to kitchen first.'
      );
      error.statusCode = 400;
      throw error;
    }

    // Update order status to completed
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: ORDER_STATUS.COMPLETED },
      include: {
        table: true,
        orderLines: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return updatedOrder;
  },

  async payOrder({ orderId, method }) {
    // Validate payment method
    if (!PAYMENT_METHODS.includes(method)) {
      const error = new Error(
        `Invalid payment method. Must be one of: ${PAYMENT_METHODS.join(', ')}`
      );
      error.statusCode = 400;
      throw error;
    }

    // Get order and verify status
    const order = await this.getOrderById(orderId);

    if (order.status === ORDER_STATUS.DRAFT) {
      const error = new Error(
        'Cannot pay for draft order. Send order to kitchen first.'
      );
      error.statusCode = 400;
      throw error;
    }

    if (order.status === ORDER_STATUS.SENT_TO_KITCHEN) {
      const error = new Error(
        'Cannot pay for order. Complete the order first before payment.'
      );
      error.statusCode = 400;
      throw error;
    }

    if (order.status === ORDER_STATUS.PAID) {
      const error = new Error('Order is already paid.');
      error.statusCode = 400;
      throw error;
    }

    if (order.status !== ORDER_STATUS.COMPLETED) {
      const error = new Error(
        `Cannot pay for order. Order status is "${order.status}". Only completed orders can be paid.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Check if payment already exists
    if (order.payment) {
      const error = new Error('Payment already exists for this order.');
      error.statusCode = 400;
      throw error;
    }

    // Create payment and update order status in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          orderId,
          amount: order.total,
          method,
        },
      });

      // Update order status to paid
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: ORDER_STATUS.PAID },
        include: {
          table: true,
          orderLines: true,
          payment: true,
          kitchenTicket: true,
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return updatedOrder;
    });

    return result;
  },

  async getOrdersBySession(sessionId) {
    const orders = await prisma.order.findMany({
      where: { sessionId },
      include: {
        table: {
          include: {
            floor: true,
          },
        },
        orderLines: true,
        payment: true,
        kitchenTicket: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  },
};