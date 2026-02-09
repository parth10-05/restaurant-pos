/**
 * AI Job Scheduler
 * Configures cron jobs for automated AI tasks.
 */

import cron from 'node-cron';
import { runJob } from './aiJobRunner.js';

// Store scheduled tasks for cleanup
const scheduledTasks = [];

/**
 * Initialize all scheduled AI jobs.
 */
export function initializeScheduler() {
  console.log('[AI Scheduler] Initializing scheduled jobs...');

  // Daily sales forecast - Run at 2:00 AM every day
  const dailyForecastTask = cron.schedule('0 2 * * *', async () => {
    console.log('[AI Scheduler] Running daily sales forecast...');
    try {
      await runJob('sales_forecast_daily', { days: 7 }, null);
      console.log('[AI Scheduler] Daily sales forecast completed.');
    } catch (error) {
      console.error('[AI Scheduler] Daily sales forecast failed:', error.message);
    }
  }, { timezone: 'Asia/Kolkata' });
  scheduledTasks.push(dailyForecastTask);

  // Hourly sales forecast - Run at 2:15 AM every day
  const hourlyForecastTask = cron.schedule('15 2 * * *', async () => {
    console.log('[AI Scheduler] Running hourly sales forecast...');
    try {
      await runJob('sales_forecast_hourly', { days: 1 }, null);
      console.log('[AI Scheduler] Hourly sales forecast completed.');
    } catch (error) {
      console.error('[AI Scheduler] Hourly sales forecast failed:', error.message);
    }
  }, { timezone: 'Asia/Kolkata' });
  scheduledTasks.push(hourlyForecastTask);

  // Product demand forecast - Run at 2:30 AM every day
  const demandForecastTask = cron.schedule('30 2 * * *', async () => {
    console.log('[AI Scheduler] Running demand forecast...');
    try {
      await runJob('demand_forecast', { days: 7 }, null);
      console.log('[AI Scheduler] Demand forecast completed.');
    } catch (error) {
      console.error('[AI Scheduler] Demand forecast failed:', error.message);
    }
  }, { timezone: 'Asia/Kolkata' });
  scheduledTasks.push(demandForecastTask);

  // Anomaly detection - Run at 3:00 AM every day
  const anomalyTask = cron.schedule('0 3 * * *', async () => {
    console.log('[AI Scheduler] Running anomaly detection...');
    try {
      await runJob('anomaly_daily', {}, null);
      await runJob('anomaly_hourly', {}, null);
      console.log('[AI Scheduler] Anomaly detection completed.');
    } catch (error) {
      console.error('[AI Scheduler] Anomaly detection failed:', error.message);
    }
  }, { timezone: 'Asia/Kolkata' });
  scheduledTasks.push(anomalyTask);

  console.log('[AI Scheduler] All jobs scheduled successfully.');
}

/**
 * Stop all scheduled jobs.
 */
export function stopScheduler() {
  console.log('[AI Scheduler] Stopping all scheduled jobs...');
  scheduledTasks.forEach(task => task.stop());
  scheduledTasks.length = 0;
}