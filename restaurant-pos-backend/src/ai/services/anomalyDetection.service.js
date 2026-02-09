/**
 * Anomaly Detection Service
 * Identifies unusual patterns in sales and demand data.
 * 
 * Design Choice: Run anomaly detection as a batch job on recent data,
 * comparing against historical baselines. Store results for dashboard display.
 */

import prisma from '../../prisma/client.js';
import * as salesData from '../data/salesData.extractor.js';
import * as anomalyData from '../data/anomalyData.extractor.js';
import * as anomalyModel from '../models/anomaly.model.js';

const CONFIG = {
  BASELINE_DAYS: 30,
  DETECTION_WINDOW_DAYS: 7,
  Z_SCORE_THRESHOLD: 2.0,
  HOURLY_Z_THRESHOLD: 2.5
};

/**
 * Detect daily sales anomalies.
 * Compares recent days against day-of-week baselines.
 */
async function detectDailySalesAnomalies(options = {}) {
  const {
    fromDate = addDays(new Date(), -CONFIG.DETECTION_WINDOW_DAYS),
    toDate = new Date(),
    threshold = CONFIG.Z_SCORE_THRESHOLD
  } = options;

  // Get baseline statistics
  const baselineEnd = startOfDay(fromDate);
  const baselineStart = addDays(baselineEnd, -CONFIG.BASELINE_DAYS);
  
  const baselines = await anomalyData.getDailySalesBaseline(baselineStart, baselineEnd);
  
  // Get recent sales data
  const recentSales = await salesData.getSalesByDay(fromDate, toDate);

  const anomalies = [];

  for (const sale of recentSales) {
    const saleDate = new Date(sale.date);
    const dayOfWeek = saleDate.getDay();
    
    // Find matching baseline
    const baseline = baselines.find(b => b.dayOfWeek === dayOfWeek);
    
    if (!baseline || baseline.sampleCount < 3) {
      continue; // Skip if insufficient baseline data
    }

    // Check revenue anomaly
    const revenueResult = anomalyModel.detectAnomaly(
      sale.revenue,
      baseline.meanRevenue,
      baseline.stddevRevenue,
      threshold
    );

    if (revenueResult.isAnomaly) {
      anomalies.push({
        scope: 'sales_daily',
        targetId: null,
        windowStart: startOfDay(saleDate),
        windowEnd: endOfDay(saleDate),
        hour: null,
        metric: 'revenue',
        observedValue: sale.revenue,
        expectedValue: baseline.meanRevenue,
        zScore: Math.round(revenueResult.zScore * 100) / 100,
        deviationPct: Math.round(revenueResult.deviationPct * 100) / 100,
        direction: revenueResult.direction,
        method: 'zscore_v1'
      });
    }

    // Check orders anomaly
    const ordersResult = anomalyModel.detectAnomaly(
      sale.orders,
      baseline.meanOrders,
      baseline.stddevOrders,
      threshold
    );

    if (ordersResult.isAnomaly) {
      anomalies.push({
        scope: 'sales_daily',
        targetId: null,
        windowStart: startOfDay(saleDate),
        windowEnd: endOfDay(saleDate),
        hour: null,
        metric: 'orders',
        observedValue: sale.orders,
        expectedValue: baseline.meanOrders,
        zScore: Math.round(ordersResult.zScore * 100) / 100,
        deviationPct: Math.round(ordersResult.deviationPct * 100) / 100,
        direction: ordersResult.direction,
        method: 'zscore_v1'
      });
    }
  }

  // Persist anomalies
  if (anomalies.length > 0) {
    await prisma.salesAnomaly.createMany({
      data: anomalies
    });
  }

  return {
    anomalies,
    summary: {
      daysAnalyzed: recentSales.length,
      anomaliesFound: anomalies.length,
      threshold: threshold
    }
  };
}

/**
 * Detect hourly sales anomalies.
 * Uses day-of-week + hour baselines for precision.
 */
async function detectHourlySalesAnomalies(options = {}) {
  const {
    fromDate = addDays(new Date(), -1),
    toDate = new Date(),
    threshold = CONFIG.HOURLY_Z_THRESHOLD
  } = options;

  // Get baseline statistics (4 weeks)
  const baselineEnd = startOfDay(fromDate);
  const baselineStart = addDays(baselineEnd, -28);
  
  const baselines = await anomalyData.getHourlySalesBaseline(baselineStart, baselineEnd);
  
  // Get recent hourly sales
  const recentSales = await salesData.getSalesByHour(fromDate, toDate);

  const anomalies = [];

  for (const sale of recentSales) {
    const saleDate = new Date(sale.date);
    const dayOfWeek = saleDate.getDay();
    
    // Find matching baseline
    const baseline = baselines.find(
      b => b.dayOfWeek === dayOfWeek && b.hour === sale.hour
    );
    
    if (!baseline || baseline.sampleCount < 2) {
      continue;
    }

    const result = anomalyModel.detectAnomaly(
      sale.revenue,
      baseline.meanRevenue,
      baseline.stddevRevenue,
      threshold
    );

    if (result.isAnomaly) {
      const windowStart = new Date(saleDate);
      windowStart.setHours(sale.hour, 0, 0, 0);
      const windowEnd = new Date(windowStart);
      windowEnd.setHours(sale.hour, 59, 59, 999);

      anomalies.push({
        scope: 'sales_hourly',
        targetId: null,
        windowStart: windowStart,
        windowEnd: windowEnd,
        hour: sale.hour,
        metric: 'revenue',
        observedValue: sale.revenue,
        expectedValue: baseline.meanRevenue,
        zScore: Math.round(result.zScore * 100) / 100,
        deviationPct: Math.round(result.deviationPct * 100) / 100,
        direction: result.direction,
        method: 'zscore_v1'
      });
    }
  }

  if (anomalies.length > 0) {
    await prisma.salesAnomaly.createMany({
      data: anomalies
    });
  }

  return {
    anomalies,
    summary: {
      hoursAnalyzed: recentSales.length,
      anomaliesFound: anomalies.length,
      threshold: threshold
    }
  };
}

/**
 * Get stored anomalies with filters.
 */
async function getAnomalies(options = {}) {
  const { from, to, scope, direction, minZScore } = options;

  const where = {};

  if (from) {
    where.windowStart = { gte: new Date(from) };
  }
  if (to) {
    where.windowEnd = { lte: new Date(to) };
  }
  if (scope) {
    where.scope = scope;
  }
  if (direction) {
    where.direction = direction;
  }
  if (minZScore) {
    where.zScore = { gte: parseFloat(minZScore) };
  }

  return prisma.salesAnomaly.findMany({
    where,
    orderBy: [{ detectedAt: 'desc' }],
    take: 100
  });
}

// Utility functions
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export {
  detectDailySalesAnomalies,
  detectHourlySalesAnomalies,
  getAnomalies,
  CONFIG
};