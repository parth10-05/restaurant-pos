/**
 * Admin AI Routes
 * All routes require admin authentication.
 */

import express from 'express';
import {
  triggerJob,
  listJobs,
  getJobById,
  getSalesForecasts,
  getDemandForecasts,
  getAnomalies,
  getDashboard,
  getPythonAiHealth,
  getPythonForecast,
  getPythonWasteRisk,
  runPythonSimulation,
  getPythonDashboard
} from '../controllers/ai.controller.js';

import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// All routes require admin role
router.use(authMiddleware);
router.use(requireRole('admin'));

/**
 * @route   GET /api/admin/ai/dashboard
 * @desc    Get AI insights summary
 * @access  Admin
 */
router.get('/dashboard', getDashboard);

/**
 * @route   POST /api/admin/ai/jobs/run
 * @desc    Trigger an AI job
 * @access  Admin
 * @body    { type: string, params?: object }
 */
router.post('/jobs/run', triggerJob);

/**
 * @route   GET /api/admin/ai/jobs
 * @desc    List recent AI jobs
 * @access  Admin
 */
router.get('/jobs', listJobs);

/**
 * @route   GET /api/admin/ai/jobs/:id
 * @desc    Get job details
 * @access  Admin
 */
router.get('/jobs/:id', getJobById);

/**
 * @route   GET /api/admin/ai/forecasts/sales
 * @desc    Get sales forecasts
 * @access  Admin
 */
router.get('/forecasts/sales', getSalesForecasts);

/**
 * @route   GET /api/admin/ai/forecasts/demand
 * @desc    Get product demand forecasts
 * @access  Admin
 */
router.get('/forecasts/demand', getDemandForecasts);

/**
 * @route   GET /api/admin/ai/anomalies
 * @desc    Get detected anomalies
 * @access  Admin
 */
router.get('/anomalies', getAnomalies);

// ═══════════════════════════════════════════════════════════════════════
// Python AI Microservice Routes
// ═══════════════════════════════════════════════════════════════════════

/**
 * @route   GET /api/admin/ai/python/health
 * @desc    Check Python AI service health
 * @access  Admin
 */
router.get('/python/health', getPythonAiHealth);

/**
 * @route   GET /api/admin/ai/python/dashboard
 * @desc    Get AI insights summary from Python service
 * @access  Admin
 */
router.get('/python/dashboard', getPythonDashboard);

/**
 * @route   GET /api/admin/ai/python/forecast
 * @desc    Get demand forecast from Python AI service
 * @access  Admin
 * @query   days (default: 7), ingredientIds (comma-separated), model (auto|arima)
 */
router.get('/python/forecast', getPythonForecast);

/**
 * @route   GET /api/admin/ai/python/waste-risk
 * @desc    Get waste risk scores from Python AI service
 * @access  Admin
 */
router.get('/python/waste-risk', getPythonWasteRisk);

/**
 * @route   POST /api/admin/ai/python/simulate
 * @desc    Run inventory simulation
 * @access  Admin
 * @body    { scenarios: Array, days?: number }
 */
router.post('/python/simulate', runPythonSimulation);

export default router;