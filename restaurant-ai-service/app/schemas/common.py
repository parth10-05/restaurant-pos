"""
Common Pydantic schemas shared across modules
"""
from datetime import date
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class Trend(str, Enum):
    """Trend direction enum"""
    UP = "UP"
    DOWN = "DOWN"
    STABLE = "STABLE"


class RiskLevel(str, Enum):
    """Risk classification enum"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class WasteReason(str, Enum):
    """Waste reason categories"""
    SPOILAGE = "spoilage"
    OVERCOOKED = "overcooked"
    RETURNED = "returned"
    PREP_LOSS = "prep_loss"


class SeasonalityFlag(str, Enum):
    """Day type for seasonality"""
    WEEKDAY = "weekday"
    WEEKEND = "weekend"
    FESTIVAL = "festival"
    HOLIDAY = "holiday"


class DateRange(BaseModel):
    """Date range for queries"""
    start: date
    end: date
    
    def days_count(self) -> int:
        return (self.end - self.start).days + 1


class RestaurantMetadata(BaseModel):
    """Optional restaurant context"""
    cuisine_type: Optional[str] = None
    avg_orders_per_day: Optional[float] = None
    capacity_seats: Optional[int] = None


class IngredientConsumption(BaseModel):
    """Single ingredient consumption record"""
    ingredient_id: str = Field(..., description="Unique ingredient identifier")
    date: date
    quantity_used: float = Field(..., ge=0, description="Quantity consumed")
    unit: str = Field(..., description="Unit of measurement (kg, g, l, pcs)")


class WasteRecord(BaseModel):
    """Single waste event record"""
    ingredient_id: str = Field(..., description="Unique ingredient identifier")
    date: date
    quantity_wasted: float = Field(..., ge=0, description="Quantity wasted")
    reason: WasteReason


class RequestContext(BaseModel):
    """Context for prediction requests"""
    date_range: DateRange
    seasonality_flags: List[SeasonalityFlag] = Field(default_factory=list)
    restaurant_metadata: Optional[RestaurantMetadata] = None


class ConfidenceBand(BaseModel):
    """Confidence interval for predictions"""
    date: date
    lower: float = Field(..., description="Lower bound of confidence interval")
    mean: float = Field(..., description="Point estimate")
    upper: float = Field(..., description="Upper bound of confidence interval")


class ContributingFactor(BaseModel):
    """Factor contributing to a prediction/score"""
    factor_name: str
    contribution: float = Field(..., description="Numeric contribution weight")
    description: str = Field(..., description="Human-readable explanation")


class APIError(BaseModel):
    """Standard error response"""
    error_code: str
    message: str
    details: Optional[dict] = None
