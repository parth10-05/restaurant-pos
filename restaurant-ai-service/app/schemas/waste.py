"""
Waste Risk Scoring Pydantic schemas
"""
from typing import List, Optional
from pydantic import BaseModel, Field

from .common import (
    IngredientConsumption,
    WasteRecord,
    RequestContext,
    RiskLevel,
    ContributingFactor,
)


class IngredientProfile(BaseModel):
    """Profile data for an ingredient"""
    ingredient_id: str
    name: Optional[str] = None
    shelf_life_days: Optional[int] = Field(default=None, ge=1)
    typical_order_size: Optional[float] = None
    unit: str


class WasteRiskRequest(BaseModel):
    """Request payload for waste risk scoring"""
    consumption_history: List[IngredientConsumption] = Field(
        ...,
        min_length=7,
        description="Historical consumption data"
    )
    waste_history: List[WasteRecord] = Field(
        default_factory=list,
        description="Historical waste events"
    )
    ingredient_profiles: List[IngredientProfile] = Field(
        default_factory=list,
        description="Optional ingredient metadata"
    )
    context: RequestContext
    current_stock_levels: Optional[dict] = Field(
        default=None,
        description="Current stock by ingredient_id"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "consumption_history": [
                    {"ingredient_id": "ing_lettuce_001", "date": "2026-02-01", "quantity_used": 3.0, "unit": "kg"},
                    {"ingredient_id": "ing_lettuce_001", "date": "2026-02-02", "quantity_used": 2.5, "unit": "kg"},
                ],
                "waste_history": [
                    {"ingredient_id": "ing_lettuce_001", "date": "2026-02-03", "quantity_wasted": 0.8, "reason": "spoilage"}
                ],
                "ingredient_profiles": [
                    {"ingredient_id": "ing_lettuce_001", "name": "Romaine Lettuce", "shelf_life_days": 5, "unit": "kg"}
                ],
                "context": {
                    "date_range": {"start": "2026-02-01", "end": "2026-02-09"},
                    "seasonality_flags": ["weekday"]
                },
                "current_stock_levels": {"ing_lettuce_001": 15.0}
            }
        }


class RecommendedAction(BaseModel):
    """Actionable recommendation"""
    action_type: str = Field(..., description="reduce_purchase | promote_menu | use_first | increase_monitoring")
    priority: str = Field(..., description="HIGH | MEDIUM | LOW")
    description: str
    estimated_impact: Optional[str] = None


class IngredientWasteRisk(BaseModel):
    """Waste risk assessment for one ingredient"""
    ingredient_id: str
    ingredient_name: Optional[str] = None
    waste_risk_score: float = Field(..., ge=0, le=1, description="Risk score 0-1")
    risk_level: RiskLevel
    contributing_factors: List[ContributingFactor]
    historical_waste_ratio: float = Field(..., ge=0, description="Waste / Total used")
    demand_volatility: float = Field(..., ge=0, description="Coefficient of variation")
    days_until_concern: Optional[int] = Field(default=None, description="Estimated days until stock risk")
    recommended_actions: List[RecommendedAction]
    model_confidence: float = Field(..., ge=0, le=1)
    model_used: str = Field(..., description="gradient_boost | linear | rule_based")


class WasteRiskResponse(BaseModel):
    """Response for waste risk scoring endpoint"""
    success: bool = True
    request_id: str
    analysis_period: dict = Field(..., description="Date range analyzed")
    risk_assessments: List[IngredientWasteRisk]
    summary: dict = Field(..., description="Aggregate stats")
    warnings: List[str] = Field(default_factory=list)
    processing_time_ms: float

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "request_id": "req_xyz789",
                "analysis_period": {"start": "2026-02-01", "end": "2026-02-09"},
                "risk_assessments": [{
                    "ingredient_id": "ing_lettuce_001",
                    "ingredient_name": "Romaine Lettuce",
                    "waste_risk_score": 0.72,
                    "risk_level": "HIGH",
                    "contributing_factors": [
                        {"factor_name": "historical_waste_ratio", "contribution": 0.35, "description": "High historical spoilage rate (12%)"},
                        {"factor_name": "shelf_life", "contribution": 0.25, "description": "Short shelf life (5 days)"},
                        {"factor_name": "overstock_signal", "contribution": 0.12, "description": "Current stock 2x avg daily usage"}
                    ],
                    "historical_waste_ratio": 0.12,
                    "demand_volatility": 0.28,
                    "days_until_concern": 3,
                    "recommended_actions": [
                        {"action_type": "promote_menu", "priority": "HIGH", "description": "Feature salad items in daily specials", "estimated_impact": "Could reduce waste by 30%"},
                        {"action_type": "reduce_purchase", "priority": "MEDIUM", "description": "Reduce next order by 25%"}
                    ],
                    "model_confidence": 0.82,
                    "model_used": "gradient_boost"
                }],
                "summary": {
                    "total_ingredients_analyzed": 1,
                    "high_risk_count": 1,
                    "medium_risk_count": 0,
                    "low_risk_count": 0,
                    "avg_risk_score": 0.72
                },
                "warnings": [],
                "processing_time_ms": 156.7
            }
        }
