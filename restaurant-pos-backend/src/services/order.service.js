import prisma from '../prisma/client.js';
import { kitchenService } from './kitchen.service.js';
import { emitNewOrder, emitNewKitchenItems } from '../socket/kitchen.socket.js';

// Valid order states
const ORDER_STATUS = {
  DRAFT: 'draft',
  SENT_TO_KITCHEN: 'sent_to_kitchen',
  COMPLETED: 'completed',
  PAID: 'paid',
};

/**
 * Decrement ingredient stock based on order lines
 * Creates ledger entries for tracking
 */
async function decrementStockForOrderLines(orderId, orderLines, tx = prisma) {
  // Get all product IDs from order lines
  const productIds = [...new Set(orderLines.map(line => line.productId))];
  
  // Get product ingredients for all products
  const productIngredients = await tx.productIngredient.findMany({
    where: {
      productId: { in: productIds },
    },
    include: {
      ingredient: {
        include: {
          stock: true,
        },
      },
    },
  });
  
  // Build a map of productId -> ingredients
  const productIngredientMap = {};
  for (const pi of productIngredients) {
    if (!productIngredientMap[pi.productId]) {
      productIngredientMap[pi.productId] = [];
    }
    productIngredientMap[pi.productId].push(pi);
  }
  
  // Calculate total consumption per ingredient
  const consumptionMap = {}; // ingredientId -> { total, ingredient }
  
  for (const line of orderLines) {
    const ingredients = productIngredientMap[line.productId] || [];
    
    for (const pi of ingredients) {
      const consumedQty = pi.quantity * line.qty;
      
      if (!consumptionMap[pi.ingredientId]) {
        consumptionMap[pi.ingredientId] = {
          total: 0,
          ingredient: pi.ingredient,
        };
      }
      consumptionMap[pi.ingredientId].total += consumedQty;
    }
  }

  // Validate stock availability
  const insufficientIngredients = [];
  for (const [ingredientId, data] of Object.entries(consumptionMap)) {
    const { total, ingredient } = data;
    const currentStock = ingredient.stock?.quantity || 0;
    
    if (currentStock < total) {
      insufficientIngredients.push(`${ingredient.name} (Required: ${total} ${ingredient.unit}, Available: ${currentStock} ${ingredient.unit})`);
    }
  }

  if (insufficientIngredients.length > 0) {
    const error = new Error(`Insufficient stock: ${insufficientIngredients.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
  
  // Deduct from stock and create ledger entries
  for (const [ingredientId, data] of Object.entries(consumptionMap)) {
    const { total, ingredient } = data;
    const currentStock = ingredient.stock?.quantity || 0;
    const newStock = Math.max(0, currentStock - total); // Don't go below 0
    
    // Update stock
    if (ingredient.stock) {
      await tx.inventoryStock.update({
        where: { id: ingredient.stock.id },
        data: {
          quantity: newStock,
          lastUpdated: new Date(),
        },
      });
    } else {
      // Create stock record if it doesn't exist
      await tx.inventoryStock.create({
        data: {
          ingredientId,
          quantity: newStock,
        },
      });
    }
    
    // Create ledger entry
    await tx.inventoryLedger.create({
      data: {
        ingredientId,
        changeQty: -total, // Negative for consumption
        balanceAfter: newStock,
        source: 'ORDER_CONSUMPTION',
        referenceId: orderId,
        notes: `Order consumption`,
      },
    });
  }
  
  return Object.keys(consumptionMap).length;
}

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
          kitchenStation: product.kitchenStation,
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

  async updateOrderLineQuantity({ orderId, lineId, qty }) {
    // Get order line
    const orderLine = await prisma.orderLine.findUnique({
      where: { id: lineId },
      include: {
        order: true,
      },
    });

    if (!orderLine) {
      const error = new Error('Order line not found');
      error.statusCode = 404;
      throw error;
    }

    if (orderLine.orderId !== orderId) {
      const error = new Error('Order line does not belong to this order');
      error.statusCode = 400;
      throw error;
    }

    // Cannot modify items already sent to kitchen
    if (orderLine.sentToKitchen) {
      const error = new Error('Cannot modify items already sent to kitchen');
      error.statusCode = 400;
      throw error;
    }

    // Validate quantity
    if (qty < 0) {
      const error = new Error('Quantity cannot be negative');
      error.statusCode = 400;
      throw error;
    }

    // If quantity is 0, delete the line
    if (qty === 0) {
      await prisma.orderLine.delete({
        where: { id: lineId },
      });
    } else {
      // Update quantity
      await prisma.orderLine.update({
        where: { id: lineId },
        data: { qty },
      });
    }

    // Recalculate order total
    const allLines = await prisma.orderLine.findMany({
      where: { orderId },
    });

    const newTotal = allLines.reduce((sum, line) => {
      return sum + line.price * line.qty;
    }, 0);

    // Update order total and return full order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { total: newTotal },
      include: {
        table: {
          include: {
            floor: true,
          },
        },
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

    // Transaction: Validate stock, mark sent, update order status
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Decrement Stock (Validates first - throws if insufficient)
      const ingredientsUpdated = await decrementStockForOrderLines(orderId, unsentLines, tx);
      console.log(`[Order ${orderId.slice(-8)}] Decremented stock for ${ingredientsUpdated} ingredients`);

      // 2. Mark unsent lines as sent
      await tx.orderLine.updateMany({
        where: {
          orderId,
          sentToKitchen: false,
        },
        data: {
          sentToKitchen: true,
          kitchenStatus: 'PENDING',
          sentToKitchenAt: new Date(),
        },
      });

      // 3. Update order status
      if (order.status === ORDER_STATUS.DRAFT || order.status === ORDER_STATUS.COMPLETED) {
        return await tx.order.update({
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
        // Just reload the order
        return await tx.order.findUnique({
          where: { id: orderId },
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
      }
    });

    // Get updated order lines with product info for socket emission
    const updatedLines = await prisma.orderLine.findMany({
      where: {
        orderId,
        id: { in: unsentLines.map(l => l.id) },
      },
      include: {
        order: {
          include: {
            table: { include: { floor: true } },
          },
        },
      },
    });

    // Emit new items to kitchen via WebSocket
    const itemsToEmit = updatedLines.map(line => ({
      orderId: line.orderId,
      orderNumber: line.orderId.slice(-8).toUpperCase(),
      tableNumber: line.order.table.number,
      floorName: line.order.table.floor.name,
      itemId: line.id,
      productId: line.productId,
      productName: line.name,
      quantity: line.qty,
      kitchenStatus: line.kitchenStatus,
      kitchenStation: line.kitchenStation || 'GENERAL',
      sentToKitchenAt: line.sentToKitchenAt,
    }));

    emitNewKitchenItems(itemsToEmit);

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

    // Check if all sent items are ready
    const notReadyItems = order.orderLines.filter(
      line => line.sentToKitchen && line.kitchenStatus !== 'READY'
    );
    if (notReadyItems.length > 0) {
      const error = new Error(
        `Cannot complete order. ${notReadyItems.length} item(s) are still being prepared in the kitchen. Wait for kitchen to finish.`
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

  /**
   * Get all orders across sessions that need attention
   * Returns: unpaid orders (for payment) + paid orders (for receipts)
   * Excludes only draft orders
   */
  async getAllUnpaidOrders() {
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: [ORDER_STATUS.SENT_TO_KITCHEN, ORDER_STATUS.COMPLETED, ORDER_STATUS.PAID],
        },
      },
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