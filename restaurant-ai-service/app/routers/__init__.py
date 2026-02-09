"""
API Routers Package
"""
from app.routers.demand import router as demand_router
from app.routers.waste import router as waste_router
from app.routers.simulation import router as simulation_router

__all__ = [
    "demand_router",
    "waste_router",
    "simulation_router"
]
