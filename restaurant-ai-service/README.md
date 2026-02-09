# Restaurant AI Microservice

Production-grade AI microservice for restaurant POS analytics, built with FastAPI and Python.

## Features

### 🔮 Demand Forecasting
- **Multi-model approach**: Prophet (primary) with ARIMA fallback
- **Anomaly detection**: Identifies demand spikes and drops
- **Seasonality analysis**: Daily, weekly, and monthly patterns
- **Confidence intervals**: Statistical confidence bounds on predictions

### ⚠️ Waste Risk Scoring
- **Multi-factor assessment**: Analyzes consumption patterns, expiration dates, seasonality
- **ML-powered scoring**: Gradient boosting model with rule-based fallback
- **Actionable recommendations**: Prioritized suggestions to reduce waste
- **Risk classification**: LOW / MEDIUM / HIGH with probability scores

### 📊 Inventory Simulation
- **What-if analysis**: Test scenarios before implementation
- **Stockout prediction**: Probability and estimated dates
- **Waste forecasting**: Project waste under different conditions
- **Scenario types**: Demand changes, promotions, supplier delays

## Tech Stack

- **Framework**: FastAPI 0.109+
- **ML Libraries**: Prophet 1.1.5, statsmodels 0.14.1, scikit-learn 1.4.0
- **Data Processing**: pandas 2.1.4, numpy 1.26.3
- **Validation**: Pydantic 2.5+
- **Logging**: structlog
- **Caching**: cachetools (in-memory TTL cache)

## Quick Start

### Prerequisites
- Python 3.10+
- pip or poetry

### Installation

```bash
# Clone and navigate to the service
cd restaurant-ai-service

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Running Locally

```bash
# Development mode with hot reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or run directly
python -m app.main
```

### Using Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Development mode with hot reload
docker-compose --profile development up ai-service-dev

# View logs
docker-compose logs -f ai-service
```

## API Endpoints

### Health Checks
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Basic health status |
| `/health/ready` | GET | Kubernetes readiness probe |
| `/health/live` | GET | Kubernetes liveness probe |

### Prediction APIs

#### POST `/api/v1/predict/demand`
Generate demand forecasts for ingredients.

```json
{
  "consumption_history": [
    {
      "ingredient_id": "ing_001",
      "date": "2024-01-15",
      "quantity_used": 45.5,
      "unit": "kg"
    }
  ],
  "context": {
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    }
  },
  "forecast_days": 14,
  "model_preference": "auto"
}
```

#### POST `/api/v1/predict/waste-risk`
Calculate waste risk scores for inventory items.

```json
{
  "consumption_history": [...],
  "waste_history": [
    {
      "ingredient_id": "ing_001",
      "date": "2024-01-15",
      "quantity_wasted": 2.5,
      "reason": "expired"
    }
  ],
  "current_inventory": [
    {
      "ingredient_id": "ing_001",
      "current_stock": 100.0,
      "expiration_date": "2024-02-15",
      "unit_cost": 5.50
    }
  ]
}
```

#### POST `/api/v1/simulate/inventory`
Run what-if inventory simulations.

```json
{
  "consumption_history": [...],
  "waste_history": [...],
  "current_inventory": [...],
  "scenarios": [
    {
      "name": "Festival Weekend",
      "scenario_type": "increased_demand",
      "modifier": 1.5
    }
  ],
  "simulation_days": 14
}
```

## Configuration

Environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `ENVIRONMENT` | development | Environment mode |
| `HOST` | 0.0.0.0 | Server host |
| `PORT` | 8000 | Server port |
| `CORS_ORIGINS` | * | Allowed CORS origins |
| `FORECAST_HORIZON_DAYS` | 30 | Default forecast period |
| `CONFIDENCE_LEVEL` | 0.95 | Prediction confidence |
| `CACHE_TTL_SECONDS` | 3600 | Cache expiration |

## Project Structure

```
restaurant-ai-service/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Settings & configuration
│   ├── routers/
│   │   ├── demand.py        # Demand forecasting endpoint
│   │   ├── waste.py         # Waste risk endpoint
│   │   └── simulation.py    # Simulation endpoint
│   ├── schemas/
│   │   ├── common.py        # Shared schemas
│   │   ├── demand.py        # Demand request/response
│   │   ├── waste.py         # Waste request/response
│   │   └── simulation.py    # Simulation request/response
│   ├── services/
│   │   ├── demand_forecasting.py
│   │   ├── waste_risk.py
│   │   └── inventory_simulation.py
│   └── utils/
│       ├── cache.py         # TTL caching
│       └── logging.py       # Structured logging
├── tests/
│   └── ...
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## Integration with Node.js Backend

Call the AI service from your Express backend:

```javascript
// services/ai.service.js
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function getDemandForecast(data) {
  const response = await axios.post(
    `${AI_SERVICE_URL}/api/v1/predict/demand`,
    data,
    { timeout: 30000 }
  );
  return response.data;
}

export async function getWasteRisk(data) {
  const response = await axios.post(
    `${AI_SERVICE_URL}/api/v1/predict/waste-risk`,
    data,
    { timeout: 30000 }
  );
  return response.data;
}

export async function simulateInventory(data) {
  const response = await axios.post(
    `${AI_SERVICE_URL}/api/v1/simulate/inventory`,
    data,
    { timeout: 60000 }
  );
  return response.data;
}
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_demand.py -v
```

## API Documentation

When running in development mode:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

## Performance

- **Response times**: < 500ms for most predictions
- **Caching**: In-memory TTL cache reduces redundant computations
- **Concurrent requests**: Async FastAPI handles multiple requests efficiently

## License

MIT
