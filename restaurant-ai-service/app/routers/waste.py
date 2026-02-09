"""
Waste Risk Scoring Router
POST /predict/waste-risk
"""
import time
import uuid

from fastapi import APIRouter, HTTPException, Depends

from app.schemas.waste import WasteRiskRequest, WasteRiskResponse
from app.schemas.common import APIError, RiskLevel
from app.services.waste_risk import WasteRiskScoringService, get_waste_service
from app.utils.logging import log_prediction_request, log_prediction_result, log_error
from app.utils.cache import generate_cache_key, get_cached, set_cached

router = APIRouter(prefix="/predict", tags=["Waste Risk Scoring"])


@router.post(
    "/waste-risk",
    response_model=WasteRiskResponse,
    responses={
        400: {"model": APIError, "description": "Invalid request"},
        500: {"model": APIError, "description": "Risk assessment failed"},
    },
    summary="Score waste risk for ingredients",
    description="""
    Assess waste risk for ingredients using multi-factor analysis.
    
    **Risk Factors Considered:**
    - Historical waste ratio
    - Demand volatility
    - Shelf-life heuristics
    - Current overstock signals
    - Waste reason patterns (spoilage, overcooked, etc.)
    
    **Models Used:**
    - Gradient boosting regression (primary)
    - Rule-based scoring (fallback for low-data scenarios)
    
    **Risk Classification:**
    - LOW: 0.0 - 0.3
    - MEDIUM: 0.3 - 0.6  
    - HIGH: 0.6 - 1.0
    
    **Response includes:**
    - Risk score per ingredient
    - Contributing factors with weights
    - Recommended actions
    - Model confidence score
    """
)
async def assess_waste_risk(
    request: WasteRiskRequest,
    service: WasteRiskScoringService = Depends(get_waste_service)
) -> WasteRiskResponse:
    """
    Assess waste risk for all ingredients in the request
    """
    request_id = f"req_{uuid.uuid4().hex[:12]}"
    start_time = time.time()
    
    # Log request
    log_prediction_request(
        endpoint="/predict/waste-risk",
        request_id=request_id,
        input_summary={
            "consumption_records": len(request.consumption_history),
            "waste_records": len(request.waste_history),
            "ingredient_profiles": len(request.ingredient_profiles),
            "has_stock_levels": request.current_stock_levels is not None
        }
    )
    
    # Check cache
    cache_key = generate_cache_key("waste_risk", request)
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
        
        # Run risk assessment
        risk_assessments = service.assess_risk(
            consumption_history=request.consumption_history,
            waste_history=request.waste_history,
            ingredient_profiles=request.ingredient_profiles,
            context=request.context,
            current_stock_levels=request.current_stock_levels
        )
        
        # Calculate processing time
        processing_time_ms = (time.time() - start_time) * 1000
        
        # Build summary
        high_risk = sum(1 for r in risk_assessments if r.risk_level == RiskLevel.HIGH)
        medium_risk = sum(1 for r in risk_assessments if r.risk_level == RiskLevel.MEDIUM)
        low_risk = sum(1 for r in risk_assessments if r.risk_level == RiskLevel.LOW)
        avg_score = sum(r.waste_risk_score for r in risk_assessments) / len(risk_assessments) if risk_assessments else 0
        
        # Build warnings
        warnings = []
        if not request.waste_history:
            warnings.append("No waste history provided - using consumption-based estimation only")
        if not request.ingredient_profiles:
            warnings.append("No ingredient profiles provided - using default shelf-life assumptions")
        
        response = WasteRiskResponse(
            success=True,
            request_id=request_id,
            analysis_period={
                "start": str(request.context.date_range.start),
                "end": str(request.context.date_range.end)
            },
            risk_assessments=risk_assessments,
            summary={
                "total_ingredients_analyzed": len(risk_assessments),
                "high_risk_count": high_risk,
                "medium_risk_count": medium_risk,
                "low_risk_count": low_risk,
                "avg_risk_score": round(avg_score, 3)
            },
            warnings=warnings,
            processing_time_ms=round(processing_time_ms, 2)
        )
        
        # Cache result
        set_cached(cache_key, response)
        
        # Log result
        log_prediction_result(
            endpoint="/predict/waste-risk",
            request_id=request_id,
            output_summary={
                "ingredients_analyzed": len(risk_assessments),
                "high_risk": high_risk,
                "medium_risk": medium_risk,
                "low_risk": low_risk
            },
            processing_time_ms=processing_time_ms
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        log_error(
            context="waste_risk_assessment",
            error=e,
            extra={"request_id": request_id}
        )
        raise HTTPException(
            status_code=500,
            detail=f"Risk assessment failed: {str(e)}"
        )
