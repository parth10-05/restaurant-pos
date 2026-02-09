/**
 * Anomaly Detection Model
 * Z-score based anomaly detection for identifying unusual patterns.
 * 
 * Design Choice: Z-score is simple, interpretable, and doesn't require
 * training. Good for initial anomaly detection with clear thresholds.
 */

/**
 * Calculate Z-score for a value given baseline statistics.
 * 
 * @param {number} observed - The observed value
 * @param {number} mean - Historical mean
 * @param {number} stddev - Historical standard deviation
 * @returns {number} - Z-score
 */
function calculateZScore(observed, mean, stddev) {
  if (stddev === 0 || isNaN(stddev)) {
    // No variation in baseline - can't calculate z-score
    // Return 0 if observed equals mean, otherwise return high value
    return observed === mean ? 0 : (observed > mean ? 3 : -3);
  }
  
  return (observed - mean) / stddev;
}

/**
 * Detect if a value is anomalous based on z-score threshold.
 * 
 * @param {number} observed - The observed value
 * @param {number} mean - Historical mean
 * @param {number} stddev - Historical standard deviation
 * @param {number} threshold - Z-score threshold (default 2.0)
 * @returns {{isAnomaly: boolean, zScore: number, direction: string|null}}
 */
function detectAnomaly(observed, mean, stddev, threshold = 2.0) {
  const zScore = calculateZScore(observed, mean, stddev);
  const absZScore = Math.abs(zScore);
  
  if (absZScore >= threshold) {
    return {
      isAnomaly: true,
      zScore: zScore,
      direction: zScore > 0 ? 'spike' : 'drop',
      deviationPct: mean > 0 ? ((observed - mean) / mean) * 100 : 0
    };
  }
  
  return {
    isAnomaly: false,
    zScore: zScore,
    direction: null,
    deviationPct: mean > 0 ? ((observed - mean) / mean) * 100 : 0
  };
}

/**
 * Batch anomaly detection for a series of observations.
 * 
 * @param {Array<{date: Date, value: number, ...rest}>} observations
 * @param {number} mean - Baseline mean
 * @param {number} stddev - Baseline standard deviation
 * @param {number} threshold - Z-score threshold
 * @returns {Array} - Array of anomalies found
 */
function detectAnomaliesInSeries(observations, mean, stddev, threshold = 2.0) {
  const anomalies = [];
  
  for (const obs of observations) {
    const result = detectAnomaly(obs.value, mean, stddev, threshold);
    
    if (result.isAnomaly) {
      anomalies.push({
        ...obs,
        observedValue: obs.value,
        expectedValue: mean,
        zScore: result.zScore,
        direction: result.direction,
        deviationPct: result.deviationPct
      });
    }
  }
  
  return anomalies;
}

/**
 * Detect anomalies using rolling statistics (adaptive baseline).
 * Better for detecting anomalies in non-stationary data.
 * 
 * @param {number[]} values - Time series of values
 * @param {number} windowSize - Rolling window size
 * @param {number} threshold - Z-score threshold
 * @returns {Array<{index: number, value: number, zScore: number, direction: string}>}
 */
function detectRollingAnomalies(values, windowSize = 14, threshold = 2.5) {
  const anomalies = [];
  
  for (let i = windowSize; i < values.length; i++) {
    const window = values.slice(i - windowSize, i);
    const mean = window.reduce((a, b) => a + b, 0) / window.length;
    const stddev = calculateStdDevInternal(window);
    
    const result = detectAnomaly(values[i], mean, stddev, threshold);
    
    if (result.isAnomaly) {
      anomalies.push({
        index: i,
        value: values[i],
        expectedValue: mean,
        zScore: result.zScore,
        direction: result.direction,
        deviationPct: result.deviationPct
      });
    }
  }
  
  return anomalies;
}

/**
 * Internal standard deviation calculation.
 */
function calculateStdDevInternal(values) {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
  
  return Math.sqrt(variance);
}

export {
  calculateZScore,
  detectAnomaly,
  detectAnomaliesInSeries,
  detectRollingAnomalies
};