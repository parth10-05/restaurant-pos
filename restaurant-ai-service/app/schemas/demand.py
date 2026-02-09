"""
Demand Forecasting Pydantic schemas
"""
from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field

from .common import (
    IngredientConsumption,
    RequestContext,
    Trend,
    ConfidenceBand,
)


class DemandForecastRequest(BaseModel):
    """Request payload for demand forecasting"""
    consumption_history: List[IngredientConsumption] = Field(
        ..., 
        min_length=7,
        description="Historical consumption data (minimum 7 days)"
    )
    context: RequestContext
    forecast_days: int = Field(
        default=7,
        ge=1,
        le=30,
        description="Number of days to forecast"
    )
    ingredient_ids: Optional[List[str]] = Field(
        default=None,
        description="Specific ingredients to forecast (None = all)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "consumption_history": [
                    {"ingredient_id": "ing_tomato_001", "date": "2026-02-01", "quantity_used": 5.5, "unit": "kg"},
                    {"ingredient_id": "ing_tomato_001", "date": "2026-02-02", "quantity_used": 6.2, "unit": "kg"},
                    {"ingredient_id": "ing_tomato_001", "date": "2026-02-03", "quantity_used": 4.8, "unit": "kg"},
                ],
                "context": {
                    "date_range": {"start": "2026-02-01", "end": "2026-02-09"},
                    "seasonality_flags": ["weekday"],
                    "restaurant_metadata": {"avg_orders_per_day": 150}
                },
                "forecast_days": 7
            }
        }


class DailyForecast(BaseModel):
    """Single day forecast"""
    date: date
    predicted_usage: float = Field(..., ge=0)
    lower_bound: float = Field(..., ge=0)
    upper_bound: float = Field(..., ge=0)
    is_spike: bool = Field(default=False, description="Flagged as demand spike")
    is_drop: bool = Field(default=False, description="Flagged as abnormal drop")


class SeasonalityFactor(BaseModel):
    """Seasonality contribution to forecast"""
    factor_type: str  # "weekly", "monthly", "custom"
    strength: float = Field(..., ge=0, le=1, description="Normalized strength")
    peak_day: Optional[str] = None  # e.g., "Saturday"
    description: str


class DemandExplanation(BaseModel):
    """Explainability for demand forecast"""
    dominant_seasonality: List[SeasonalityFactor]
    recent_trend_direction: Trend
    trend_strength: float = Field(..., ge=0, le=1, description="How strong the trend is")
    confidence_score: float = Field(..., ge=0, le=1)
    model_used: str = Field(..., description="Prophet or ARIMA")
    data_quality_notes: List[str] = Field(default_factory=list)


class IngredientForecast(BaseModel):
    """Complete forecast for one ingredient"""
    ingredient_id: str
    unit: str
    predicted_daily_usage: List[DailyForecast]
    confidence_band: List[ConfidenceBand]
    trend: Trend
    total_predicted: float = Field(..., description="Sum of predicted usage")
    avg_daily_predicted: float
    explanation: DemandExplanation


class DemandForecastResponse(BaseModel):
    """Response for demand forecasting endpoint"""
    success: bool = True
    request_id: str
    forecast_period: dict = Field(..., description="Start and end dates")
    forecasts: List[IngredientForecast]
    warnings: List[str] = Field(default_factory=list)
    processing_time_ms: float

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "request_id": "req_abc123",
                "forecast_period": {"start": "2026-02-10", "end": "2026-02-16"},
                "forecasts": [{
                    "ingredient_id": "ing_tomato_001",
                    "unit": "kg",
                    "predicted_daily_usage": [
                        {"date": "2026-02-10", "predicted_usage": 5.8, "lower_bound": 4.5, "upper_bound": 7.2, "is_spike": False, "is_drop": False}
                    ],
                    "confidence_band": [
                        {"date": "2026-02-10", "lower": 4.5, "mean": 5.8, "upper": 7.2}
                    ],
                    "trend": "STABLE",
                    "total_predicted": 40.6,
                    "avg_daily_predicted": 5.8,
                    "explanation": {
                        "dominant_seasonality": [{"factor_type": "weekly", "strength": 0.7, "peak_day": "Saturday", "description": "Weekend spike pattern"}],
                        "recent_trend_direction": "STABLE",
                        "trend_strength": 0.2,
                        "confidence_score": 0.85,
                        "model_used": "Prophet",
                        "data_quality_notes": []
                    }
                }],
                "warnings": [],
                "processing_time_ms": 245.3
            }
        }
