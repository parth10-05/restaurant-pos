/**
 * Demand Forecast Service
 * Generates product and category level demand predictions.
 * 
 * Design Choice: Forecasts per-product demand separately to capture
 * item-specific patterns (e.g., weekend specials, seasonal items).
 */

import prisma from '../../prisma/client.js';
import * as demandData from '../data/demandData.extractor.js';
import * as forecastingModel from '../models/forecasting.model.js';

const CONFIG = {
  TRAINING_DAYS: 30,
  FORECAST_DAYS: 7,
  TOP_PRODUCTS_LIMIT: 50,
  MIN_DATA_POINTS: 5
};

/**
 * Generate demand forecasts for top products.
 * 
 * @param {Object} options
 * @param {Date} options.fromDate - Start of forecast period
 * @param {number} options.days - Days to forecast
 * @param {string[]} options.productIds - Specific products (optional)
 * @param {string} options.method - 'sma_7' | 'ewma_0.3'
 */
async function generateProductDemandForecasts(options = {}) {
  const {
    fromDate = addDays(new Date(), 1),
    days = CONFIG.FORECAST_DAYS,
    productIds = null,
    method = 'ewma_0.3'
  } = options;

  const trainingEnd = startOfDay(fromDate);
  const trainingStart = addDays(trainingEnd, -CONFIG.TRAINING_DAYS);

  // Get products to forecast
  let products;
  if (productIds && productIds.length > 0) {
    products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, categoryId: true }
    });
  } else {
    // Get top products by demand
    const topProducts = await demandData.getTopProductsByDemand(
      trainingStart,
      trainingEnd,
      CONFIG.TOP_PRODUCTS_LIMIT
    );
    products = topProducts.map(p => ({ id: p.productId, categoryId: p.categoryId }));
  }

  const forecasts = [];

  for (const product of products) {
    // Get historical demand for this product
    const history = await demandData.getProductDemandByDay(
      trainingStart,
      trainingEnd,
      product.id
    );

    if (history.length < CONFIG.MIN_DATA_POINTS) {
      continue; // Skip products with insufficient data
    }

    const quantities = history.map(h => h.quantity);
    const baseline = forecastingModel.simpleMovingAverage(quantities, 7);
    const stddev = forecastingModel.calculateStdDev(quantities);

    // Generate forecasts for each day
    for (let i = 0; i < days; i++) {
      const targetDate = addDays(fromDate, i);

      let forecastQty;
      if (method === 'sma_7') {
        forecastQty = forecastingModel.simpleMovingAverage(quantities, 7);
      } else {
        forecastQty = forecastingModel.exponentialMovingAverage(quantities, 0.3);
      }

      const interval = forecastingModel.calculatePredictionInterval(forecastQty, stddev, 1.5);

      forecasts.push({
        productId: product.id,
        categoryId: product.categoryId,
        granularity: 'daily',
        targetDate: targetDate,
        forecastQty: Math.round(forecastQty * 10) / 10,
        baselineQty: Math.round(baseline * 10) / 10,
        lowerBound: Math.round(interval.lower * 10) / 10,
        upperBound: Math.round(interval.upper * 10) / 10,
        method: method
      });
    }
  }

  // Persist forecasts
  if (forecasts.length > 0) {
    await prisma.productDemandForecast.createMany({
      data: forecasts
    });
  }

  return {
    forecasts,
    summary: {
      method,
      productsForecasted: products.length,
      totalForecasts: forecasts.length,
      trainingDays: CONFIG.TRAINING_DAYS
    }
  };
}

/**
 * Get demand forecasts with optional filters.
 */
async function getDemandForecasts(options = {}) {
  const { from, to, productId, categoryId } = options;

  const where = {};
  
  if (from) {
    where.targetDate = { ...where.targetDate, gte: new Date(from) };
  }
  if (to) {
    where.targetDate = { ...where.targetDate, lte: new Date(to) };
  }
  if (productId) {
    where.productId = productId;
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }

  return prisma.productDemandForecast.findMany({
    where,
    orderBy: [{ targetDate: 'asc' }, { productId: 'asc' }],
    include: {
      product: { select: { name: true } },
      category: { select: { name: true } }
    }
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
  generateProductDemandForecasts,
  getDemandForecasts,
  CONFIG
};