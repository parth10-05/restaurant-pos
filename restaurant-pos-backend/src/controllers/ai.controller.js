/**
 * AI Controller
 * Handles HTTP requests for AI module endpoints.
 */

import {
  salesForecastService,
  demandForecastService,
  anomalyDetectionService
} from '../ai/services/index.js';

import { runJob, getJobs, getJob } from '../ai/jobs/aiJobRunner.js';
import * as pythonAiService from '../services/ai.service.js';
import * as analyticsService from '../services/analytics.service.js';
import prisma from '../prisma/client.js';

/**
 * POST /api/admin/ai/jobs/run
 * Trigger an AI job (async execution).
 */
export async function triggerJob(req, res) {
  try {
    const { type, params = {} } = req.body;
    const triggeredBy = req.user?.id || null;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Job type is required'
      });
    }

    const validTypes = [
      'sales_forecast_daily',
      'sales_forecast_hourly',
      'demand_forecast',
      'anomaly_daily',
      'anomaly_hourly',
      'full_pipeline'
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid job type. Valid types: ${validTypes.join(', ')}`
      });
    }

    const result = await runJob(type, params, triggeredBy);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[AI Controller] triggerJob error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/admin/ai/jobs
 */
export async function listJobs(req, res) {
  try {
    const { type, status, limit } = req.query;

    const jobs = await getJobs({
      type,
      status,
      limit: limit ? parseInt(limit) : 20
    });

    res.json({
      success: true,
      data: jobs
    });

  } catch (error) {
    console.error('[AI Controller] listJobs error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/admin/ai/jobs/:id
 */
export async function getJobById(req, res) {
  try {
    const { id } = req.params;
    const job = await getJob(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: job
    });

  } catch (error) {
    console.error('[AI Controller] getJobById error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/admin/ai/forecasts/sales
 */
export async function getSalesForecasts(req, res) {
  try {
    const { from, to, granularity } = req.query;

    const forecasts = await salesForecastService.getForecasts({
      from,
      to,
      granularity: granularity || 'daily'
    });

    res.json({
      success: true,
      data: forecasts,
      meta: {
        count: forecasts.length,
        granularity: granularity || 'daily'
      }
    });

  } catch (error) {
    console.error('[AI Controller] getSalesForecasts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/admin/ai/forecasts/demand
 */
export async function getDemandForecasts(req, res) {
  try {
    const { from, to, productId, categoryId } = req.query;

    const forecasts = await demandForecastService.getDemandForecasts({
      from,
      to,
      productId,
      categoryId
    });

    res.json({
      success: true,
      data: forecasts,
      meta: {
        count: forecasts.length
      }
    });

  } catch (error) {
    console.error('[AI Controller] getDemandForecasts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/admin/ai/anomalies
 */
export async function getAnomalies(req, res) {
  try {
    const { from, to, scope, direction, minZScore } = req.query;

    const anomalies = await anomalyDetectionService.getAnomalies({
      from,
      to,
      scope,
      direction,
      minZScore
    });

    res.json({
      success: true,
      data: anomalies,
      meta: {
        count: anomalies.length
      }
    });

  } catch (error) {
    console.error('[AI Controller] getAnomalies error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/admin/ai/dashboard
 */
export async function getDashboard(req, res) {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const [
      tomorrowForecast,
      weekForecasts,
      recentAnomalies,
      recentJobs
    ] = await Promise.all([
      salesForecastService.getForecasts({
        from: tomorrow.toISOString().split('T')[0],
        to: tomorrow.toISOString().split('T')[0],
        granularity: 'daily'
      }),
      salesForecastService.getForecasts({
        from: tomorrow.toISOString().split('T')[0],
        to: weekFromNow.toISOString().split('T')[0],
        granularity: 'daily'
      }),
      anomalyDetectionService.getAnomalies({
        from: new Date(today.setDate(today.getDate() - 7)).toISOString()
      }),
      getJobs({ limit: 5 })
    ]);

    res.json({
      success: true,
      data: {
        tomorrowForecast: tomorrowForecast[0] || null,
        weeklyForecastSummary: {
          totalExpectedRevenue: weekForecasts.reduce((sum, f) => sum + f.forecastValue, 0),
          avgDailyRevenue: weekForecasts.length > 0 
            ? weekForecasts.reduce((sum, f) => sum + f.forecastValue, 0) / weekForecasts.length
            : 0,
          days: weekForecasts.length
        },
        recentAnomalies: {
          count: recentAnomalies.length,
          spikes: recentAnomalies.filter(a => a.direction === 'spike').length,
          drops: recentAnomalies.filter(a => a.direction === 'drop').length
        },
        lastJobRun: recentJobs[0] || null
      }
    });

  } catch (error) {
    console.error('[AI Controller] getDashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Python AI Microservice Endpoints
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/ai/python/health
 * Check Python AI service health
 */
export async function getPythonAiHealth(req, res) {
  try {
    const health = await pythonAiService.checkHealth();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('[AI Controller] getPythonAiHealth error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/admin/ai/python/forecast
 * Get ingredient demand forecast from Python AI service
 */
export async function getPythonForecast(req, res) {
  try {
    const { days = 7, ingredientIds, model = 'auto' } = req.query;
    const forecastDays = parseInt(days);

    // Get date range (last 90 days for training data)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    // Get consumption history
    const consumptionHistory = await analyticsService.getDailyIngredientConsumption({
      startDate,
      endDate
    });

    if (consumptionHistory.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient data',
        message: 'No consumption history available. Need at least 7 days of data.'
      });
    }

    // Parse ingredient IDs if provided
    const parsedIngredientIds = ingredientIds 
      ? ingredientIds.split(',').map(id => id.trim())
      : null;

    const forecast = await pythonAiService.getDemandForecast({
      consumptionHistory,
      context: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      forecastDays,
      ingredientIds: parsedIngredientIds,
      modelPreference: model
    });

    res.json({
      success: true,
      data: forecast
    });
  } catch (error) {
    console.error('[AI Controller] getPythonForecast error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/admin/ai/python/waste-risk
 * Get waste risk scores from Python AI service
 */
export async function getPythonWasteRisk(req, res) {
  try {
    // Get date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Get consumption history
    const consumptionHistory = await analyticsService.getDailyIngredientConsumption({
      startDate,
      endDate
    });

    // Get waste history
    const wasteHistory = await analyticsService.getDailyWasteByIngredient({
      startDate,
      endDate
    });

    // Get current inventory with stock from InventoryStock
    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
      include: {
        stock: true
      }
    });

    const currentInventory = ingredients.map(ing => ({
      ingredientId: ing.id,
      ingredientName: ing.name,
      currentStock: ing.stock?.currentQty || 0,
      unit: ing.unit,
      costPerUnit: ing.costPerUnit,
      expirationDate: null
    }));

    if (currentInventory.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No inventory',
        message: 'No active ingredients in inventory.'
      });
    }

    const result = await pythonAiService.getWasteRisk({
      consumptionHistory,
      wasteHistory,
      currentInventory,
      context: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[AI Controller] getPythonWasteRisk error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * POST /api/admin/ai/python/simulate
 * Run inventory simulation
 */
export async function runPythonSimulation(req, res) {
  try {
    const { scenarios, days = 14 } = req.body;
    const simulationDays = parseInt(days);

    if (!scenarios || !Array.isArray(scenarios) || scenarios.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'At least one scenario is required'
      });
    }

    // Get historical data (last 60 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);

    const consumptionHistory = await analyticsService.getDailyIngredientConsumption({
      startDate,
      endDate
    });

    const wasteHistory = await analyticsService.getDailyWasteByIngredient({
      startDate,
      endDate
    });

    // Get current inventory with stock
    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
      include: {
        stock: true
      }
    });

    const currentInventory = ingredients.map(ing => ({
      ingredientId: ing.id,
      ingredientName: ing.name,
      currentStock: ing.stock?.currentQty || 0,
      unit: ing.unit,
      costPerUnit: ing.costPerUnit,
      expirationDate: null
    }));

    if (consumptionHistory.length < 7) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient data',
        message: 'Need at least 7 days of consumption history.'
      });
    }

    const result = await pythonAiService.runInventorySimulation({
      consumptionHistory,
      wasteHistory,
      currentInventory,
      scenarios,
      context: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      simulationDays
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[AI Controller] runPythonSimulation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * GET /api/admin/ai/python/dashboard
 * Get combined AI insights from Python service
 */
export async function getPythonDashboard(req, res) {
  try {
    // Check AI service health first
    const health = await pythonAiService.checkHealth();
    if (health.status !== 'healthy') {
      return res.status(503).json({
        success: false,
        error: 'AI service unavailable',
        aiStatus: health
      });
    }

    // Get date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get raw data
    const [consumptionHistory, wasteHistory, ingredients] = await Promise.all([
      analyticsService.getDailyIngredientConsumption({
        startDate: thirtyDaysAgo,
        endDate: now
      }),
      analyticsService.getDailyWasteByIngredient({
        startDate: thirtyDaysAgo,
        endDate: now
      }),
      prisma.ingredient.findMany({
        where: { isActive: true },
        include: {
          stock: true
        }
      })
    ]);

    const currentInventory = ingredients.map(ing => ({
      ingredientId: ing.id,
      ingredientName: ing.name,
      currentStock: ing.stock?.currentQty || 0,
      unit: ing.unit,
      costPerUnit: ing.costPerUnit,
      expirationDate: null
    }));

    const context = {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };

    // Get forecasts and risk (parallel requests)
    let forecastResult = null;
    let riskResult = null;

    if (consumptionHistory.length >= 7) {
      try {
        forecastResult = await pythonAiService.getDemandForecast({
          consumptionHistory,
          context,
          forecastDays: 7
        });
      } catch (err) {
        console.error('Forecast failed:', err.message);
      }
    }

    if (currentInventory.length > 0) {
      try {
        riskResult = await pythonAiService.getWasteRisk({
          consumptionHistory,
          wasteHistory,
          currentInventory,
          context
        });
      } catch (err) {
        console.error('Risk analysis failed:', err.message);
      }
    }

    // Build summary
    const summary = {
      aiServiceStatus: 'healthy',
      dataStatus: {
        hasConsumptionData: consumptionHistory.length >= 7,
        consumptionDays: [...new Set(consumptionHistory.map(c => c.date))].length,
        hasWasteData: wasteHistory.length > 0,
        wasteDays: [...new Set(wasteHistory.map(w => w.date))].length,
        ingredientCount: currentInventory.length
      },
      forecast: forecastResult ? {
        available: true,
        topItems: forecastResult.forecasts?.slice(0, 5).map(f => ({
          ingredientId: f.ingredientId,
          ingredientName: f.ingredientName,
          trend: f.trend,
          nextDayPredicted: f.dailyForecasts?.[0]?.predicted
        })) || [],
        anomaliesDetected: forecastResult.forecasts?.reduce((acc, f) => acc + (f.anomalies?.length || 0), 0) || 0
      } : { available: false, reason: 'Insufficient data (need 7+ days)' },
      wasteRisk: riskResult ? {
        available: true,
        highRiskCount: riskResult.riskScores?.filter(r => r.riskLevel === 'HIGH').length || 0,
        mediumRiskCount: riskResult.riskScores?.filter(r => r.riskLevel === 'MEDIUM').length || 0,
        lowRiskCount: riskResult.riskScores?.filter(r => r.riskLevel === 'LOW').length || 0,
        topRisks: riskResult.riskScores
          ?.sort((a, b) => b.riskScore - a.riskScore)
          .slice(0, 5)
          .map(r => ({
            ingredientId: r.ingredientId,
            ingredientName: r.ingredientName,
            riskLevel: r.riskLevel,
            riskScore: r.riskScore,
            mainFactor: r.contributingFactors?.[0]?.factor
          })) || []
      } : { available: false, reason: 'No inventory data' },
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('[AI Controller] getPythonDashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}