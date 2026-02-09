import prisma from '../../prisma/client.js';

/**
 * Get product demand aggregated by day.
 */
export async function getProductDemandByDay(fromDate, toDate, productId = null) {
  let result;
  
  if (productId) {
    result = await prisma.$queryRaw`
      SELECT 
        DATE(o."createdAt") as sale_date,
        ol."productId" as product_id,
        p."categoryId" as category_id,
        SUM(ol.qty) as total_qty,
        SUM(ol.qty * ol.price) as revenue
      FROM "OrderLine" ol
      INNER JOIN "Order" o ON o.id = ol."orderId"
      INNER JOIN "Product" p ON p.id = ol."productId"
      INNER JOIN "Payment" pay ON pay."orderId" = o.id
      WHERE o."createdAt" >= ${fromDate}
        AND o."createdAt" < ${toDate}
        AND o.status = 'paid'
        AND ol."productId" = ${productId}
      GROUP BY DATE(o."createdAt"), ol."productId", p."categoryId"
      ORDER BY sale_date ASC, product_id ASC
    `;
  } else {
    result = await prisma.$queryRaw`
      SELECT 
        DATE(o."createdAt") as sale_date,
        ol."productId" as product_id,
        p."categoryId" as category_id,
        SUM(ol qty) as total_qty,
        SUM(ol qty * ol.price) as revenue
      FROM "OrderLine" ol
      INNER JOIN "Order" o ON o.id = ol."orderId"
      INNER JOIN "Product" p ON p.id = ol."productId"
      INNER JOIN "Payment" pay ON pay."orderId" = o.id
      WHERE o."createdAt" >= ${fromDate}
        AND o."createdAt" < ${toDate}
        AND o.status = 'paid'
      GROUP BY DATE(o."createdAt"), ol."productId", p."categoryId"
      ORDER BY sale_date ASC, product_id ASC
    `;
  }

  return result.map(row => ({
    date: row.sale_date,
    productId: row.product_id,
    categoryId: row.category_id,
    quantity: Number(row.total_qty),
    revenue: Number(row.revenue)
  }));
}

/**
 * Get top products by quantity sold.
 */
export async function getTopProductsByDemand(fromDate, toDate, limit = 20) {
  const result = await prisma.$queryRaw`
    SELECT 
      ol."productId" as product_id,
      p.name as product_name,
      p."categoryId" as category_id,
      SUM(ol qty) as total_qty,
      COUNT(DISTINCT DATE(o."createdAt")) as active_days
    FROM "OrderLine" ol
    INNER JOIN "Order" o ON o.id = ol."orderId"
    INNER JOIN "Product" p ON p.id = ol."productId"
    INNER JOIN "Payment" pay ON pay."orderId" = o.id
    WHERE o."createdAt" >= ${fromDate}
      AND o."createdAt" < ${toDate}
      AND o.status = 'paid'
    GROUP BY ol."productId", p.name, p."categoryId"
    ORDER BY total_qty DESC
    LIMIT ${limit}
  `;

  return result.map(row => ({
    productId: row.product_id,
    productName: row.product_name,
    categoryId: row.category_id,
    totalQuantity: Number(row.total_qty),
    activeDays: Number(row.active_days)
  }));
}