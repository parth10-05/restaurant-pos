"""Service layer for AI microservice"""
from .demand_forecasting import DemandForecastingService, get_demand_service
from .waste_risk import WasteRiskScoringService, get_waste_service
from .inventory_simulation import InventorySimulationService, get_simulation_service

__all__ = [
    "DemandForecastingService",
    "get_demand_service",
    "WasteRiskScoringService", 
    "get_waste_service",
    "InventorySimulationService",
    "get_simulation_service",
]
