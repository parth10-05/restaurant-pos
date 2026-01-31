import prisma from '../prisma/client.js';

// Valid kitchen ticket states
const TICKET_STATUS = {
  TO_COOK: 'to_cook',
  PREPARING: 'preparing',
  COMPLETED: 'completed',
};

// State transition map
const NEXT_STATUS = {
  [TICKET_STATUS.TO_COOK]: TICKET_STATUS.PREPARING,
  [TICKET_STATUS.PREPARING]: TICKET_STATUS.COMPLETED,
  [TICKET_STATUS.COMPLETED]: null, // Final state
};

export const kitchenService = {
  async createTicket(orderId) {
    // Check if ticket already exists for this order
    const existingTicket = await prisma.kitchenTicket.findUnique({
      where: { orderId },
    });

    if (existingTicket) {
      const error = new Error('Kitchen ticket already exists for this order');
      error.statusCode = 400;
      throw error;
    }

    // Create kitchen ticket
    const ticket = await prisma.kitchenTicket.create({
      data: {
        orderId,
        status: TICKET_STATUS.TO_COOK,
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
          not: TICKET_STATUS.COMPLETED,
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
    // Get current ticket
    const ticket = await this.getTicketById(ticketId);

    // Check if transition is valid
    const nextStatus = NEXT_STATUS[ticket.status];

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

    // Update ticket status
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
        status: TICKET_STATUS.COMPLETED,
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
      take: 20, // Last 20 completed
    });

    return tickets;
  },
};