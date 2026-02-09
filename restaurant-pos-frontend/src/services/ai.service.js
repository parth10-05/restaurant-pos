/**
 * AI Service - Frontend API client for AI predictions
 */
import { api } from '../config/api';

/**
 * Check AI service health
 */
export async function checkHealth() {
  try {
    const response = await api.get('/admin/ai/python/health');
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get AI dashboard summary
 */
export async function getDashboard() {
  try {
    const response = await api.get('/admin/ai/python/dashboard');
    return response.data;
  } catch (error) {
    console.error('AI Dashboard error:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || error.message 
    };
  }
}

/**
 * Get demand forecast
 * @param {Object} options
 * @param {number} options.days - Forecast days (default: 7)
 * @param {string[]} options.ingredientIds - Optional ingredient IDs
 * @param {string} options.model - Model preference (auto|arima)
 */
export async function getForecast({ days = 7, ingredientIds, model = 'auto' } = {}) {
  try {
    const params = new URLSearchParams();
    params.append('days', days);
    if (ingredientIds?.length) {
      params.append('ingredientIds', ingredientIds.join(','));
    }
    params.append('model', model);

    const response = await api.get(`/admin/ai/python/forecast?${params}`);
    return response.data;
  } catch (error) {
    console.error('Forecast error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
}

/**
 * Get waste risk scores
 */
export async function getWasteRisk() {
  try {
    const response = await api.get('/admin/ai/python/waste-risk');
    return response.data;
  } catch (error) {
    console.error('Waste risk error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
}

/**
 * Run inventory simulation
 * @param {Object} options
 * @param {Array} options.scenarios - Scenarios to simulate
 * @param {number} options.days - Simulation days (default: 14)
 */
export async function runSimulation({ scenarios, days = 14 }) {
  try {
    const response = await api.post('/admin/ai/python/simulate', {
      scenarios,
      days
    });
    return response.data;
  } catch (error) {
    console.error('Simulation error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
}

export const aiService = {
  checkHealth,
  getDashboard,
  getForecast,
  getWasteRisk,
  runSimulation
};

export default aiService;
