/**
 * Forecasting Models
 * Pure statistical functions with no database access.
 * 
 * Design Choice: Keep models pure (stateless, no side effects) for:
 * - Easy unit testing
 * - Predictable behavior
 * - Swappable algorithms
 */

/**
 * Simple Moving Average (SMA)
 * @param {number[]} values - Historical values
 * @param {number} window - Number of periods to average
 * @returns {number} - Forecast value
 */
function simpleMovingAverage(values, window = 7) {
  if (values.length === 0) return 0;
  if (values.length < window) {
    window = values.length;
  }
  
  const recentValues = values.slice(-window);
  const sum = recentValues.reduce((acc, val) => acc + val, 0);
  return sum / recentValues.length;
}

/**
 * Exponentially Weighted Moving Average (EWMA)
 * Gives more weight to recent observations.
 * 
 * @param {number[]} values - Historical values
 * @param {number} alpha - Smoothing factor (0 < alpha <= 1)
 * @returns {number} - Forecast value
 */
function exponentialMovingAverage(values, alpha = 0.3) {
  if (values.length === 0) return 0;
  
  let ewma = values[0];
  for (let i = 1; i < values.length; i++) {
    ewma = alpha * values[i] + (1 - alpha) * ewma;
  }
  return ewma;
}

/**
 * Weighted Moving Average with day-of-week seasonality
 * Uses same weekday from previous weeks with recency weighting.
 * 
 * @param {Array<{date: Date, value: number}>} history - Historical data with dates
 * @param {number} targetDayOfWeek - 0 (Sunday) to 6 (Saturday)
 * @param {number} weeks - Number of weeks to consider
 * @returns {number} - Forecast value
 */
function seasonalWeightedAverage(history, targetDayOfWeek, weeks = 4) {
  // Filter to same day of week
  const sameDayData = history.filter(h => {
    const date = new Date(h.date);
    return date.getDay() === targetDayOfWeek;
  });

  if (sameDayData.length === 0) {
    return simpleMovingAverage(history.map(h => h.value), 7);
  }

  // Take most recent N weeks
  const recentData = sameDayData.slice(-weeks);
  
  // Apply recency weights (most recent = highest weight)
  let weightedSum = 0;
  let weightTotal = 0;
  
  recentData.forEach((data, index) => {
    const weight = index + 1; // Linear weighting
    weightedSum += data.value * weight;
    weightTotal += weight;
  });

  return weightTotal > 0 ? weightedSum / weightTotal : 0;
}

/**
 * Calculate prediction interval bounds
 * Based on historical standard deviation.
 * 
 * @param {number} forecast - Point forecast
 * @param {number} stddev - Historical standard deviation
 * @param {number} confidence - Confidence level (default 1.96 for 95%)
 * @returns {{lower: number, upper: number}}
 */
function calculatePredictionInterval(forecast, stddev, confidence = 1.96) {
  const margin = confidence * stddev;
  return {
    lower: Math.max(0, forecast - margin),
    upper: forecast + margin
  };
}

/**
 * Hourly forecast using hour-of-day and day-of-week patterns.
 * 
 * @param {Array<{date: Date, hour: number, value: number}>} history
 * @param {number} targetDayOfWeek
 * @param {number} targetHour
 * @returns {number}
 */
function hourlySeasonalForecast(history, targetDayOfWeek, targetHour) {
  // Filter to same day and hour
  const matchingData = history.filter(h => {
    const date = new Date(h.date);
    return date.getDay() === targetDayOfWeek && h.hour === targetHour;
  });

  if (matchingData.length === 0) {
    // Fallback: use same hour across all days
    const sameHourData = history.filter(h => h.hour === targetHour);
    if (sameHourData.length === 0) {
      return simpleMovingAverage(history.map(h => h.value), 7);
    }
    return simpleMovingAverage(sameHourData.map(h => h.value), 4);
  }

  return exponentialMovingAverage(matchingData.map(h => h.value), 0.4);
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values) {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
  
  return Math.sqrt(variance);
}

export {
  simpleMovingAverage,
  exponentialMovingAverage,
  seasonalWeightedAverage,
  calculatePredictionInterval,
  hourlySeasonalForecast,
  calculateStdDev
};