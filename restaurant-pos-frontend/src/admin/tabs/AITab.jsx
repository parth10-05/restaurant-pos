import { useState, useEffect, useCallback } from 'react';
import { aiService } from '../../services/ai.service';

export default function AITab() {
  const [health, setHealth] = useState(null);
  const [forecasts, setForecasts] = useState([]);
  const [wasteRisks, setWasteRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [forecastDays, setForecastDays] = useState(7);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check health first
      const healthResult = await aiService.checkHealth();
      setHealth(healthResult);

      if (!healthResult.success) {
        setError('AI service is not available');
        setLoading(false);
        return;
      }

      // Load forecasts and waste risks in parallel
      const [forecastResult, wasteResult] = await Promise.all([
        aiService.getForecast({ days: forecastDays }),
        aiService.getWasteRisk()
      ]);

      if (forecastResult.success) {
        setForecasts(forecastResult.data?.forecasts || []);
      }

      if (wasteResult.success) {
        setWasteRisks(wasteResult.data?.risks || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [forecastDays]);

  // Load initial data
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function refreshForecast() {
    setLoading(true);
    try {
      const result = await aiService.getForecast({ days: forecastDays });
      if (result.success) {
        setForecasts(result.data?.forecasts || []);
      } else {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  }

  // Health status indicator
  function HealthStatus({ health }) {
    if (!health) return null;
    
    const isHealthy = health.success && health.data?.status === 'healthy';
    
    return (
      <div className={`p-4 rounded-lg ${isHealthy ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'} border`}>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="font-semibold">
            AI Service: {isHealthy ? 'Online' : 'Offline'}
          </span>
        </div>
        {health.data?.version && (
          <p className="text-sm text-gray-600 mt-1">Version: {health.data.version}</p>
        )}
      </div>
    );
  }

  // Forecast card component
  function ForecastCard({ forecast }) {
    const { ingredientId, ingredientName, totalPredicted, avgDailyPredicted, modelConfidence, trend, unit, modelUsed } = forecast;
    
    const trendColors = {
      UP: 'text-green-600',
      DOWN: 'text-red-600',
      STABLE: 'text-gray-600',
      increasing: 'text-green-600',
      decreasing: 'text-red-600',
      stable: 'text-gray-600'
    };
    
    const trendIcons = {
      UP: '↑',
      DOWN: '↓',
      STABLE: '→',
      increasing: '↑',
      decreasing: '↓',
      stable: '→'
    };

    // Display the actual ingredient name or a truncated ID
    const displayName = ingredientName?.length === 36 
      ? `Ingredient ${ingredientId?.substring(0, 8)}...` 
      : (ingredientName || 'Unknown');

    return (
      <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="font-semibold text-lg">{displayName}</h3>
        <div className="mt-2 space-y-1">
          <p className="text-2xl font-bold text-blue-600">
            {Math.round(totalPredicted || 0)} {unit || 'units'}
          </p>
          <p className="text-sm text-gray-500">
            Predicted demand for next {forecastDays} days
          </p>
          <p className="text-xs text-gray-400">
            ~{(avgDailyPredicted || 0).toFixed(1)} {unit}/day • Model: {modelUsed || 'auto'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`${trendColors[trend] || trendColors.STABLE}`}>
              {trendIcons[trend] || trendIcons.STABLE} {trend?.toLowerCase() || 'stable'}
            </span>
            <span className="text-sm text-gray-500">
              ({Math.round((modelConfidence || 0) * 100)}% confidence)
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Waste risk card component
  function WasteRiskCard({ risk }) {
    const { ingredientName, riskScore, riskLevel, contributingFactors, recommendations } = risk;
    const level = (riskLevel || '').toLowerCase() || (riskScore >= 0.7 ? 'high' : riskScore >= 0.4 ? 'medium' : 'low');
    
    const riskColors = {
      high: 'bg-red-100 border-red-500 text-red-700',
      medium: 'bg-yellow-100 border-yellow-500 text-yellow-700',
      low: 'bg-green-100 border-green-500 text-green-700'
    };
    
    const riskLabels = {
      high: 'High Risk',
      medium: 'Medium Risk',
      low: 'Low Risk'
    };

    return (
      <div className={`p-4 rounded-lg shadow border ${riskColors[level]}`}>
        <div className="flex justify-between items-start">
          <h3 className="font-semibold">{ingredientName || 'Unknown'}</h3>
          <span className="text-xs font-bold uppercase">{riskLabels[level]}</span>
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${level === 'high' ? 'bg-red-500' : level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${(riskScore || 0) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm mt-2">{Math.round((riskScore || 0) * 100)}% waste risk</p>
        </div>
        {contributingFactors && contributingFactors.length > 0 && (
          <div className="mt-2 text-xs">
            <p className="font-medium">Risk factors:</p>
            <ul className="list-disc list-inside">
              {contributingFactors.slice(0, 3).map((factor, i) => (
                <li key={i}>{factor.description || factor.factor_name}</li>
              ))}
            </ul>
          </div>
        )}
        {recommendations && recommendations.length > 0 && (
          <div className="mt-2 text-xs">
            <p className="font-medium">Recommendations:</p>
            <ul className="list-disc list-inside">
              {recommendations.slice(0, 2).map((rec, i) => (
                <li key={i}>{rec.description}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Navigation tabs
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'forecast', label: 'Demand Forecast' },
    { id: 'waste', label: 'Waste Risk' },
    { id: 'simulate', label: 'Simulation' }
  ];

  if (loading && !health) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading AI Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AI Predictions</h1>
        <button
          onClick={loadDashboard}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Health Status */}
      <HealthStatus health={health} />

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-500 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 mt-6 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`px-4 py-2 border-b-2 ${
              activeSection === tab.id 
                ? 'border-blue-500 text-blue-600 font-semibold' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <div className="mt-6">
        {/* Dashboard Section */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow border">
                <h3 className="font-semibold text-gray-500">Total Forecasts</h3>
                <p className="text-3xl font-bold">{forecasts.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border">
                <h3 className="font-semibold text-gray-500">High Risk Items</h3>
                <p className="text-3xl font-bold text-red-600">
                  {wasteRisks.filter(r => r.risk_score >= 0.7).length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border">
                <h3 className="font-semibold text-gray-500">AI Service Status</h3>
                <p className="text-xl font-bold text-green-600">
                  {health?.data?.status === 'healthy' ? 'Operational' : 'Down'}
                </p>
              </div>
            </div>

            {/* Quick insights */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-semibold text-lg mb-4">Quick Insights</h2>
              {forecasts.length === 0 && wasteRisks.length === 0 ? (
                <p className="text-gray-500">No data available. Please ensure you have historical sales data.</p>
              ) : (
                <div className="space-y-2">
                  {wasteRisks.filter(r => r.risk_score >= 0.7).slice(0, 3).map((risk, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                      <span className="text-red-500">⚠️</span>
                      <span>{risk.ingredient?.name} has high waste risk ({Math.round(risk.risk_score * 100)}%)</span>
                    </div>
                  ))}
                  {forecasts.filter(f => f.trend === 'increasing').slice(0, 3).map((forecast, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <span className="text-green-500">📈</span>
                      <span>{forecast.ingredient?.name} demand is increasing</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Forecast Section */}
        {activeSection === 'forecast' && (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <label className="font-medium">Forecast Days:</label>
              <select
                value={forecastDays}
                onChange={(e) => setForecastDays(Number(e.target.value))}
                className="border rounded px-3 py-2"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
              <button
                onClick={refreshForecast}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Update Forecast
              </button>
            </div>

            {forecasts.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded">
                <p className="text-gray-500">No forecast data available.</p>
                <p className="text-sm text-gray-400 mt-2">
                  AI requires historical sales data to generate predictions.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {forecasts.map((forecast, i) => (
                  <ForecastCard key={i} forecast={forecast} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Waste Risk Section */}
        {activeSection === 'waste' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Ingredient Waste Risk Analysis</h2>
            
            {wasteRisks.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded">
                <p className="text-gray-500">No waste risk data available.</p>
                <p className="text-sm text-gray-400 mt-2">
                  AI requires inventory and consumption data to assess waste risk.
                </p>
              </div>
            ) : (
              <>
                {/* Risk summary */}
                <div className="flex gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-red-500 rounded"></span>
                    <span>High ({wasteRisks.filter(r => r.risk_score >= 0.7).length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-yellow-500 rounded"></span>
                    <span>Medium ({wasteRisks.filter(r => r.risk_score >= 0.4 && r.risk_score < 0.7).length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-500 rounded"></span>
                    <span>Low ({wasteRisks.filter(r => r.risk_score < 0.4).length})</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wasteRisks
                    .sort((a, b) => b.risk_score - a.risk_score)
                    .map((risk, i) => (
                      <WasteRiskCard key={i} risk={risk} />
                    ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Simulation Section */}
        {activeSection === 'simulate' && (
          <SimulationPanel />
        )}
      </div>
    </div>
  );
}

// Simulation panel as a separate component
function SimulationPanel() {
  const [simulating, setSimulating] = useState(false);
  const [results, setResults] = useState(null);
  const [days, setDays] = useState(14);
  const [demandChange, setDemandChange] = useState(0);

  async function runSimulation() {
    setSimulating(true);
    try {
      const scenarios = [
        {
          name: demandChange === 0 ? 'Baseline' : `${demandChange > 0 ? '+' : ''}${demandChange}% Demand`,
          demand_multiplier: 1 + (demandChange / 100)
        }
      ];

      const result = await aiService.runSimulation({ scenarios, days });
      
      if (result.success) {
        setResults(result.data);
      } else {
        alert('Simulation failed: ' + result.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">What-If Simulation</h2>
      <p className="text-gray-600 mb-4">
        Simulate different demand scenarios to see how your inventory would be affected.
      </p>

      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium mb-1">Simulation Period (days)</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              min={1}
              max={30}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Demand Change (%)</label>
            <input
              type="range"
              value={demandChange}
              onChange={(e) => setDemandChange(Number(e.target.value))}
              min={-50}
              max={50}
              className="w-full"
            />
            <span className="text-sm text-gray-500">
              {demandChange > 0 ? '+' : ''}{demandChange}%
            </span>
          </div>
          <div className="flex items-end">
            <button
              onClick={runSimulation}
              disabled={simulating}
              className="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {simulating ? 'Running...' : 'Run Simulation'}
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Results */}
      {results && results.simulations && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-lg mb-4">Simulation Results</h3>
          {results.simulations.map((sim, i) => (
            <div key={i} className="border-b pb-4 mb-4 last:border-0">
              <h4 className="font-medium">{sim.scenario_name || 'Scenario'}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div>
                  <p className="text-sm text-gray-500">Expected Stockouts</p>
                  <p className="text-xl font-bold text-red-600">{sim.stockout_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Waste Events</p>
                  <p className="text-xl font-bold text-yellow-600">{sim.waste_events || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Service Level</p>
                  <p className="text-xl font-bold text-green-600">
                    {Math.round((sim.service_level || 0) * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Est. Cost Impact</p>
                  <p className="text-xl font-bold">
                    ${(sim.cost_impact || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!results && (
        <div className="text-center py-12 bg-gray-50 rounded">
          <p className="text-gray-500">Configure your scenario and click "Run Simulation" to see results.</p>
        </div>
      )}
    </div>
  );
}
