import prisma from '../../prisma/client.js';

/**
 * Get daily sales aggregates within a date range.
 */
export async function getSalesByDay(fromDate, toDate) {
  const result = await prisma.$queryRaw`
    SELECT 
      DATE(o."createdAt") as sale_date,
      COUNT(DISTINCT o.id) as order_count,
      COALESCE(SUM(p.amount), 0) as revenue
    FROM "Order" o
    INNER JOIN "Payment" p ON p."orderId" = o.id
    WHERE o."createdAt" >= ${fromDate}
      AND o."createdAt" < ${toDate}
      AND o.status = 'paid'
    GROUP BY DATE(o."createdAt")
    ORDER BY sale_date ASC
  `;

  return result.map(row => ({
    date: row.sale_date,
    orders: Number(row.order_count),
    revenue: Number(row.revenue)
  }));
}

/**
 * Get hourly sales aggregates within a date range.
 */
export async function getSalesByHour(fromDate, toDate) {
  const result = await prisma.$queryRaw`
    SELECT 
      DATE(o."createdAt") as sale_date,
      EXTRACT(HOUR FROM o."createdAt")::int as sale_hour,
      COUNT(DISTINCT o.id) as order_count,
      COALESCE(SUM(p.amount), 0) as revenue
    FROM "Order" o
    INNER JOIN "Payment" p ON p."orderId" = o.id
    WHERE o."createdAt" >= ${fromDate}
      AND o."createdAt" < ${toDate}
      AND o.status = 'paid'
    GROUP BY DATE(o."createdAt"), EXTRACT(HOUR FROM o."createdAt")
    ORDER BY sale_date ASC, sale_hour ASC
  `;

  return result.map(row => ({
    date: row.sale_date,
    hour: row.sale_hour,
    orders: Number(row.order_count),
    revenue: Number(row.revenue)
  }));
}

/**
 * Get sales by day of week for pattern analysis.
 */
export async function getSalesByDayOfWeek(fromDate, toDate) {
  const result = await prisma.$queryRaw`
    SELECT 
      EXTRACT(DOW FROM o."createdAt")::int as day_of_week,
      COUNT(DISTINCT o.id) as order_count,
      COALESCE(SUM(p.amount), 0) as revenue,
      COUNT(DISTINCT DATE(o."createdAt")) as day_count
    FROM "Order" o
    INNER JOIN "Payment" p ON p."orderId" = o.id
    WHERE o."createdAt" >= ${fromDate}
      AND o."createdAt" < ${toDate}
      AND o.status = 'paid'
    GROUP BY EXTRACT(DOW FROM o."createdAt")
    ORDER BY day_of_week ASC
  `;

  return result.map(row => ({
    dayOfWeek: row.day_of_week,
    avgOrders: Number(row.order_count) / Number(row.day_count),
    avgRevenue: Number(row.revenue) / Number(row.day_count),
    totalDays: Number(row.day_count)
  }));
}