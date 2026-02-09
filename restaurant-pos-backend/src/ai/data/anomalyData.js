const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get recent sales for anomaly comparison
 * @param {number} recentDays - Days to get recent data
 * @param {number} baselineDays - Days for baseline calculation
 * @returns {Promise<Object>} Recent and baseline data
 */
async function getSalesAnomalyData(recentDays = 1, baselineDays = 28) {
  const now = new Date();
  const recentFrom = new Date(now);
  recentFrom.setDate(recentFrom.getDate() - recentDays);
  
  const baselineFrom = new Date(now);
  baselineFrom.setDate(baselineFrom.getDate() - baselineDays);

  // Get recent daily sales
  const recentSales = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('day', p."createdAt") AS date,
      SUM(p.amount) AS revenue,
      COUNT(DISTINCT o.id) AS order_count
    FROM "Payment" p
    JOIN "Order" o ON o.id = p."orderId"
    WHERE p."createdAt" >= ${recentFrom}
      AND o.status = 'paid'
    GROUP BY DATE_TRUNC('day', p."createdAt")
  `;

  // Get baseline statistics
  const baselineStats = await prisma.$queryRaw`
    SELECT 
      AVG(daily.revenue) AS mean_revenue,
      STDDEV(daily.revenue) AS stddev_revenue,
      AVG(daily.order_count) AS mean_orders,
      STDDEV(daily.order_count) AS stddev_orders
    FROM (
      SELECT 
        DATE_TRUNC('day', p."createdAt") AS date,
        SUM(p.amount) AS revenue,
        COUNT(DISTINCT o.id) AS order_count
      FROM "Payment" p
      JOIN "Order" o ON o.id = p."orderId"
      WHERE p."createdAt" >= ${baselineFrom}
        AND p."createdAt" < ${recentFrom}
        AND o.status = 'paid'
      GROUP BY DATE_TRUNC('day', p."createdAt")
    ) daily
  `;

  return {
    recent: recentSales.map(row => ({
      date: row.date,
      revenue: parseFloat(row.revenue) || 0,
      orderCount: parseInt(row.order_count) || 0
    })),
    baseline: {
      meanRevenue: parseFloat(baselineStats[0]?.mean_revenue) || 0,
      stddevRevenue: parseFloat(baselineStats[0]?.stddev_revenue) || 1,
      meanOrders: parseFloat(baselineStats[0]?.mean_orders) || 0,
      stddevOrders: parseFloat(baselineStats[0]?.stddev_orders) || 1
    }
  };
}

/**
 * Get hourly anomaly data for a specific date
 * @param {Date} targetDate - Date to analyze
 * @param {number} baselineWeeks - Weeks to use for baseline
 * @returns {Promise<Object>} Hourly data with baselines
 */
async function getHourlyAnomalyData(targetDate, baselineWeeks = 4) {
  const dayOfWeek = targetDate.getDay();
  const baselineFrom = new Date(targetDate);
  baselineFrom.setDate(baselineFrom.getDate() - (baselineWeeks * 7));

  // Get target date hourly sales
  const targetSales = await prisma.$queryRaw`
    SELECT 
      EXTRACT(HOUR FROM p."createdAt") AS hour,
      SUM(p.amount) AS revenue,
      COUNT(DISTINCT o.id) AS order_count
    FROM "Payment" p
    JOIN "Order" o ON o.id = p."orderId"
    WHERE DATE_TRUNC('day', p."createdAt") = DATE_TRUNC('day', ${targetDate}::timestamp)
      AND o.status = 'paid'
    GROUP BY EXTRACT(HOUR FROM p."createdAt")
  `;

  // Get baseline for same day of week
  const baselineData = await prisma.$queryRaw`
    SELECT 
      EXTRACT(HOUR FROM p."createdAt") AS hour,
      AVG(hourly.revenue) AS mean_revenue,
      STDDEV(hourly.revenue) AS stddev_revenue,
      AVG(hourly.order_count) AS mean_orders
    FROM (
      SELECT 
        p."createdAt",
        SUM(p.amount) AS revenue,
        COUNT(DISTINCT o.id) AS order_count
      FROM "Payment" p
      JOIN "Order" o ON o.id = p."orderId"
      WHERE p."createdAt" >= ${baselineFrom}
        AND p."createdAt" < ${targetDate}
        AND EXTRACT(DOW FROM p."createdAt") = ${dayOfWeek}
        AND o.status = 'paid'
      GROUP BY p."createdAt"
    ) hourly
    GROUP BY EXTRACT(HOUR FROM hourly."createdAt")
  `;

  const baselineMap = new Map();
  baselineData.forEach(row => {
    baselineMap.set(parseInt(row.hour), {
      meanRevenue: parseFloat(row.mean_revenue) || 0,
      stddevRevenue: parseFloat(row.stddev_revenue) || 1,
      meanOrders: parseFloat(row.mean_orders) || 0
    });
  });

  return {
    targetDate,
    dayOfWeek,
    hourly: targetSales.map(row => ({
      hour: parseInt(row.hour),
      revenue: parseFloat(row.revenue) || 0,
      orderCount: parseInt(row.order_count) || 0,
      baseline: baselineMap.get(parseInt(row.hour)) || {
        meanRevenue: 0,
        stddevRevenue: 1,
        meanOrders: 0
      }
    }))
  };
}

/**
 * Get product-level anomaly data
 * @param {string} productId - Product ID
 * @param {Date} targetDate - Date to analyze
 * @param {number} baselineDays - Days for baseline
 * @returns {Promise<Object>} Product anomaly data
 */
async function getProductAnomalyData(productId, targetDate, baselineDays = 28) {
  const baselineFrom = new Date(targetDate);
  baselineFrom.setDate(baselineFrom.getDate() - baselineDays);

  // Get target date sales
  const targetSales = await prisma.$queryRaw`
    SELECT 
      SUM(ol.qty) AS total_qty,
      SUM(ol.price * ol.qty) AS total_revenue
    FROM "OrderLine" ol
    JOIN "Order" o ON o.id = ol."orderId"
    WHERE DATE_TRUNC('day', o."createdAt") = DATE_TRUNC('day', ${targetDate}::timestamp)
      AND ol."productId" = ${productId}
      AND o.status = 'paid'
  `;

  // Get baseline
  const baseline = await prisma.$queryRaw`
    SELECT 
      AVG(daily.total_qty) AS mean_qty,
      STDDEV(daily.total_qty) AS stddev_qty,
      AVG(daily.total_revenue) AS mean_revenue
    FROM (
      SELECT 
        DATE_TRUNC('day', o."createdAt") AS date,
        SUM(ol.qty) AS total_qty,
        SUM(ol.price * ol.qty) AS total_revenue
      FROM "OrderLine" ol
      JOIN "Order" o ON o.id = ol."orderId"
      WHERE o."createdAt" >= ${baselineFrom}
        AND o."createdAt" < ${targetDate}
        AND ol."productId" = ${productId}
        AND o.status = 'paid'
      GROUP BY DATE_TRUNC('day', o."createdAt")
    ) daily
  `;

  return {
    productId,
    targetDate,
    observed: {
      qty: parseInt(targetSales[0]?.total_qty) || 0,
      revenue: parseFloat(targetSales[0]?.total_revenue) || 0
    },
    baseline: {
      meanQty: parseFloat(baseline[0]?.mean_qty) || 0,
      stddevQty: parseFloat(baseline[0]?.stddev_qty) || 1,
      meanRevenue: parseFloat(baseline[0]?.mean_revenue) || 0
    }
  };
}

module.exports = {
  getSalesAnomalyData,
  getHourlyAnomalyData,
  getProductAnomalyData
};