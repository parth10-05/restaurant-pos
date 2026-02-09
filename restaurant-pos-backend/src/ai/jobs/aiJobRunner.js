/**
 * AI Job Runner
 * Wraps AI service calls with job tracking, error handling, and logging.
 */

import prisma from '../../prisma/client.js';
import * as salesForecastService from '../services/salesForecast.service.js';
import * as demandForecastService from '../services/demandForecast.service.js';
import * as anomalyDetectionService from '../services/anomalyDetection.service.js';

/**
 * Execute an AI job with full lifecycle management.
 */
export async function runJob(type, params = {}, triggeredBy = null) {
  // Create job record
  const job = await prisma.aIJob.create({
    data: {
      type,
      status: 'running',
      params: params ?? undefined,
      triggeredBy,
      startedAt: new Date()
    }
  });

  try {
    let result;

    switch (type) {
      case 'sales_forecast_daily':
        result = await salesForecastService.generateDailySalesForecasts(params);
        break;

      case 'sales_forecast_hourly':
        result = await salesForecastService.generateHourlySalesForecasts(params);
        break;

      case 'demand_forecast':
        result = await demandForecastService.generateProductDemandForecasts(params);
        break;

      case 'anomaly_daily':
        result = await anomalyDetectionService.detectDailySalesAnomalies(params);
        break;

      case 'anomaly_hourly':
        result = await anomalyDetectionService.detectHourlySalesAnomalies(params);
        break;

      case 'full_pipeline':
        const dailyForecast = await salesForecastService.generateDailySalesForecasts(params);
        const hourlyForecast = await salesForecastService.generateHourlySalesForecasts(params);
        const demandForecast = await demandForecastService.generateProductDemandForecasts(params);
        const dailyAnomalies = await anomalyDetectionService.detectDailySalesAnomalies(params);
        const hourlyAnomalies = await anomalyDetectionService.detectHourlySalesAnomalies(params);
        
        result = {
          dailyForecast: dailyForecast.summary,
          hourlyForecast: hourlyForecast.summary,
          demandForecast: demandForecast.summary,
          dailyAnomalies: dailyAnomalies.summary,
          hourlyAnomalies: hourlyAnomalies.summary
        };
        break;

      default:
        throw new Error(`Unknown job type: ${type}`);
    }

    // Update job as successful
    await prisma.aIJob.update({
      where: { id: job.id },
      data: {
        status: 'success',
        result: result.summary || result,
        finishedAt: new Date()
      }
    });

    return { jobId: job.id, status: 'success', result };

  } catch (error) {
    // Update job as failed
    await prisma.aIJob.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        error: error.message,
        finishedAt: new Date()
      }
    });

    throw error;
  }
}

/**
 * Get job status and history.
 */
export async function getJobs(options = {}) {
  const { type, status, limit = 20 } = options;

  const where = {};
  if (type) where.type = type;
  if (status) where.status = status;

  return prisma.aIJob.findMany({
    where,
    orderBy: { startedAt: 'desc' },
    take: limit
  });
}

/**
 * Get a specific job by ID.
 */
export async function getJob(jobId) {
  return prisma.aIJob.findUnique({
    where: { id: jobId }
  });
}