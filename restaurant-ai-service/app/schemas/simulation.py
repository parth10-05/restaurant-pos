"""
Inventory Simulation & What-If Analysis schemas
"""
from datetime import date
from enum import Enum
from typing import List, Optional, Dict
from pydantic import BaseModel, Field

from .common import (
    IngredientConsumption,
    WasteRecord,
    RequestContext,
    RiskLevel,
)


class ScenarioType(str, Enum):
    """Types of simulation scenarios"""
    INCREASED_DEMAND = "increased_demand"
    REDUCED_DEMAND = "reduced_demand"
    REDUCED_PURCHASE = "reduced_purchase"
    INCREASED_PURCHASE = "increased_purchase"
    MENU_PROMOTION = "menu_promotion"
    SUPPLIER_DELAY = "supplier_delay"
    CUSTOM = "custom"


class ScenarioParameter(BaseModel):
    """Parameters defining a scenario"""
    scenario_type: ScenarioType
    affected_ingredient_ids: List[str] = Field(
        default_factory=list,
        description="Empty list = apply to all"
    )
    modifier_percent: float = Field(
        ...,
        ge=-100,
        le=500,
        description="Percentage change (-100 to +500)"
    )
    duration_days: int = Field(default=7, ge=1, le=30)
    start_offset_days: int = Field(
        default=0,
        ge=0,
        description="Days from now to start scenario"
    )
    description: Optional[str] = None


class CurrentInventory(BaseModel):
    """Current inventory state"""
    ingredient_id: str
    current_stock: float = Field(..., ge=0)
    unit: str
    last_purchase_date: Optional[date] = None
    next_purchase_date: Optional[date] = None
    reorder_point: Optional[float] = None


class SimulationRequest(BaseModel):
    """Request payload for inventory simulation"""
    consumption_history: List[IngredientConsumption] = Field(
        ...,
        min_length=7
    )
    waste_history: List[WasteRecord] = Field(default_factory=list)
    current_inventory: List[CurrentInventory]
    scenarios: List[ScenarioParameter] = Field(
        ...,
        min_length=1,
        max_length=5,
        description="Scenarios to simulate (1-5)"
    )
    context: RequestContext
    simulation_days: int = Field(default=14, ge=7, le=30)

    class Config:
        json_schema_extra = {
            "example": {
                "consumption_history": [
                    {"ingredient_id": "ing_chicken_001", "date": "2026-02-01", "quantity_used": 10.0, "unit": "kg"},
                    {"ingredient_id": "ing_chicken_001", "date": "2026-02-02", "quantity_used": 12.0, "unit": "kg"},
                ],
                "waste_history": [
                    {"ingredient_id": "ing_chicken_001", "date": "2026-02-02", "quantity_wasted": 0.5, "reason": "overcooked"}
                ],
                "current_inventory": [
                    {"ingredient_id": "ing_chicken_001", "current_stock": 50.0, "unit": "kg", "reorder_point": 20.0}
                ],
                "scenarios": [
                    {"scenario_type": "increased_demand", "modifier_percent": 30, "duration_days": 7, "description": "Weekend festival"}
                ],
                "context": {
                    "date_range": {"start": "2026-02-01", "end": "2026-02-09"},
                    "seasonality_flags": ["weekend", "festival"]
                },
                "simulation_days": 14
            }
        }


class DailyProjection(BaseModel):
    """Single day inventory projection"""
    date: date
    projected_stock: float
    projected_consumption: float
    projected_waste: float
    cumulative_consumption: float
    cumulative_waste: float
    is_below_reorder: bool = False
    is_stockout: bool = False


class StockoutRisk(BaseModel):
    """Stockout risk assessment"""
    stockout_probability: float = Field(..., ge=0, le=1)
    estimated_stockout_date: Optional[date] = None
    days_until_stockout: Optional[int] = None
    service_risk_level: RiskLevel


class WasteProjection(BaseModel):
    """Waste projection summary"""
    expected_total_waste: float
    waste_cost_estimate: Optional[float] = None
    primary_waste_reason: str
    waste_reduction_potential: float = Field(
        ...,
        ge=0,
        le=1,
        description="Potential % reduction with optimal actions"
    )


class ScenarioOutcome(BaseModel):
    """Outcome for a single scenario"""
    scenario_id: str
    scenario_type: ScenarioType
    scenario_description: str
    affected_ingredients: List[str]
    daily_projections: Dict[str, List[DailyProjection]]  # ingredient_id -> projections
    stockout_risk: Dict[str, StockoutRisk]  # ingredient_id -> risk
    waste_projection: Dict[str, WasteProjection]  # ingredient_id -> projection
    key_insights: List[str]
    recommended_actions: List[str]


class BaselineComparison(BaseModel):
    """Comparison between baseline and scenario"""
    ingredient_id: str
    baseline_total_consumption: float
    scenario_total_consumption: float
    consumption_change_percent: float
    baseline_expected_waste: float
    scenario_expected_waste: float
    waste_change_percent: float
    baseline_stockout_date: Optional[date]
    scenario_stockout_date: Optional[date]


class SimulationResponse(BaseModel):
    """Response for inventory simulation endpoint"""
    success: bool = True
    request_id: str
    simulation_period: dict = Field(..., description="Start and end dates")
    baseline_outcome: ScenarioOutcome = Field(
        ...,
        description="Projection without any scenario changes"
    )
    scenario_outcomes: List[ScenarioOutcome]
    comparisons: List[BaselineComparison]
    summary: dict
    warnings: List[str] = Field(default_factory=list)
    processing_time_ms: float

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "request_id": "req_sim001",
                "simulation_period": {"start": "2026-02-10", "end": "2026-02-23"},
                "baseline_outcome": {
                    "scenario_id": "baseline",
                    "scenario_type": "custom",
                    "scenario_description": "No changes - baseline projection",
                    "affected_ingredients": ["ing_chicken_001"],
                    "daily_projections": {},
                    "stockout_risk": {},
                    "waste_projection": {},
                    "key_insights": ["Stock will last approximately 4 days"],
                    "recommended_actions": ["Consider placing order by Feb 12"]
                },
                "scenario_outcomes": [{
                    "scenario_id": "scenario_1",
                    "scenario_type": "increased_demand",
                    "scenario_description": "30% demand increase for weekend festival",
                    "affected_ingredients": ["ing_chicken_001"],
                    "daily_projections": {},
                    "stockout_risk": {
                        "ing_chicken_001": {
                            "stockout_probability": 0.75,
                            "estimated_stockout_date": "2026-02-14",
                            "days_until_stockout": 4,
                            "service_risk_level": "HIGH"
                        }
                    },
                    "waste_projection": {
                        "ing_chicken_001": {
                            "expected_total_waste": 2.5,
                            "waste_cost_estimate": 125.0,
                            "primary_waste_reason": "overcooked",
                            "waste_reduction_potential": 0.3
                        }
                    },
                    "key_insights": [
                        "Stockout likely by Feb 14 under increased demand",
                        "Need 30% more inventory to meet demand"
                    ],
                    "recommended_actions": [
                        "Place emergency order for 20kg chicken",
                        "Consider pre-prepping to reduce waste"
                    ]
                }],
                "comparisons": [{
                    "ingredient_id": "ing_chicken_001",
                    "baseline_total_consumption": 80.0,
                    "scenario_total_consumption": 104.0,
                    "consumption_change_percent": 30.0,
                    "baseline_expected_waste": 4.0,
                    "scenario_expected_waste": 2.5,
                    "waste_change_percent": -37.5,
                    "baseline_stockout_date": "2026-02-16",
                    "scenario_stockout_date": "2026-02-14"
                }],
                "summary": {
                    "scenarios_simulated": 1,
                    "ingredients_analyzed": 1,
                    "highest_stockout_risk": "ing_chicken_001",
                    "total_projected_waste_baseline": 4.0,
                    "total_projected_waste_scenarios_avg": 2.5
                },
                "warnings": [],
                "processing_time_ms": 312.5
            }
        }
