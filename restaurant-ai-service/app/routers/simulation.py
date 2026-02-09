"""
Inventory Simulation Router
POST /simulate/inventory
"""
import time
import uuid

from fastapi import APIRouter, HTTPException, Depends

from app.schemas.simulation import SimulationRequest, SimulationResponse
from app.schemas.common import APIError
from app.services.inventory_simulation import InventorySimulationService, get_simulation_service
from app.utils.logging import log_prediction_request, log_prediction_result, log_error
from app.utils.cache import generate_cache_key, get_cached, set_cached

router = APIRouter(prefix="/simulate", tags=["Inventory Simulation"])


@router.post(
    "/inventory",
    response_model=SimulationResponse,
    responses={
        400: {"model": APIError, "description": "Invalid request"},
        500: {"model": APIError, "description": "Simulation failed"},
    },
    summary="Simulate inventory scenarios",
    description="""
    Run what-if analysis on inventory under different scenarios.
    
    **Scenario Types:**
    - increased_demand: Simulate higher demand
    - reduced_demand: Simulate lower demand
    - reduced_purchase: Simulate ordering less
    - increased_purchase: Simulate ordering more
    - menu_promotion: Simulate running promotions
    - supplier_delay: Simulate supply chain issues
    - custom: Custom scenario with specified modifier
    
    **Simulation Outputs:**
    - Daily stock projections
    - Stockout risk and estimated date
    - Expected waste projections
    - Comparison with baseline
    
    **Use Cases:**
    - Planning for events/festivals
    - Optimizing order quantities
    - Risk assessment for supply issues
    - Promotion planning
    """
)
async def simulate_inventory(
    request: SimulationRequest,
    service: InventorySimulationService = Depends(get_simulation_service)
) -> SimulationResponse:
    """
    Run inventory simulation for baseline and specified scenarios
    """
    request_id = f"req_{uuid.uuid4().hex[:12]}"
    start_time = time.time()
    
    # Log request
    log_prediction_request(
        endpoint="/simulate/inventory",
        request_id=request_id,
        input_summary={
            "consumption_records": len(request.consumption_history),
            "waste_records": len(request.waste_history),
            "inventory_items": len(request.current_inventory),
            "scenarios": len(request.scenarios),
            "simulation_days": request.simulation_days
        }
    )
    
    # Check cache
    cache_key = generate_cache_key("simulation", request)
    cached_result = get_cached(cache_key)
    if cached_result is not None:
        cached_result.request_id = request_id
        return cached_result
    
    try:
        # Validate minimum data
        if len(request.consumption_history) < 7:
            raise HTTPException(
                status_code=400,
                detail="Minimum 7 days of consumption history required"
            )
        
        if len(request.current_inventory) == 0:
            raise HTTPException(
                status_code=400,
                detail="At least one inventory item required"
            )
        
        if len(request.scenarios) == 0:
            raise HTTPException(
                status_code=400,
                detail="At least one scenario required"
            )
        
        # Run simulation
        baseline_outcome, scenario_outcomes, comparisons = service.simulate(
            consumption_history=request.consumption_history,
            waste_history=request.waste_history,
            current_inventory=request.current_inventory,
            scenarios=request.scenarios,
            context=request.context,
            simulation_days=request.simulation_days
        )
        
        # Calculate processing time
        processing_time_ms = (time.time() - start_time) * 1000
        
        # Calculate simulation period
        sim_start = request.context.date_range.end
        from datetime import timedelta
        sim_end = sim_start + timedelta(days=request.simulation_days)
        
        # Build summary
        highest_stockout_risk = None
        max_probability = 0
        for ing_id, risk in baseline_outcome.stockout_risk.items():
            if risk.stockout_probability > max_probability:
                max_probability = risk.stockout_probability
                highest_stockout_risk = ing_id
        
        total_baseline_waste = sum(
            wp.expected_total_waste 
            for wp in baseline_outcome.waste_projection.values()
        )
        
        avg_scenario_waste = 0
        if scenario_outcomes:
            scenario_wastes = [
                sum(wp.expected_total_waste for wp in outcome.waste_projection.values())
                for outcome in scenario_outcomes
            ]
            avg_scenario_waste = sum(scenario_wastes) / len(scenario_wastes)
        
        # Build warnings
        warnings = []
        if not request.waste_history:
            warnings.append("No waste history - using default waste ratios")
        
        response = SimulationResponse(
            success=True,
            request_id=request_id,
            simulation_period={
                "start": str(sim_start),
                "end": str(sim_end)
            },
            baseline_outcome=baseline_outcome,
            scenario_outcomes=scenario_outcomes,
            comparisons=comparisons,
            summary={
                "scenarios_simulated": len(scenario_outcomes),
                "ingredients_analyzed": len(request.current_inventory),
                "highest_stockout_risk": highest_stockout_risk,
                "total_projected_waste_baseline": round(total_baseline_waste, 2),
                "total_projected_waste_scenarios_avg": round(avg_scenario_waste, 2)
            },
            warnings=warnings,
            processing_time_ms=round(processing_time_ms, 2)
        )
        
        # Cache result
        set_cached(cache_key, response)
        
        # Log result
        log_prediction_result(
            endpoint="/simulate/inventory",
            request_id=request_id,
            output_summary={
                "scenarios_simulated": len(scenario_outcomes),
                "ingredients_analyzed": len(request.current_inventory),
                "simulation_days": request.simulation_days
            },
            processing_time_ms=processing_time_ms
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        log_error(
            context="inventory_simulation",
            error=e,
            extra={"request_id": request_id}
        )
        raise HTTPException(
            status_code=500,
            detail=f"Simulation failed: {str(e)}"
        )
