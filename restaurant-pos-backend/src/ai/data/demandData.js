const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get product demand (quantity sold) by day
 * @param {Date} from - Start date
 * @param {Date} to - End date
 * @param {string} productId - Optional product filter
 * @param {string} categoryId - Optional category filter
 * @returns {Promise<Array>} Product demand data
 */
async function getProductDemandDaily(from, to, productId = null, categoryId = null) {
  let whereClause = `
    WHERE o."createdAt" >= $1
      AND o."createdAt" < $2
      AND o.status = 'paid'
  `;
  const params = [from, to];

  if (productId) {
    params.push(productId);
    whereClause += ` AND ol."productId" = $${params.length}`;
  }

  if (categoryId) {
    params.push(categoryId);
    whereClause += ` AND p."categoryId" = $${params.length}`;
  }

  const result = await prisma.$queryRawUnsafe(`
    SELECT 
      DATE_TRUNC('day', o."createdAt") AS date,
      ol."productId" AS product_id,
      p."categoryId" AS category_id,
      p.name AS product_name,
      SUM(ol.qty) AS total_qty,
      SUM(ol.price * ol.qty) AS total_revenue
    FROM "OrderLine" ol
    JOIN "Order" o ON o.id = ol."orderId"
    JOIN "Product" p ON p.id = ol."productId"
    ${whereClause}
    GROUP BY 
      DATE_TRUNC('day', o."createdAt"),
      ol."productId",
      p."categoryId",
      p.name
    ORDER BY date ASC, total_qty DESC
  `, ...params);

  return result.map(row => ({
    date: row.date,
    productId: row.product_id,
    categoryId: row.category_id,
    productName: row.product_name,
    totalQty: parseInt(row.total_qty) || 0,
    totalRevenue: parseFloat(row.total_revenue) || 0
  }));
}

/**
 * Get category-level demand aggregates
 * @param {Date} from - Start date
 * @param {Date} to - End date
 * @returns {Promise<Array>} Category demand data
 */
async function getCategoryDemandDaily(from, to) {
  const result = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('day', o."createdAt") AS date,
      p."categoryId" AS category_id,
      pc.name AS category_name,
      SUM(ol.qty) AS total_qty,
      SUM(ol.price * ol.qty) AS total_revenue,
      COUNT(DISTINCT ol."productId") AS unique_products
    FROM "OrderLine" ol
    JOIN "Order" o ON o.id = ol."orderId"
    JOIN "Product" p ON p.id = ol."productId"
    JOIN "ProductCategory" pc ON pc.id = p."categoryId"
    WHERE o."createdAt" >= ${from}
      AND o."createdAt" < ${to}
      AND o.status = 'paid'
    GROUP BY 
      DATE_TRUNC('day', o."createdAt"),
      p."categoryId",
      pc.name
    ORDER BY date ASC, total_qty DESC
  `;

  return result.map(row => ({
    date: row.date,
    categoryId: row.category_id,
    categoryName: row.category_name,
    totalQty: parseInt(row.total_qty) || 0,
    totalRevenue: parseFloat(row.total_revenue) || 0,
    uniqueProducts: parseInt(row.unique_products) || 0
  }));
}

/**
 * Get product demand baseline for forecasting
 * @param {string} productId - Product ID
 * @param {number} lookbackDays - Days to look back
 * @returns {Promise<Object>} Baseline statistics
 */
async function getProductBaseline(productId, lookbackDays = 28) {
  const from = new Date();
  from.setDate(from.getDate() - lookbackDays);

  const result = await prisma.$queryRaw`
    SELECT 
      AVG(daily.total_qty) AS mean_qty,
      STDDEV(daily.total_qty) AS stddev_qty,
      MIN(daily.total_qty) AS min_qty,
      MAX(daily.total_qty) AS max_qty,
      COUNT(*) AS sample_count
    FROM (
      SELECT 
        DATE_TRUNC('day', o."createdAt") AS date,
        SUM(ol.qty) AS total_qty
      FROM "OrderLine" ol
      JOIN "Order" o ON o.id = ol."orderId"
      WHERE o."createdAt" >= ${from}
        AND ol."productId" = ${productId}
        AND o.status = 'paid'
      GROUP BY DATE_TRUNC('day', o."createdAt")
    ) daily
  `;

  const row = result[0] || {};
  return {
    meanQty: parseFloat(row.mean_qty) || 0,
    stddevQty: parseFloat(row.stddev_qty) || 0,
    minQty: parseInt(row.min_qty) || 0,
    maxQty: parseInt(row.max_qty) || 0,
    sampleCount: parseInt(row.sample_count) || 0
  };
}

/**
 * Get all active products for batch forecasting
 * @returns {Promise<Array>} List of active products
 */
async function getActiveProducts() {
  return prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      categoryId: true,
      price: true
    }
  });
}

/**
 * Get top N products by sales volume
 * @param {number} limit - Number of products
 * @param {number} lookbackDays - Days to consider
 * @returns {Promise<Array>} Top products
 */
async function getTopProducts(limit = 20, lookbackDays = 30) {
  const from = new Date();
  from.setDate(from.getDate() - lookbackDays);

  const result = await prisma.$queryRaw`
    SELECT 
      ol."productId" AS product_id,
      p.name AS product_name,
      p."categoryId" AS category_id,
      SUM(ol.qty) AS total_qty,
      SUM(ol.price * ol.qty) AS total_revenue
    FROM "OrderLine" ol
    JOIN "Order" o ON o.id = ol."orderId"
    JOIN "Product" p ON p.id = ol."productId"
    WHERE o."createdAt" >= ${from}
      AND o.status = 'paid'
      AND p."isActive" = true
    GROUP BY ol."productId", p.name, p."categoryId"
    ORDER BY total_qty DESC
    LIMIT ${limit}
  `;

  return result.map(row => ({
    productId: row.product_id,
    productName: row.product_name,
    categoryId: row.category_id,
    totalQty: parseInt(row.total_qty) || 0,
    totalRevenue: parseFloat(row.total_revenue) || 0
  }));
}

module.exports = {
  getProductDemandDaily,
  getCategoryDemandDaily,
  getProductBaseline,
  getActiveProducts,
  getTopProducts
};