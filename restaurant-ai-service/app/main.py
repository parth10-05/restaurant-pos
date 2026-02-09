"""
Restaurant AI Microservice - Main FastAPI Application

Production-grade AI microservice providing:
- Demand Forecasting (Prophet/ARIMA)
- Waste Risk Scoring
- Inventory Simulation & What-If Analysis
"""
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import demand_router, waste_router, simulation_router
from app.utils.logging import get_logger

logger = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events
    """
    # Startup
    logger.info(
        "application_starting",
        environment=settings.environment,
        host=settings.host,
        port=settings.port
    )
    
    # Pre-warm models if needed
    logger.info("models_ready", status="initialized")
    
    yield
    
    # Shutdown
    logger.info("application_shutting_down")


# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="""
## Restaurant AI Microservice

Advanced AI-powered analytics for restaurant POS systems.

### Features

**🔮 Demand Forecasting**
- Time-series forecasting with Prophet and ARIMA
- Anomaly detection for demand spikes/drops
- Seasonality analysis (daily, weekly, monthly)
- Confidence intervals for predictions

**⚠️ Waste Risk Scoring**
- Multi-factor risk assessment
- Gradient boosting model with rule-based fallback
- Actionable recommendations
- Expiration date tracking

**📊 Inventory Simulation**
- What-if scenario analysis
- Stockout risk projection
- Waste forecasting
- Menu promotion impact analysis

### Authentication

All endpoints require API key authentication via `X-API-Key` header.

### Rate Limits

- Standard tier: 100 requests/minute
- Premium tier: 1000 requests/minute
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
    openapi_url="/openapi.json" if settings.environment != "production" else "/api/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Processing-Time-Ms"]
)


# Request timing middleware
@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    """Add processing time header to responses"""
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    response.headers["X-Processing-Time-Ms"] = f"{process_time:.2f}"
    return response


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    request_id = request.headers.get("X-Request-ID", f"auto_{int(time.time() * 1000)}")
    
    logger.info(
        "request_received",
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        client_ip=request.client.host if request.client else "unknown"
    )
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    logger.info(
        "request_completed",
        request_id=request_id,
        status_code=response.status_code
    )
    
    return response


# Include routers
app.include_router(demand_router, prefix="/api/v1")
app.include_router(waste_router, prefix="/api/v1")
app.include_router(simulation_router, prefix="/api/v1")


# Health check endpoints
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Basic health check endpoint
    """
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": "1.0.0",
        "environment": settings.environment
    }


@app.get("/health/ready", tags=["Health"])
async def readiness_check():
    """
    Kubernetes-style readiness probe
    """
    # Check if models are ready
    models_ready = True  # Add actual model checks here
    
    if not models_ready:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "reason": "models_initializing"}
        )
    
    return {
        "status": "ready",
        "checks": {
            "models": "ready",
            "cache": "ready"
        }
    }


@app.get("/health/live", tags=["Health"])
async def liveness_check():
    """
    Kubernetes-style liveness probe
    """
    return {"status": "alive"}


# API info endpoint
@app.get("/api/v1/info", tags=["Info"])
async def api_info():
    """
    Get API information and available endpoints
    """
    return {
        "service": settings.app_name,
        "version": "1.0.0",
        "environment": settings.environment,
        "endpoints": {
            "demand_forecasting": {
                "path": "/api/v1/predict/demand",
                "method": "POST",
                "description": "Generate demand forecasts using Prophet/ARIMA"
            },
            "waste_risk": {
                "path": "/api/v1/predict/waste-risk",
                "method": "POST",
                "description": "Calculate waste risk scores for ingredients"
            },
            "inventory_simulation": {
                "path": "/api/v1/simulate/inventory",
                "method": "POST",
                "description": "Run what-if inventory simulations"
            }
        },
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc",
            "openapi": "/openapi.json"
        }
    }


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all exception handler
    """
    logger.error(
        "unhandled_exception",
        error=str(exc),
        path=request.url.path,
        method=request.method
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "An unexpected error occurred",
            "detail": str(exc) if settings.environment != "production" else None
        }
    )


# Run with uvicorn directly
if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
        workers=1 if settings.environment == "development" else 4,
        log_level="debug" if settings.environment == "development" else "info"
    )
