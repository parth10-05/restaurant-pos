import prisma from '../prisma/client.js';

/**
 * Report Service
 * 
 * REPORTING PRINCIPLES:
 * - Only PAID orders count toward revenue
 * - Payment records are source of truth for financial data
 * - All metrics derived from actual database records
 * - No frontend calculations
 * - Efficient aggregations using Prisma
 * 
 * ORDER STATUS RULES:
 * - 'draft' = order in progress, not counted
 * - 'paid' = completed order, counted in all reports
 * - Other statuses (cancelled, etc.) excluded from revenue
 */

export const reportService = {
  /**
   * Parse and validate date range
   */
  parseDateRange(from, to) {
    const fromDate = from ? new Date(from) : new Date(0); // Unix epoch if not specified
    const toDate = to ? new Date(to) : new Date(); // Now if not specified
    
    // Set time to start/end of day
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    return { fromDate, toDate };
  },

  /**
   * Sales Summary Report
   * 
   * Returns:
   * - Total revenue (from payments)
   * - Total orders (paid only)
   * - Average order value
   * - Total tax collected
   */
  async getSalesSummary(from, to) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    // Get all paid orders in date range
    const orders = await prisma.order.findMany({
      where: {
        status: 'paid',
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        payment: true,
        orderLines: true,
      },
    });

    // Calculate metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + (order.payment?.amount || 0);
    }, 0);

    const totalTax = orders.reduce((sum, order) => {
      return sum + order.orderLines.reduce((lineSum, line) => {
        return lineSum + line.taxAmount;
      }, 0);
    }, 0);

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
    };
  },

  /**
   * Revenue by Payment Method
   * 
   * Returns breakdown of revenue by payment method:
   * - cash
   * - digital (card, etc.)
   * - upi
   */
  async getRevenueByPaymentMethod(from, to) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    const payments = await prisma.payment.findMany({
      where: {
        order: {
          status: 'paid',
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
      },
      select: {
        method: true,
        amount: true,
      },
    });

    // Aggregate by method
    const byMethod = payments.reduce((acc, payment) => {
      const method = payment.method.toLowerCase();
      if (!acc[method]) {
        acc[method] = 0;
      }
      acc[method] += payment.amount;
      return acc;
    }, {});

    // Convert to array and ensure all methods present
    const methods = ['cash', 'digital', 'upi'];
    return methods.map(method => ({
      method,
      total: parseFloat((byMethod[method] || 0).toFixed(2)),
    }));
  },

  /**
   * Session-wise Sales Report
   * 
   * Returns revenue and order count per POS session
   */
  async getSessionReport(from, to) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    const sessions = await prisma.pOS_Session.findMany({
      where: {
        openedAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        orders: {
          where: {
            status: 'paid',
          },
          include: {
            payment: true,
          },
        },
      },
      orderBy: {
        openedAt: 'desc',
      },
    });

    return sessions.map(session => {
      const orderCount = session.orders.length;
      const totalRevenue = session.orders.reduce((sum, order) => {
        return sum + (order.payment?.amount || 0);
      }, 0);

      return {
        sessionId: session.id,
        openedAt: session.openedAt,
        closedAt: session.closedAt,
        status: session.status,
        orderCount,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      };
    });
  },

  /**
   * Product Performance Report
   * 
   * Returns:
   * - Product name
   * - Category
   * - Quantity sold
   * - Total revenue generated
   * 
   * Sorted by revenue descending
   */
  async getProductPerformance(from, to) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    // Get all order lines from paid orders
    const orderLines = await prisma.orderLine.findMany({
      where: {
        order: {
          status: 'paid',
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
      },
      select: {
        productId: true,
        name: true,
        price: true,
        qty: true,
        taxAmount: true,
      },
    });

    // Get product details (for category)
    const productIds = [...new Set(orderLines.map(line => line.productId))];
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: {
        category: true,
      },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    // Aggregate by product
    const aggregated = orderLines.reduce((acc, line) => {
      const productId = line.productId;
      
      if (!acc[productId]) {
        const product = productMap.get(productId);
        acc[productId] = {
          productId,
          productName: line.name,
          categoryName: product?.category?.name || 'Unknown',
          quantitySold: 0,
          totalRevenue: 0,
        };
      }

      acc[productId].quantitySold += line.qty;
      acc[productId].totalRevenue += (line.price * line.qty) + line.taxAmount;

      return acc;
    }, {});

    // Convert to array and sort by revenue descending
    const results = Object.values(aggregated).map(item => ({
      ...item,
      totalRevenue: parseFloat(item.totalRevenue.toFixed(2)),
    }));

    results.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return results;
  },

  /**
   * Category Performance Report (Optional)
   * 
   * Returns revenue by category
   */
  async getCategoryPerformance(from, to) {
    const { fromDate, toDate } = this.parseDateRange(from, to);

    const orderLines = await prisma.orderLine.findMany({
      where: {
        order: {
          status: 'paid',
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
      },
      select: {
        productId: true,
        price: true,
        qty: true,
        taxAmount: true,
      },
    });

    const productIds = [...new Set(orderLines.map(line => line.productId))];
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: {
        category: true,
      },
    });

    const productCategoryMap = new Map(
      products.map(p => [p.id, p.category?.name || 'Unknown'])
    );

    const byCategory = orderLines.reduce((acc, line) => {
      const category = productCategoryMap.get(line.productId) || 'Unknown';
      
      if (!acc[category]) {
        acc[category] = 0;
      }

      acc[category] += (line.price * line.qty) + line.taxAmount;
      return acc;
    }, {});

    return Object.entries(byCategory)
      .map(([category, total]) => ({
        category,
        total: parseFloat(total.toFixed(2)),
      }))
      .sort((a, b) => b.total - a.total);
  },
};