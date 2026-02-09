import prisma from '../../prisma/client.js';

/**
 * Get historical statistics for sales by day.
 */
export async function getDailySalesBaseline(fromDate, toDate) {
  const result = await prisma.$queryRaw`
    WITH daily_sales AS (
      SELECT 
        DATE(o."createdAt") as sale_date,
        EXTRACT(DOW FROM o."createdAt")::int as day_of_week,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(p.amount), 0) as revenue
      FROM "Order" o
      INNER JOIN "Payment" p ON p."orderId" = o.id
      WHERE o."createdAt" >= ${fromDate}
        AND o."createdAt" < ${toDate}
        AND o.status = 'paid'
      GROUP BY DATE(o."createdAt"), EXTRACT(DOW FROM o."createdAt")
    )
    SELECT 
      day_of_week,
      AVG(revenue) as mean_revenue,
      STDDEV(revenue) as stddev_revenue,
      AVG(order_count) as mean_orders,
      STDDEV(order_count) as stddev_orders,
      COUNT(*) as sample_count
    FROM daily_sales
    GROUP BY day_of_week
    ORDER BY day_of_week
  `;

  return result.map(row => ({
    dayOfWeek: row.day_of_week,
    meanRevenue: Number(row.mean_revenue) || 0,
    stddevRevenue: Number(row.stddev_revenue) || 0,
    meanOrders: Number(row.mean_orders) || 0,
    stddevOrders: Number(row.stddev_orders) || 0,
    sampleCount: Number(row.sample_count)
  }));
}

/**
 * Get historical statistics for sales by hour.
 */
export async function getHourlySalesBaseline(fromDate, toDate) {
  const result = await prisma.$queryRaw`
    WITH hourly_sales AS (
      SELECT 
        DATE(o."createdAt") as sale_date,
        EXTRACT(DOW FROM o."createdAt")::int as day_of_week,
        EXTRACT(HOUR FROM o."createdAt")::int as sale_hour,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(p.amount), 0) as revenue
      FROM "Order" o
      INNER JOIN "Payment" p ON p."orderId" = o.id
      WHERE o."createdAt" >= ${fromDate}
        AND o."createdAt" < ${toDate}
        AND o.status = 'paid'
      GROUP BY DATE(o."createdAt"), EXTRACT(DOW FROM o."createdAt"), EXTRACT(HOUR FROM o."createdAt")
    )
    SELECT 
      day_of_week,
      sale_hour,
      AVG(revenue) as mean_revenue,
      STDDEV(revenue) as stddev_revenue,
      AVG(order_count) as mean_orders,
      STDDEV(order_count) as stddev_orders,
      COUNT(*) as sample_count
    FROM hourly_sales
    GROUP BY day_of_week, sale_hour
    ORDER BY day_of_week, sale_hour
  `;

  return result.map(row => ({
    dayOfWeek: row.day_of_week,
    hour: row.sale_hour,
    meanRevenue: Number(row.mean_revenue) || 0,
    stddevRevenue: Number(row.stddev_revenue) || 0,
    meanOrders: Number(row.mean_orders) || 0,
    stddevOrders: Number(row.stddev_orders) || 0,
    sampleCount: Number(row.sample_count)
  }));
}

/**
 * Get product-level baseline statistics.
 */
export async function getProductDemandBaseline(fromDate, toDate, productId = null) {
  let result;
  
  if (productId) {
    result = await prisma.$queryRaw`
      WITH daily_demand AS (
        SELECT 
          DATE(o."createdAt") as sale_date,
          ol."productId" as product_id,
          SUM(ol.qty) as daily_qty
        FROM "OrderLine" ol
        INNER JOIN "Order" o ON o.id = ol."orderId"
        INNER JOIN "Payment" pay ON pay."orderId" = o.id
        WHERE o."createdAt" >= ${fromDate}
          AND o."createdAt" < ${toDate}
          AND o.status = 'paid'
          AND ol."productId" = ${productId}
        GROUP BY DATE(o."createdAt"), ol."productId"
      )
      SELECT 
        product_id,
        AVG(daily_qty) as mean_qty,
        STDDEV(daily_qty) as stddev_qty,
        COUNT(*) as sample_count
      FROM daily_demand
      GROUP BY product_id
    `;
  } else {
    result = await prisma.$queryRaw`
      WITH daily_demand AS (
        SELECT 
          DATE(o."createdAt") as sale_date,
          ol."productId" as product_id,
          SUM(ol.qty) as daily_qty
        FROM "OrderLine" ol
        INNER JOIN "Order" o ON o.id = ol."orderId"
        INNER JOIN "Payment" pay ON pay."orderId" = o.id
        WHERE o."createdAt" >= ${fromDate}
          AND o."createdAt" < ${toDate}
          AND o.status = 'paid'
        GROUP BY DATE(o."createdAt"), ol."productId"
      )
      SELECT 
        product_id,
        AVG(daily_qty) as mean_qty,
        STDDEV(daily_qty) as stddev_qty,
        COUNT(*) as sample_count
      FROM daily_demand
      GROUP BY product_id
    `;
  }

  return result.map(row => ({
    productId: row.product_id,
    meanQty: Number(row.mean_qty) || 0,
    stddevQty: Number(row.stddev_qty) || 0,
    sampleCount: Number(row.sample_count)
  }));
}