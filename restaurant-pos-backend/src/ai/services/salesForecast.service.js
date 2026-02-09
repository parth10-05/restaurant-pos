/**
 * Sales Forecast Service
 * Orchestrates data extraction, model execution, and result persistence.
 * 
 * Design Choice: Service layer handles all coordination while keeping
 * data and model layers pure. This enables:
 * - Transaction management
 * - Error handling in one place
 * - Easy mocking for tests
 */

import prisma from '../../prisma/client.js';
import * as salesData from '../data/salesData.extractor.js';
import * as forecastingModel from '../models/forecasting.model.js';

// Configuration
const CONFIG = {
  TRAINING_DAYS: 30,      // Days of history to use
  FORECAST_DAYS: 7,       // Days to forecast ahead
  SMA_WINDOW: 7,
  EWMA_ALPHA: 0.3
};

/**
 * Generate daily sales forecasts.
 * 
 * @param {Object} options
 * @param {Date} options.fromDate - Start of forecast period (default: tomorrow)
 * @param {number} options.days - Number of days to forecast
 * @param {string} options.method - 'sma_7' | 'ewma_0.3' | 'seasonal'
 * @returns {Promise<{forecasts: Array, summary: Object}>}
 */
async function generateDailySalesForecasts(options = {}) {
  const {
    fromDate = addDays(new Date(), 1),
    days = CONFIG.FORECAST_DAYS,
    method = 'sma_7'
  } = options;

  // Calculate training period
  const trainingEnd = new Date(fromDate);
  const trainingStart = addDays(trainingEnd, -CONFIG.TRAINING_DAYS);

  // Extract historical data
  const historicalSales = await salesData.getSalesByDay(trainingStart, trainingEnd);
  
  if (historicalSales.length < 7) {
    throw new Error('Insufficient historical data for forecasting. Need at least 7 days.');
  }

  // Prepare data for modeling
  const revenues = historicalSales.map(s => s.revenue);
  const orders = historicalSales.map(s => s.orders);
  
  // Calculate baseline statistics
  const baseline = forecastingModel.simpleMovingAverage(revenues, CONFIG.SMA_WINDOW);
  const stddev = forecastingModel.calculateStdDev(revenues);

  // Generate forecasts
  const forecasts = [];
  
  for (let i = 0; i < days; i++) {
    const targetDate = addDays(fromDate, i);
    const dayOfWeek = targetDate.getDay();

    let forecastValue;
    if (method === 'sma_7') {
      forecastValue = forecastingModel.simpleMovingAverage(revenues, CONFIG.SMA_WINDOW);
    } else if (method === 'ewma_0.3') {
      forecastValue = forecastingModel.exponentialMovingAverage(revenues, CONFIG.EWMA_ALPHA);
    } else if (method === 'seasonal') {
      forecastValue = forecastingModel.seasonalWeightedAverage(
        historicalSales.map(s => ({ date: s.date, value: s.revenue })),
        dayOfWeek,
        4
      );
    }

    // Calculate prediction intervals
    const interval = forecastingModel.calculatePredictionInterval(forecastValue, stddev);

    // Estimate order count based on average revenue per order
    const avgOrderValue = baseline / (orders.reduce((a, b) => a + b, 0) / orders.length || 1);
    const forecastOrders = Math.round(forecastValue / avgOrderValue);

    forecasts.push({
      granularity: 'daily',
      targetDate: targetDate,
      hour: null,
      forecastValue: Math.round(forecastValue * 100) / 100,
      forecastOrders: forecastOrders,
      lowerBound: Math.round(interval.lower * 100) / 100,
      upperBound: Math.round(interval.upper * 100) / 100,
      baseline: Math.round(baseline * 100) / 100,
      method: method
    });
  }

  // Persist forecasts
  await prisma.salesForecast.createMany({
    data: forecasts
  });

  return {
    forecasts,
    summary: {
      method,
      trainingDays: historicalSales.length,
      baselineRevenue: baseline,
      avgDailyOrders: Math.round(orders.reduce((a, b) => a + b, 0) / orders.length)
    }
  };
}

/**
 * Generate hourly sales forecasts.
 * Uses day-of-week and hour patterns.
 */
async function generateHourlySalesForecasts(options = {}) {
  const {
    fromDate = addDays(new Date(), 1),
    days = 1,
    method = 'seasonal_hourly'
  } = options;

  // Get 4 weeks of hourly history for pattern detection
  const trainingEnd = startOfDay(fromDate);
  const trainingStart = addDays(trainingEnd, -28);

  const historicalSales = await salesData.getSalesByHour(trainingStart, trainingEnd);
  
  if (historicalSales.length < 24) {
    throw new Error('Insufficient hourly data for forecasting.');
  }

  const forecasts = [];
  
  for (let d = 0; d < days; d++) {
    const targetDate = addDays(fromDate, d);
    const dayOfWeek = targetDate.getDay();

    for (let hour = 0; hour < 24; hour++) {
      const forecastValue = forecastingModel.hourlySeasonalForecast(
        historicalSales,
        dayOfWeek,
        hour
      );

      // Get baseline for this specific hour/day combination
      const matchingHours = historicalSales.filter(
        h => new Date(h.date).getDay() === dayOfWeek && h.hour === hour
      );
      const baseline = matchingHours.length > 0
        ? matchingHours.reduce((a, b) => a + b.revenue, 0) / matchingHours.length
        : forecastValue;

      const values = matchingHours.map(h => h.revenue);
      const stddev = forecastingModel.calculateStdDev(values);
      const interval = forecastingModel.calculatePredictionInterval(forecastValue, stddev);

      forecasts.push({
        granularity: 'hourly',
        targetDate: targetDate,
        hour: hour,
        forecastValue: Math.round(forecastValue * 100) / 100,
        forecastOrders: null,
        lowerBound: Math.round(interval.lower * 100) / 100,
        upperBound: Math.round(interval.upper * 100) / 100,
        baseline: Math.round(baseline * 100) / 100,
        method: method
      });
    }
  }

  // Persist forecasts
  await prisma.salesForecast.createMany({
    data: forecasts
  });

  return {
    forecasts,
    summary: {
      method,
      trainingDays: 28,
      forecastHours: forecasts.length
    }
  };
}

/**
 * Retrieve stored forecasts.
 */
async function getForecasts(options = {}) {
  const { from, to, granularity = 'daily' } = options;

  const where = { granularity };
  
  if (from) {
    where.targetDate = { ...where.targetDate, gte: new Date(from) };
  }
  if (to) {
    where.targetDate = { ...where.targetDate, lte: new Date(to) };
  }

  return prisma.salesForecast.findMany({
    where,
    orderBy: [{ targetDate: 'asc' }, { hour: 'asc' }]
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

export {
  generateDailySalesForecasts,
  generateHourlySalesForecasts,
  getForecasts,
  CONFIG
};