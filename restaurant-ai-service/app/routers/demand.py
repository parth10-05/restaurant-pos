"""
Demand Forecasting Router
POST /predict/demand
"""
import time
import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends

from app.schemas.demand import DemandForecastRequest, DemandForecastResponse
from app.schemas.common import APIError
from app.services.demand_forecasting import DemandForecastingService, get_demand_service
from app.utils.logging import log_prediction_request, log_prediction_result, log_error
from app.utils.cache import generate_cache_key, get_cached, set_cached

router = APIRouter(prefix="/predict", tags=["Demand Forecasting"])


@router.post(
    "/demand",
    response_model=DemandForecastResponse,
    responses={
        400: {"model": APIError, "description": "Invalid request"},
        500: {"model": APIError, "description": "Prediction failed"},
    },
    summary="Forecast ingredient demand",
    description="""
    Generate multi-day demand forecasts at the ingredient level.
    
    **Features:**
    - Multi-model forecasting (Prophet primary, ARIMA fallback)
    - Ingredient-level granularity
    - Confidence intervals with bounds
    - Anomaly detection (spikes/drops)
    - Explainability with seasonality factors
    
    **Required Data:**
    - Minimum 7 days of consumption history
    - Date range context
    
    **Response includes:**
    - Daily predicted usage per ingredient
    - Confidence bands (lower/mean/upper)
    - Trend direction (UP/DOWN/STABLE)
    - Human-readable explanation
    """
)
async def forecast_demand(
    request: DemandForecastRequest,
    service: DemandForecastingService = Depends(get_demand_service)
) -> DemandForecastResponse:
    """
    Generate demand forecasts for ingredients
    """
    request_id = f"req_{uuid.uuid4().hex[:12]}"
    start_time = time.time()
    
    # Log request
    log_prediction_request(
        endpoint="/predict/demand",
        request_id=request_id,
        input_summary={
            "consumption_records": len(request.consumption_history),
            "forecast_days": request.forecast_days,
            "date_range": f"{request.context.date_range.start} to {request.context.date_range.end}"
        }
    )
    
    # Check cache
    cache_key = generate_cache_key("demand", request)
    cached_result = get_cached(cache_key)
    if cached_result is not None:
        cached_result.request_id = request_id  # Update request ID
        return cached_result
    
    try:
        # Validate minimum data
        if len(request.consumption_history) < 7:
            raise HTTPException(
                status_code=400,
                detail="Minimum 7 days of consumption history required"
            )
        
        # Run forecast
        forecasts = service.forecast(
            consumption_history=request.consumption_history,
            context=request.context,
            forecast_days=request.forecast_days,
            ingredient_ids=request.ingredient_ids
        )
        
        # Calculate processing time
        processing_time_ms = (time.time() - start_time) * 1000
        
        # Build response
        warnings = []
        if len(request.consumption_history) < 14:
            warnings.append("Limited historical data may affect forecast accuracy")
        
        # Determine forecast period
        last_date = max(r.date for r in request.consumption_history)
        forecast_start = last_date
        forecast_end = last_date
        
        if forecasts and forecasts[0].predicted_daily_usage:
            forecast_start = forecasts[0].predicted_daily_usage[0].date
            forecast_end = forecasts[0].predicted_daily_usage[-1].date
        
        response = DemandForecastResponse(
            success=True,
            request_id=request_id,
            forecast_period={
                "start": str(forecast_start),
                "end": str(forecast_end)
            },
            forecasts=forecasts,
            warnings=warnings,
            processing_time_ms=round(processing_time_ms, 2)
        )
        
        # Cache result
        set_cached(cache_key, response)
        
        # Log result
        log_prediction_result(
            endpoint="/predict/demand",
            request_id=request_id,
            output_summary={
                "ingredients_forecasted": len(forecasts),
                "forecast_days": request.forecast_days
            },
            processing_time_ms=processing_time_ms
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        log_error(
            context="demand_forecast",
            error=e,
            extra={"request_id": request_id}
        )
        raise HTTPException(
            status_code=500,
            detail=f"Forecast generation failed: {str(e)}"
        )
