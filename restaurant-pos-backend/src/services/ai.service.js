/**
 * AI Service - Integration with Python AI Microservice
 * Proxies requests to the FastAPI AI service for predictions
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_TIMEOUT = parseInt(process.env.AI_SERVICE_TIMEOUT || '30000');

// ADD THIS LINE TO DEBUG
console.log('[AI Service Config] Using AI URL:', AI_SERVICE_URL); 

/**
 * Map database reason values (uppercase) to Python AI expected values (lowercase)
 */
function mapWasteReason(reason) {
  const reasonMap = {
    'SPOILAGE': 'spoilage',
    'OVERCOOKED': 'overcooked',
    'RETURNED': 'returned',
    'PREP_LOSS': 'prep_loss',
    'EXPIRED': 'spoilage',
    'QUALITY_ISSUE': 'spoilage'
  };
  return reasonMap[reason] || 'spoilage';
}

/**
 * Map frontend scenario types to Python AI expected values
 * Valid types: increased_demand, reduced_demand, reduced_purchase, increased_purchase, menu_promotion, supplier_delay, custom
 */
function mapScenarioType(type, value) {
  const typeMap = {
    'demand_change': value > 0 ? 'increased_demand' : 'reduced_demand',
    'demand_increase': 'increased_demand',
    'demand_decrease': 'reduced_demand',
    'purchase_change': value > 0 ? 'increased_purchase' : 'reduced_purchase',
    'purchase_increase': 'increased_purchase',
    'purchase_decrease': 'reduced_purchase',
    'menu_promotion': 'menu_promotion',
    'supplier_delay': 'supplier_delay',
    'custom': 'custom',
    'increased_demand': 'increased_demand',
    'reduced_demand': 'reduced_demand',
    'increased_purchase': 'increased_purchase',
    'reduced_purchase': 'reduced_purchase'
  };
  return typeMap[type] || 'custom';
}

/**
 * Make request to AI service with error handling
 */
async function fetchAI(endpoint, data) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_SERVICE_TIMEOUT);

  try {
    const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Handle FastAPI validation errors which come as array in 'detail'
      let errorMessage = `AI service error: ${response.status}`;
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          // Validation errors - extract meaningful messages
          errorMessage = errorData.detail.map(e => 
            `${e.loc?.join('.')}: ${e.msg}`
          ).join('; ');
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else {
          errorMessage = JSON.stringify(errorData.detail);
        }
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('AI service request timeout');
    }
    throw error;
  }
}

/**
 * Check if AI service is healthy
 * @returns {Promise<Object>} Health status
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    return await response.json();
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

/**
 * Get demand forecast for ingredients
 * @param {Object} params
 * @param {Array} params.consumptionHistory - Historical consumption records
 * @param {Object} params.context - Request context with date range
 * @param {number} params.forecastDays - Days to forecast (default: 7)
 * @param {Array} params.ingredientIds - Optional specific ingredient IDs
 * @returns {Promise<Object>} Forecast results
 */
export async function getDemandForecast({
  consumptionHistory,
  context,
  forecastDays = 7,
  ingredientIds = null,
  modelPreference = 'auto'
}) {
  // Build ingredient name lookup from consumption history
  const ingredientNames = {};
  consumptionHistory.forEach(record => {
    if (record.ingredientName && record.ingredientName !== record.ingredientId) {
      ingredientNames[record.ingredientId] = record.ingredientName;
    }
  });

  // Transform data to AI service format
  const payload = {
    consumption_history: consumptionHistory.map(record => ({
      ingredient_id: record.ingredientId,
      ingredient_name: record.ingredientName || ingredientNames[record.ingredientId] || record.ingredientId,
      date: record.date,
      quantity_used: record.totalConsumed || record.quantityUsed,
      unit: record.unit,
      order_count: record.orderCount,
    })),
    context: {
      date_range: {
        start: context.startDate,
        end: context.endDate
      },
      seasonality_flags: context.seasonalityFlags || [],
      special_events: context.specialEvents || []
    },
    forecast_days: forecastDays,
    ingredient_ids: ingredientIds,
    model_preference: modelPreference
  };

  const result = await fetchAI('/api/v1/predict/demand', payload);
  
  // Handle case where AI service returns no forecasts
  if (!result || !result.forecasts || !Array.isArray(result.forecasts)) {
    return {
      success: false,
      error: 'AI service returned invalid response',
      forecasts: [],
      warnings: [result?.message || 'No forecast data available']
    };
  }
  
  // Transform response back to frontend-friendly format
  return {
    success: result.success !== false,
    requestId: result.request_id,
    forecastPeriod: result.forecast_period,
    forecasts: result.forecasts.map(forecast => ({
      ingredientId: forecast.ingredient_id,
      // Use name from response, or look it up from our map, or use ID as fallback
      ingredientName: forecast.ingredient_name || ingredientNames[forecast.ingredient_id] || forecast.ingredient_id,
      unit: forecast.unit,
      modelUsed: forecast.explanation?.model_used || 'unknown',
      modelConfidence: forecast.explanation?.confidence_score || 0.5,
      trend: forecast.trend,
      totalPredicted: forecast.total_predicted,
      avgDailyPredicted: forecast.avg_daily_predicted,
      dailyForecasts: (forecast.predicted_daily_usage || forecast.daily_forecasts || []).map(df => ({
        date: df.date,
        predicted: df.predicted_usage || df.predicted || 0,
        lowerBound: df.lower_bound,
        upperBound: df.upper_bound,
        isSpike: df.is_spike,
        isDrop: df.is_drop
      })),
      explanation: forecast.explanation
    })),
    summary: result.summary,
    warnings: result.warnings || [],
    processingTimeMs: result.processing_time_ms
  };
}

/**
 * Get waste risk scores for ingredients
 * @param {Object} params
 * @param {Array} params.consumptionHistory - Historical consumption
 * @param {Array} params.wasteHistory - Historical waste events
 * @param {Array} params.currentInventory - Current inventory levels
 * @param {Object} params.context - Request context
 * @returns {Promise<Object>} Waste risk scores
 */
export async function getWasteRisk({
  consumptionHistory,
  wasteHistory,
  currentInventory,
  context
}) {
  // Build current_stock_levels as a dict keyed by ingredient_id
  const stockLevels = {};
  currentInventory.forEach(inv => {
    stockLevels[inv.ingredientId] = inv.currentStock || 0;
  });

  const payload = {
    consumption_history: consumptionHistory.map(record => ({
      ingredient_id: record.ingredientId,
      date: record.date,
      quantity_used: record.totalConsumed || record.quantityUsed || 0,
      unit: record.unit
    })),
    waste_history: wasteHistory.map(record => ({
      ingredient_id: record.ingredientId,
      date: record.date,
      quantity_wasted: record.totalWasted || record.quantityWasted || 0,
      reason: mapWasteReason(record.reason)
    })),
    ingredient_profiles: currentInventory.map(inv => ({
      ingredient_id: inv.ingredientId,
      name: inv.ingredientName,
      unit: inv.unit
    })),
    context: {
      date_range: {
        start: context.startDate,
        end: context.endDate
      },
      seasonality_flags: context.seasonalityFlags || []
    },
    current_stock_levels: stockLevels
  };

  const result = await fetchAI('/api/v1/predict/waste-risk', payload);

  // Handle case where AI service returns no data
  // The Python service uses 'risk_assessments' not 'risk_scores'
  const riskData = result?.risk_assessments || result?.risk_scores || [];
  if (!result || !Array.isArray(riskData)) {
    return {
      success: false,
      error: 'AI service returned invalid response',
      risks: [],
      warnings: [result?.message || 'No waste risk data available']
    };
  }

  return {
    success: result.success !== false,
    requestId: result.request_id,
    analysisPeriod: result.analysis_period,
    risks: riskData.map(score => ({
      ingredientId: score.ingredient_id,
      ingredientName: score.ingredient_name || score.ingredient_id,
      riskLevel: score.risk_level,
      riskScore: score.waste_risk_score || score.risk_score || 0,
      confidenceScore: score.model_confidence || score.confidence_score || 0.5,
      contributingFactors: score.contributing_factors || [],
      recommendations: score.recommended_actions || score.recommendations || [],
      historicalWasteRatio: score.historical_waste_ratio,
      demandVolatility: score.demand_volatility,
      daysUntilConcern: score.days_until_concern,
      modelUsed: score.model_used
    })),
    summary: result.summary,
    warnings: result.warnings || [],
    processingTimeMs: result.processing_time_ms
  };
}

/**
 * Run inventory simulation for what-if analysis
 * @param {Object} params
 * @param {Array} params.consumptionHistory - Historical consumption
 * @param {Array} params.wasteHistory - Historical waste
 * @param {Array} params.currentInventory - Current inventory
 * @param {Array} params.scenarios - Scenarios to simulate
 * @param {Object} params.context - Request context
 * @param {number} params.simulationDays - Days to simulate
 * @returns {Promise<Object>} Simulation results
 */
export async function runInventorySimulation({
  consumptionHistory,
  wasteHistory,
  currentInventory,
  scenarios,
  context,
  simulationDays = 14
}) {
  const payload = {
    consumption_history: consumptionHistory.map(record => ({
      ingredient_id: record.ingredientId,
      date: record.date,
      quantity_used: record.totalConsumed || record.quantityUsed || 0,
      unit: record.unit
    })),
    waste_history: wasteHistory.map(record => ({
      ingredient_id: record.ingredientId,
      date: record.date,
      quantity_wasted: record.totalWasted || record.quantityWasted || 0,
      reason: mapWasteReason(record.reason)
    })),
    current_inventory: currentInventory.map(inv => ({
      ingredient_id: inv.ingredientId,
      current_stock: inv.currentStock || 0,
      unit: inv.unit
    })),
    scenarios: scenarios.map(s => ({
      scenario_type: mapScenarioType(s.type || s.scenario_type, s.value || s.modifier_percent || 0),
      modifier_percent: s.value ? Math.abs(s.value) * 100 : (((s.demand_multiplier || 1) - 1) * 100 || s.modifier_percent || 20),
      duration_days: s.duration_days || simulationDays,
      description: s.name || s.description || 'Scenario'
    })),
    context: {
      date_range: {
        start: context.startDate,
        end: context.endDate
      },
      seasonality_flags: context.seasonalityFlags || []
    },
    simulation_days: simulationDays
  };

  const result = await fetchAI('/api/v1/simulate/inventory', payload);

  // Handle errors
  if (!result || !result.scenario_outcomes) {
    return {
      success: false,
      error: 'AI service returned invalid response',
      simulations: [],
      warnings: [result?.message || 'No simulation data available']
    };
  }

  return {
    success: result.success !== false,
    requestId: result.request_id,
    simulationPeriod: result.simulation_period,
    baselineOutcome: result.baseline_outcome,
    simulations: result.scenario_outcomes?.map(so => ({
      scenarioName: so.scenario?.description || 'Scenario',
      stockoutCount: so.stockouts?.length || 0,
      wasteEvents: so.waste_events?.length || 0,
      serviceLevel: so.metrics?.service_level || 0,
      costImpact: so.metrics?.cost_impact || 0
    })) || [],
    summary: result.summary,
    warnings: result.warnings || [],
    processingTimeMs: result.processing_time_ms
  };
}

export default {
  checkHealth,
  getDemandForecast,
  getWasteRisk,
  runInventorySimulation
};
