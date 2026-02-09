import * as analyticsService from '../services/analytics.service.js';

/**
 * Parse date range from query params with defaults
 * @param {Object} query - Express request query
 * @returns {{ startDate: Date, endDate: Date }}
 */
function parseDateRange(query) {
  const now = new Date();
  
  // Default: last 30 days
  const defaultEndDate = new Date(now);
  defaultEndDate.setHours(23, 59, 59, 999);
  
  const defaultStartDate = new Date(now);
  defaultStartDate.setDate(defaultStartDate.getDate() - 30);
  defaultStartDate.setHours(0, 0, 0, 0);
  
  const startDate = query.startDate 
    ? new Date(query.startDate + 'T00:00:00.000Z') 
    : defaultStartDate;
  
  const endDate = query.endDate 
    ? new Date(query.endDate + 'T23:59:59.999Z') 
    : defaultEndDate;
  
  return { startDate, endDate };
}

/**
 * GET /api/admin/analytics/consumption
 * Returns daily ingredient consumption data
 */
export async function getConsumption(req, res) {
  try {
    const { startDate, endDate } = parseDateRange(req.query);
    const data = await analyticsService.getDailyIngredientConsumption({ startDate, endDate });
    
    res.json({
      success: true,
      dateRange: { 
        start: startDate.toISOString().split('T')[0], 
        end: endDate.toISOString().split('T')[0] 
      },
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Analytics consumption error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch consumption analytics' });
  }
}

/**
 * GET /api/admin/analytics/waste
 * Returns daily waste per ingredient
 */
export async function getWaste(req, res) {
  try {
    const { startDate, endDate } = parseDateRange(req.query);
    const { summary } = req.query;
    
    let data;
    if (summary === 'true') {
      data = await analyticsService.getWasteSummaryByIngredient({ startDate, endDate });
    } else {
      data = await analyticsService.getDailyWasteByIngredient({ startDate, endDate });
    }
    
    res.json({
      success: true,
      dateRange: { 
        start: startDate.toISOString().split('T')[0], 
        end: endDate.toISOString().split('T')[0] 
      },
      aggregation: summary === 'true' ? 'summary' : 'daily',
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Analytics waste error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch waste analytics' });
  }
}

/**
 * GET /api/admin/analytics/sales-timeseries
 * Returns hourly sales volume per product
 */
export async function getSalesTimeseries(req, res) {
  try {
    const { startDate, endDate } = parseDateRange(req.query);
    const { pattern } = req.query;
    
    let data;
    let dataType;
    
    if (pattern === 'true') {
      // Return aggregated hourly pattern (averages across days)
      data = await analyticsService.getHourlySalesPattern({ startDate, endDate });
      dataType = 'hourly_pattern';
    } else {
      // Return detailed timeseries
      data = await analyticsService.getHourlySalesTimeseries({ startDate, endDate });
      dataType = 'timeseries';
    }
    
    res.json({
      success: true,
      dateRange: { 
        start: startDate.toISOString().split('T')[0], 
        end: endDate.toISOString().split('T')[0] 
      },
      dataType,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Analytics sales timeseries error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sales timeseries' });
  }
}

/**
 * GET /api/admin/analytics/prep-time
 * Returns prep time statistics per kitchen station
 */
export async function getPrepTime(req, res) {
  try {
    const { startDate, endDate } = parseDateRange(req.query);
    const { groupBy } = req.query; // 'station' | 'product' | 'timeseries'
    
    let data;
    let dataType;
    
    switch (groupBy) {
      case 'product':
        data = await analyticsService.getPrepTimeByProduct({ startDate, endDate });
        dataType = 'by_product';
        break;
      case 'timeseries':
        data = await analyticsService.getPrepTimeByStation({ startDate, endDate });
        dataType = 'timeseries';
        break;
      case 'station':
      default:
        data = await analyticsService.getPrepTimeStats({ startDate, endDate });
        dataType = 'by_station';
        break;
    }
    
    res.json({
      success: true,
      dateRange: { 
        start: startDate.toISOString().split('T')[0], 
        end: endDate.toISOString().split('T')[0] 
      },
      dataType,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Analytics prep time error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch prep time analytics' });
  }
}

/**
 * GET /api/admin/analytics/daily-summary
 * Returns daily sales summary
 */
export async function getDailySummary(req, res) {
  try {
    const { startDate, endDate } = parseDateRange(req.query);
    const data = await analyticsService.getDailySalesSummary({ startDate, endDate });
    
    res.json({
      success: true,
      dateRange: { 
        start: startDate.toISOString().split('T')[0], 
        end: endDate.toISOString().split('T')[0] 
      },
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Analytics daily summary error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch daily summary' });
  }
}

/**
 * GET /api/admin/analytics/export
 * Returns full analytics export for ML training
 */
export async function getFullExport(req, res) {
  try {
    const { startDate, endDate } = parseDateRange(req.query);
    const data = await analyticsService.getFullAnalyticsExport({ startDate, endDate });
    
    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error('Analytics export error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate analytics export' });
  }
}

export default {
  getConsumption,
  getWaste,
  getSalesTimeseries,
  getPrepTime,
  getDailySummary,
  getFullExport
};
