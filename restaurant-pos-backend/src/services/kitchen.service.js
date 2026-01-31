import prisma from '../prisma/client.js';

// Valid kitchen item states
const KITCHEN_STATUS = {
  PENDING: 'PENDING',
  PREPARING: 'PREPARING',
  READY: 'READY',
};

// Valid order statuses for kitchen display
const ORDER_STATUS = {
  SENT_TO_KITCHEN: 'sent_to_kitchen',
  COMPLETED: 'completed',
};

// State transition map for kitchen items
const NEXT_STATUS = {
  [KITCHEN_STATUS.PENDING]: KITCHEN_STATUS.PREPARING,
  [KITCHEN_STATUS.PREPARING]: KITCHEN_STATUS.READY,
  [KITCHEN_STATUS.READY]: null, // Final state
};

export const kitchenService = {
  /**
   * Get all orders with items sent to kitchen
   * Excludes paid orders
   * Includes incremental items
   * @param {string} station - Optional station filter (GRILL, FRYER, DRINKS, DESSERT, GENERAL, or ALL)
   */
  async getKitchenOrders(station = 'ALL') {
    // Get orders that are sent_to_kitchen or completed (not paid)
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: [ORDER_STATUS.SENT_TO_KITCHEN, ORDER_STATUS.COMPLETED],
        },
        orderLines: {
          some: {
            sentToKitchen: true,
          },
        },
      },
      include: {
        table: {
          include: {
            floor: true,
          },
        },
        orderLines: {
          where: {
            sentToKitchen: true,
          },
          orderBy: {
            sentToKitchenAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Transform to kitchen-friendly format
    const kitchenOrders = orders.map(order => {
      // Map items with kitchen station from OrderLine directly
      const itemsWithStation = order.orderLines.map(line => ({
        id: line.id,
        productId: line.productId,
        productName: line.name,
        quantity: line.qty,
        kitchenStatus: line.kitchenStatus || KITCHEN_STATUS.PENDING,
        kitchenStation: line.kitchenStation || 'GENERAL',
        sentToKitchenAt: line.sentToKitchenAt,
        preparedAt: line.preparedAt,
      }));

      // Filter by station if specified
      const filteredItems = station === 'ALL' 
        ? itemsWithStation 
        : itemsWithStation.filter(item => item.kitchenStation === station);

      // Skip orders with no items for this station
      if (filteredItems.length === 0) {
        return null;
      }

      const allReady = filteredItems.every(
        line => line.kitchenStatus === KITCHEN_STATUS.READY
      );

      return {
        orderId: order.id,
        orderNumber: order.id.slice(-8).toUpperCase(),
        tableNumber: order.table.number,
        floorName: order.table.floor.name,
        status: order.status,
        createdAt: order.createdAt,
        isReadyToServe: allReady,
        items: filteredItems,
      };
    }).filter(order => order !== null); // Remove null orders

    return kitchenOrders;
  },

  /**
   * Update kitchen item status
   * Enforces sequential status transitions
   */
  async updateItemStatus(itemId, newStatus) {
    // Validate status
    if (!Object.values(KITCHEN_STATUS).includes(newStatus)) {
      const error = new Error(
        `Invalid kitchen status. Must be one of: ${Object.values(KITCHEN_STATUS).join(', ')}`
      );
      error.statusCode = 400;
      throw error;
    }

    // Get current item
    const item = await prisma.orderLine.findUnique({
      where: { id: itemId },
      include: {
        order: {
          include: {
            table: {
              include: {
                floor: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      const error = new Error('Order item not found');
      error.statusCode = 404;
      throw error;
    }

    if (!item.sentToKitchen) {
      const error = new Error('Item has not been sent to kitchen');
      error.statusCode = 400;
      throw error;
    }

    const currentStatus = item.kitchenStatus || KITCHEN_STATUS.PENDING;

    // Check if transition is valid
    if (currentStatus === KITCHEN_STATUS.READY) {
      const error = new Error('Item is already ready. Cannot change status.');
      error.statusCode = 400;
      throw error;
    }

    const expectedNextStatus = NEXT_STATUS[currentStatus];

    if (newStatus !== expectedNextStatus) {
      const error = new Error(
        `Invalid status transition. Current status: ${currentStatus}. Expected next status: ${expectedNextStatus}`
      );
      error.statusCode = 400;
      throw error;
    }

    // Update item status
    const updateData = {
      kitchenStatus: newStatus,
    };

    // Set preparedAt timestamp when status becomes READY
    if (newStatus === KITCHEN_STATUS.READY) {
      updateData.preparedAt = new Date();
    }

    const updatedItem = await prisma.orderLine.update({
      where: { id: itemId },
      data: updateData,
      include: {
        order: {
          include: {
            table: {
              include: {
                floor: true,
              },
            },
          },
        },
      },
    });

    return {
      id: updatedItem.id,
      productName: updatedItem.name,
      quantity: updatedItem.qty,
      kitchenStatus: updatedItem.kitchenStatus,
      sentToKitchenAt: updatedItem.sentToKitchenAt,
      preparedAt: updatedItem.preparedAt,
      order: {
        id: updatedItem.order.id,
        tableNumber: updatedItem.order.table.number,
        floorName: updatedItem.order.table.floor.name,
      },
    };
  },

  // Legacy methods kept for backward compatibility
  async createTicket(orderId) {
    const existingTicket = await prisma.kitchenTicket.findUnique({
      where: { orderId },
    });

    if (existingTicket) {
      const error = new Error('Kitchen ticket already exists for this order');
      error.statusCode = 400;
      throw error;
    }

    const ticket = await prisma.kitchenTicket.create({
      data: {
        orderId,
        status: 'to_cook',
      },
      include: {
        order: {
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
        },
      },
    });

    return ticket;
  },

  async getActiveTickets() {
    const tickets = await prisma.kitchenTicket.findMany({
      where: {
        status: {
          not: 'completed',
        },
      },
      include: {
        order: {
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
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return tickets;
  },

  async getTicketById(ticketId) {
    const ticket = await prisma.kitchenTicket.findUnique({
      where: { id: ticketId },
      include: {
        order: {
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
        },
      },
    });

    if (!ticket) {
      const error = new Error('Kitchen ticket not found');
      error.statusCode = 404;
      throw error;
    }

    return ticket;
  },

  async moveToNextStatus(ticketId) {
    const ticket = await this.getTicketById(ticketId);

    const TICKET_STATUS = {
      TO_COOK: 'to_cook',
      PREPARING: 'preparing',
      COMPLETED: 'completed',
    };

    const TICKET_NEXT_STATUS = {
      [TICKET_STATUS.TO_COOK]: TICKET_STATUS.PREPARING,
      [TICKET_STATUS.PREPARING]: TICKET_STATUS.COMPLETED,
      [TICKET_STATUS.COMPLETED]: null,
    };

    const nextStatus = TICKET_NEXT_STATUS[ticket.status];

    if (nextStatus === null) {
      const error = new Error(
        `Cannot move ticket forward. Status "${ticket.status}" is final.`
      );
      error.statusCode = 400;
      throw error;
    }

    if (nextStatus === undefined) {
      const error = new Error(`Invalid ticket status: "${ticket.status}"`);
      error.statusCode = 400;
      throw error;
    }

    const updatedTicket = await prisma.kitchenTicket.update({
      where: { id: ticketId },
      data: {
        status: nextStatus,
      },
      include: {
        order: {
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
        },
      },
    });

    return updatedTicket;
  },

  async getCompletedTickets() {
    const tickets = await prisma.kitchenTicket.findMany({
      where: {
        status: 'completed',
      },
      include: {
        order: {
          include: {
            table: true,
            orderLines: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 20,
    });

    return tickets;
  },
};
