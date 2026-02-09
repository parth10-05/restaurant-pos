import prisma from '../prisma/client.js';

/**
 * Analytics Service for AI/ML consumption
 * Provides aggregated, ML-friendly data exports
 */

/**
 * Get daily ingredient consumption from completed orders
 * @param {Object} options
 * @param {Date} options.startDate - Start date (inclusive)
 * @param {Date} options.endDate - End date (inclusive)
 * @returns {Promise<Array>} Daily consumption records
 */
export async function getDailyIngredientConsumption({ startDate, endDate }) {
  // Use InventoryLedger with ORDER_CONSUMPTION source for accurate consumption tracking
  const results = await prisma.$queryRaw`
    SELECT 
      DATE(il."createdAt") as date,
      il."ingredientId" as ingredient_id,
      i.name as ingredient_name,
      i.unit as unit,
      ABS(SUM(il."changeQty")) as total_consumed,
      COUNT(DISTINCT il."referenceId") as order_count
    FROM "InventoryLedger" il
    JOIN "Ingredient" i ON i.id = il."ingredientId"
    WHERE il.source = 'ORDER_CONSUMPTION'
      AND il."createdAt" >= ${startDate}
      AND il."createdAt" < ${endDate}
    GROUP BY DATE(il."createdAt"), il."ingredientId", i.name, i.unit
    ORDER BY DATE(il."createdAt") DESC, total_consumed DESC
  `;

  // Transform to ML-friendly format
  return results.map(row => ({
    date: row.date.toISOString().split('T')[0],
    ingredientId: row.ingredient_id,
    ingredientName: row.ingredient_name,
    unit: row.unit,
    totalConsumed: parseFloat(row.total_consumed),
    orderCount: parseInt(row.order_count)
  }));
}

/**
 * Get daily waste per ingredient
 * @param {Object} options
 * @param {Date} options.startDate - Start date (inclusive)
 * @param {Date} options.endDate - End date (inclusive)
 * @returns {Promise<Array>} Daily waste records
 */
export async function getDailyWasteByIngredient({ startDate, endDate }) {
  const results = await prisma.$queryRaw`
    SELECT 
      DATE(w."createdAt") as date,
      w."ingredientId" as ingredient_id,
      i.name as ingredient_name,
      i.unit as unit,
      w.reason as reason,
      w.station as station,
      SUM(w.quantity) as total_wasted,
      COUNT(*) as event_count,
      AVG(w.quantity) as avg_per_event
    FROM "WasteEvent" w
    JOIN "Ingredient" i ON i.id = w."ingredientId"
    WHERE w."createdAt" >= ${startDate}
      AND w."createdAt" < ${endDate}
    GROUP BY DATE(w."createdAt"), w."ingredientId", i.name, i.unit, w.reason, w.station
    ORDER BY DATE(w."createdAt") DESC, total_wasted DESC
  `;

  return results.map(row => ({
    date: row.date.toISOString().split('T')[0],
    ingredientId: row.ingredient_id,
    ingredientName: row.ingredient_name,
    unit: row.unit,
    reason: row.reason,
    station: row.station,
    totalWasted: parseFloat(row.total_wasted),
    eventCount: parseInt(row.event_count),
    avgPerEvent: parseFloat(row.avg_per_event)
  }));
}

/**
 * Get aggregated waste summary by ingredient (totals across date range)
 * @param {Object} options
 * @param {Date} options.startDate - Start date (inclusive)
 * @param {Date} options.endDate - End date (inclusive)
 * @returns {Promise<Array>} Waste summary records
 */
export async function getWasteSummaryByIngredient({ startDate, endDate }) {
  const results = await prisma.$queryRaw`
    SELECT 
      w."ingredientId" as ingredient_id,
      i.name as ingredient_name,
      i.unit as unit,
      i."costPerUnit" as cost_per_unit,
      SUM(w.quantity) as total_wasted,
      SUM(w.quantity * i."costPerUnit") as total_cost_lost,
      COUNT(*) as event_count,
      COUNT(DISTINCT DATE(w."createdAt")) as days_with_waste
    FROM "WasteEvent" w
    JOIN "Ingredient" i ON i.id = w."ingredientId"
    WHERE w."createdAt" >= ${startDate}
      AND w."createdAt" < ${endDate}
    GROUP BY w."ingredientId", i.name, i.unit, i."costPerUnit"
    ORDER BY total_cost_lost DESC
  `;

  return results.map(row => ({
    ingredientId: row.ingredient_id,
    ingredientName: row.ingredient_name,
    unit: row.unit,
    costPerUnit: parseFloat(row.cost_per_unit),
    totalWasted: parseFloat(row.total_wasted),
    totalCostLost: parseFloat(row.total_cost_lost),
    eventCount: parseInt(row.event_count),
    daysWithWaste: parseInt(row.days_with_waste)
  }));
}

/**
 * Get hourly sales volume per product (time-series data)
 * @param {Object} options
 * @param {Date} options.startDate - Start date (inclusive)
 * @param {Date} options.endDate - End date (inclusive)
 * @returns {Promise<Array>} Hourly sales records
 */
export async function getHourlySalesTimeseries({ startDate, endDate }) {
  const results = await prisma.$queryRaw`
    SELECT 
      DATE(o."createdAt") as date,
      EXTRACT(HOUR FROM o."createdAt")::int as hour,
      ol."productId" as product_id,
      ol.name as product_name,
      ol."kitchenStation" as station,
      SUM(ol.qty) as total_qty,
      SUM(ol.price * ol.qty) as gross_revenue,
      SUM(ol."taxAmount") as total_tax,
      COUNT(DISTINCT o.id) as order_count
    FROM "Order" o
    JOIN "OrderLine" ol ON ol."orderId" = o.id
    JOIN "Payment" p ON p."orderId" = o.id
    WHERE o."createdAt" >= ${startDate}
      AND o."createdAt" < ${endDate}
      AND o.status = 'paid'
    GROUP BY DATE(o."createdAt"), EXTRACT(HOUR FROM o."createdAt"), 
             ol."productId", ol.name, ol."kitchenStation"
    ORDER BY date DESC, hour ASC, total_qty DESC
  `;

  return results.map(row => ({
    date: row.date.toISOString().split('T')[0],
    hour: parseInt(row.hour),
    productId: row.product_id,
    productName: row.product_name,
    station: row.station,
    totalQty: parseInt(row.total_qty),
    grossRevenue: parseFloat(row.gross_revenue),
    totalTax: parseFloat(row.total_tax),
    orderCount: parseInt(row.order_count)
  }));
}

/**
 * Get aggregated hourly sales pattern (avg across all days)
 * @param {Object} options
 * @param {Date} options.startDate - Start date (inclusive)
 * @param {Date} options.endDate - End date (inclusive)
 * @returns {Promise<Array>} Hourly pattern data
 */
export async function getHourlySalesPattern({ startDate, endDate }) {
  const results = await prisma.$queryRaw`
    WITH hourly_totals AS (
      SELECT 
        DATE(o."createdAt") as date,
        EXTRACT(HOUR FROM o."createdAt")::int as hour,
        SUM(o.total) as revenue,
        COUNT(o.id) as orders
      FROM "Order" o
      JOIN "Payment" p ON p."orderId" = o.id
      WHERE o."createdAt" >= ${startDate}
        AND o."createdAt" < ${endDate}
        AND o.status = 'paid'
      GROUP BY DATE(o."createdAt"), EXTRACT(HOUR FROM o."createdAt")
    )
    SELECT 
      hour,
      AVG(revenue) as avg_revenue,
      AVG(orders) as avg_orders,
      STDDEV(revenue) as stddev_revenue,
      MIN(revenue) as min_revenue,
      MAX(revenue) as max_revenue,
      COUNT(*) as sample_days
    FROM hourly_totals
    GROUP BY hour
    ORDER BY hour
  `;

  return results.map(row => ({
    hour: parseInt(row.hour),
    avgRevenue: parseFloat(row.avg_revenue || 0),
    avgOrders: parseFloat(row.avg_orders || 0),
    stddevRevenue: parseFloat(row.stddev_revenue || 0),
    minRevenue: parseFloat(row.min_revenue || 0),
    maxRevenue: parseFloat(row.max_revenue || 0),
    sampleDays: parseInt(row.sample_days)
  }));
}

/**
 * Get prep time statistics per kitchen station
 * @param {Object} options
 * @param {Date} options.startDate - Start date (inclusive)
 * @param {Date} options.endDate - End date (inclusive)
 * @returns {Promise<Array>} Prep time data per station
 */
export async function getPrepTimeByStation({ startDate, endDate }) {
  const results = await prisma.$queryRaw`
    SELECT 
      ol."kitchenStation" as station,
      DATE(ol."sentToKitchenAt") as date,
      EXTRACT(HOUR FROM ol."sentToKitchenAt")::int as hour,
      COUNT(*) as items_prepared,
      AVG(EXTRACT(EPOCH FROM (ol."preparedAt" - ol."sentToKitchenAt"))) as avg_prep_seconds,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (ol."preparedAt" - ol."sentToKitchenAt"))) as median_prep_seconds,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (ol."preparedAt" - ol."sentToKitchenAt"))) as p95_prep_seconds,
      MIN(EXTRACT(EPOCH FROM (ol."preparedAt" - ol."sentToKitchenAt"))) as min_prep_seconds,
      MAX(EXTRACT(EPOCH FROM (ol."preparedAt" - ol."sentToKitchenAt"))) as max_prep_seconds
    FROM "OrderLine" ol
    WHERE ol."sentToKitchenAt" IS NOT NULL
      AND ol."preparedAt" IS NOT NULL
      AND ol."sentToKitchenAt" >= ${startDate}
      AND ol."sentToKitchenAt" < ${endDate}
    GROUP BY ol."kitchenStation", DATE(ol."sentToKitchenAt"), EXTRACT(HOUR FROM ol."sentToKitchenAt")
    ORDER BY date DESC, hour ASC, station
  `;

  return results.map(row => ({
    station: row.station,
    date: row.date.toISOString().split('T')[0],
    hour: parseInt(row.hour),
    itemsPrepared: parseInt(row.items_prepared),
    avgPrepSeconds: parseFloat(row.avg_prep_seconds || 0),
    medianPrepSeconds: parseFloat(row.median_prep_seconds || 0),
    p95PrepSeconds: parseFloat(row.p95_prep_seconds || 0),
    minPrepSeconds: parseFloat(row.min_prep_seconds || 0),
    maxPrepSeconds: parseFloat(row.max_prep_seconds || 0)
  }));
}

/**
 * Get aggregated prep time by station (overall stats)
 * @param {Object} options
 * @param {Date} options.startDate - Start date (inclusive)
 * @param {Date} options.endDate - End date (inclusive)
 * @returns {Promise<Array>} Aggregated prep time stats
 */
export async function getPrepTimeStats({ startDate, endDate }) {
  const results = await prisma.$queryRaw`
    SELECT 
      ol."kitchenStation" as station,
      COUNT(*) as total_items,
      AVG(EXTRACT(EPOCH FROM (ol."preparedAt" - ol."sentToKitchenAt"))) as avg_prep_seconds,
      STDDEV(EXTRACT(EPOCH FROM (ol."preparedAt" - ol."sentToKitchenAt"))) as stddev_prep_seconds,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (ol."preparedAt" - ol."sentToKitchenAt"))) as median_prep_seconds,
      PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (ol."preparedAt" - ol."sentToKitchenAt"))) as p90_prep_seconds,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (ol."preparedAt" - ol."sentToKitchenAt"))) as p95_prep_seconds,
      PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (ol."preparedAt" - ol."sentToKitchenAt"))) as p99_prep_seconds
    FROM "OrderLine" ol
    WHERE ol."sentToKitchenAt" IS NOT NULL
      AND ol."preparedAt" IS NOT NULL
      AND ol."sentToKitchenAt" >= ${startDate}
      AND ol."sentToKitchenAt" < ${endDate}
    GROUP BY ol."kitchenStation"
    ORDER BY station
  `;

  return results.map(row => ({
    station: row.station,
    totalItems: parseInt(row.total_items),
    avgPrepSeconds: parseFloat(row.avg_prep_seconds || 0),
    stddevPrepSeconds: parseFloat(row.stddev_prep_seconds || 0),
    medianPrepSeconds: parseFloat(row.median_prep_seconds || 0),
    p90PrepSeconds: parseFloat(row.p90_prep_seconds || 0),
    p95PrepSeconds: parseFloat(row.p95_prep_seconds || 0),
    p99PrepSeconds: parseFloat(row.p99_prep_seconds || 0)
  }));
}

/**
 * Get product-level prep time stats
 * @param {Object} options
 * @param {Date} options.startDate - Start date (inclusive)
 * @param {Date} options.endDate - End date (inclusive)
 * @returns {Promise<Array>} Product prep time data
 */
export async function getPrepTimeByProduct({ startDate, endDate }) {
  const results = await prisma.$queryRaw`
    SELECT 
      ol."productId" as product_id,
      ol.name as product_name,
      ol."kitchenStation" as station,
      COUNT(*) as total_prepared,
      AVG(EXTRACT(EPOCH FROM (ol."preparedAt" - ol."sentToKitchenAt"))) as avg_prep_seconds,
      STDDEV(EXTRACT(EPOCH FROM (ol."preparedAt" - ol."sentToKitchenAt"))) as stddev_prep_seconds,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (ol."preparedAt" - ol."sentToKitchenAt"))) as median_prep_seconds
    FROM "OrderLine" ol
    WHERE ol."sentToKitchenAt" IS NOT NULL
      AND ol."preparedAt" IS NOT NULL
      AND ol."sentToKitchenAt" >= ${startDate}
      AND ol."sentToKitchenAt" < ${endDate}
    GROUP BY ol."productId", ol.name, ol."kitchenStation"
    ORDER BY total_prepared DESC
  `;

  return results.map(row => ({
    productId: row.product_id,
    productName: row.product_name,
    station: row.station,
    totalPrepared: parseInt(row.total_prepared),
    avgPrepSeconds: parseFloat(row.avg_prep_seconds || 0),
    stddevPrepSeconds: parseFloat(row.stddev_prep_seconds || 0),
    medianPrepSeconds: parseFloat(row.median_prep_seconds || 0)
  }));
}

/**
 * Get daily sales summary for ML training
 * @param {Object} options
 * @param {Date} options.startDate - Start date (inclusive)
 * @param {Date} options.endDate - End date (inclusive)
 * @returns {Promise<Array>} Daily sales summary
 */
export async function getDailySalesSummary({ startDate, endDate }) {
  const results = await prisma.$queryRaw`
    SELECT 
      DATE(o."createdAt") as date,
      EXTRACT(DOW FROM o."createdAt")::int as day_of_week,
      COUNT(DISTINCT o.id) as total_orders,
      SUM(o.total) as total_revenue,
      AVG(o.total) as avg_order_value,
      SUM((SELECT SUM(ol.qty) FROM "OrderLine" ol WHERE ol."orderId" = o.id)) as total_items_sold,
      COUNT(DISTINCT o."tableId") as unique_tables
    FROM "Order" o
    JOIN "Payment" p ON p."orderId" = o.id
    WHERE o."createdAt" >= ${startDate}
      AND o."createdAt" < ${endDate}
      AND o.status = 'paid'
    GROUP BY DATE(o."createdAt"), EXTRACT(DOW FROM o."createdAt")
    ORDER BY date DESC
  `;

  return results.map(row => ({
    date: row.date.toISOString().split('T')[0],
    dayOfWeek: parseInt(row.day_of_week), // 0=Sunday, 6=Saturday
    totalOrders: parseInt(row.total_orders),
    totalRevenue: parseFloat(row.total_revenue || 0),
    avgOrderValue: parseFloat(row.avg_order_value || 0),
    totalItemsSold: parseInt(row.total_items_sold || 0),
    uniqueTables: parseInt(row.unique_tables)
  }));
}

/**
 * Build comprehensive analytics export for AI training
 * @param {Object} options
 * @param {Date} options.startDate - Start date (inclusive)
 * @param {Date} options.endDate - End date (inclusive)
 * @returns {Promise<Object>} Full analytics package
 */
export async function getFullAnalyticsExport({ startDate, endDate }) {
  const [
    consumption,
    waste,
    wasteSummary,
    salesTimeseries,
    salesPattern,
    prepTimeByStation,
    prepTimeStats,
    prepTimeByProduct,
    dailySales
  ] = await Promise.all([
    getDailyIngredientConsumption({ startDate, endDate }),
    getDailyWasteByIngredient({ startDate, endDate }),
    getWasteSummaryByIngredient({ startDate, endDate }),
    getHourlySalesTimeseries({ startDate, endDate }),
    getHourlySalesPattern({ startDate, endDate }),
    getPrepTimeByStation({ startDate, endDate }),
    getPrepTimeStats({ startDate, endDate }),
    getPrepTimeByProduct({ startDate, endDate }),
    getDailySalesSummary({ startDate, endDate })
  ]);

  return {
    metadata: {
      exportedAt: new Date().toISOString(),
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      recordCounts: {
        consumptionRecords: consumption.length,
        wasteRecords: waste.length,
        salesTimeseriesRecords: salesTimeseries.length,
        prepTimeRecords: prepTimeByStation.length,
        dailySalesRecords: dailySales.length
      }
    },
    data: {
      ingredientConsumption: consumption,
      ingredientWaste: waste,
      wasteSummary,
      hourlyProductSales: salesTimeseries,
      hourlySalesPattern: salesPattern,
      prepTimeTimeseries: prepTimeByStation,
      prepTimeStats,
      prepTimeByProduct,
      dailySalesSummary: dailySales
    }
  };
}

export default {
  getDailyIngredientConsumption,
  getDailyWasteByIngredient,
  getWasteSummaryByIngredient,
  getHourlySalesTimeseries,
  getHourlySalesPattern,
  getPrepTimeByStation,
  getPrepTimeStats,
  getPrepTimeByProduct,
  getDailySalesSummary,
  getFullAnalyticsExport
};
