const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get daily sales aggregates from paid orders
 * @param {Date} from - Start date
 * @param {Date} to - End date
 * @returns {Promise<Array>} Daily sales data
 */
async function getDailySales(from, to) {
  const result = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('day', p."createdAt") AS date,
      SUM(p.amount) AS revenue,
      COUNT(DISTINCT o.id) AS order_count,
      AVG(p.amount) AS avg_ticket
    FROM "Payment" p
    JOIN "Order" o ON o.id = p."orderId"
    WHERE p."createdAt" >= ${from}
      AND p."createdAt" < ${to}
      AND o.status = 'paid'
    GROUP BY DATE_TRUNC('day', p."createdAt")
    ORDER BY date ASC
  `;

  return result.map(row => ({
    date: row.date,
    revenue: parseFloat(row.revenue) || 0,
    orderCount: parseInt(row.order_count) || 0,
    avgTicket: parseFloat(row.avg_ticket) || 0
  }));
}

/**
 * Get hourly sales aggregates
 * @param {Date} from - Start date
 * @param {Date} to - End date
 * @returns {Promise<Array>} Hourly sales data
 */
async function getHourlySales(from, to) {
  const result = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('day', p."createdAt") AS date,
      EXTRACT(HOUR FROM p."createdAt") AS hour,
      EXTRACT(DOW FROM p."createdAt") AS day_of_week,
      SUM(p.amount) AS revenue,
      COUNT(DISTINCT o.id) AS order_count
    FROM "Payment" p
    JOIN "Order" o ON o.id = p."orderId"
    WHERE p."createdAt" >= ${from}
      AND p."createdAt" < ${to}
      AND o.status = 'paid'
    GROUP BY 
      DATE_TRUNC('day', p."createdAt"),
      EXTRACT(HOUR FROM p."createdAt"),
      EXTRACT(DOW FROM p."createdAt")
    ORDER BY date ASC, hour ASC
  `;

  return result.map(row => ({
    date: row.date,
    hour: parseInt(row.hour),
    dayOfWeek: parseInt(row.day_of_week),
    revenue: parseFloat(row.revenue) || 0,
    orderCount: parseInt(row.order_count) || 0
  }));
}

/**
 * Get historical baseline for a specific hour and day of week
 * @param {number} hour - Hour (0-23)
 * @param {number} dayOfWeek - Day of week (0-6, Sunday=0)
 * @param {number} lookbackDays - Number of days to look back
 * @returns {Promise<Object>} Baseline statistics
 */
async function getHourlyBaseline(hour, dayOfWeek, lookbackDays = 28) {
  const from = new Date();
  from.setDate(from.getDate() - lookbackDays);

  const result = await prisma.$queryRaw`
    SELECT 
      AVG(daily.revenue) AS mean_revenue,
      STDDEV(daily.revenue) AS stddev_revenue,
      AVG(daily.order_count) AS mean_orders,
      COUNT(*) AS sample_count
    FROM (
      SELECT 
        DATE_TRUNC('day', p."createdAt") AS date,
        SUM(p.amount) AS revenue,
        COUNT(DISTINCT o.id) AS order_count
      FROM "Payment" p
      JOIN "Order" o ON o.id = p."orderId"
      WHERE p."createdAt" >= ${from}
        AND EXTRACT(HOUR FROM p."createdAt") = ${hour}
        AND EXTRACT(DOW FROM p."createdAt") = ${dayOfWeek}
        AND o.status = 'paid'
      GROUP BY DATE_TRUNC('day', p."createdAt")
    ) daily
  `;

  const row = result[0] || {};
  return {
    meanRevenue: parseFloat(row.mean_revenue) || 0,
    stddevRevenue: parseFloat(row.stddev_revenue) || 0,
    meanOrders: parseFloat(row.mean_orders) || 0,
    sampleCount: parseInt(row.sample_count) || 0
  };
}

/**
 * Get daily baseline statistics
 * @param {number} dayOfWeek - Day of week (0-6)
 * @param {number} lookbackDays - Days to look back
 * @returns {Promise<Object>} Baseline statistics
 */
async function getDailyBaseline(dayOfWeek, lookbackDays = 56) {
  const from = new Date();
  from.setDate(from.getDate() - lookbackDays);

  const result = await prisma.$queryRaw`
    SELECT 
      AVG(daily.revenue) AS mean_revenue,
      STDDEV(daily.revenue) AS stddev_revenue,
      AVG(daily.order_count) AS mean_orders,
      STDDEV(daily.order_count) AS stddev_orders,
      COUNT(*) AS sample_count
    FROM (
      SELECT 
        DATE_TRUNC('day', p."createdAt") AS date,
        SUM(p.amount) AS revenue,
        COUNT(DISTINCT o.id) AS order_count
      FROM "Payment" p
      JOIN "Order" o ON o.id = p."orderId"
      WHERE p."createdAt" >= ${from}
        AND EXTRACT(DOW FROM p."createdAt") = ${dayOfWeek}
        AND o.status = 'paid'
      GROUP BY DATE_TRUNC('day', p."createdAt")
    ) daily
  `;

  const row = result[0] || {};
  return {
    meanRevenue: parseFloat(row.mean_revenue) || 0,
    stddevRevenue: parseFloat(row.stddev_revenue) || 0,
    meanOrders: parseFloat(row.mean_orders) || 0,
    stddevOrders: parseFloat(row.stddev_orders) || 0,
    sampleCount: parseInt(row.sample_count) || 0
  };
}

module.exports = {
  getDailySales,
  getHourlySales,
  getHourlyBaseline,
  getDailyBaseline
};