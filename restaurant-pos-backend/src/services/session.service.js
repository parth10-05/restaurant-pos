import prisma from '../prisma/client.js';

export const sessionService = {
  async getOpenSession() {
    return await prisma.pOS_Session.findFirst({
      where: { status: 'open' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  },

  async openSession(userId) {
    // Check if an open session already exists
    const existingSession = await this.getOpenSession();

    if (existingSession) {
      const error = new Error('A session is already open. Close it before opening a new one.');
      error.statusCode = 400;
      throw error;
    }

    // Create new session
    const session = await prisma.pOS_Session.create({
      data: {
        status: 'open',
        openedBy: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return session;
  },

  async closeSession(userId) {
    // Get current open session
    const openSession = await this.getOpenSession();

    if (!openSession) {
      const error = new Error('No open session found to close.');
      error.statusCode = 400;
      throw error;
    }

    // Calculate total sales from paid orders in this session
    const paidOrders = await prisma.order.findMany({
      where: {
        sessionId: openSession.id,
        status: 'paid',
      },
      include: {
        payment: true,
      },
    });

    const totalSales = paidOrders.reduce((sum, order) => {
      return sum + (order.payment?.amount || 0);
    }, 0);

    const ordersCount = paidOrders.length;

    // Update session to closed
    const closedSession = await prisma.pOS_Session.update({
      where: { id: openSession.id },
      data: {
        status: 'closed',
        closedAt: new Date(),
        closingTotal: totalSales,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return {
      session: closedSession,
      summary: {
        ordersCount,
        totalSales,
      },
    };
  },

  async getCurrentSession() {
    const session = await this.getOpenSession();
    return session || null;
  },

  async requireOpenSession() {
    const session = await this.getOpenSession();

    if (!session) {
      const error = new Error('No open POS session. Open a session before creating orders or payments.');
      error.statusCode = 403;
      throw error;
    }

    return session;
  },
};