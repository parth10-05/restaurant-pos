"""
Inventory Simulation Service
What-if analysis for inventory planning scenarios
"""
import logging
from datetime import date, timedelta
from typing import List, Dict, Optional, Tuple
from collections import defaultdict
import uuid

import numpy as np
import pandas as pd

from app.config import get_settings
from app.schemas.common import (
    IngredientConsumption,
    WasteRecord,
    RequestContext,
    RiskLevel,
)
from app.schemas.simulation import (
    ScenarioType,
    ScenarioParameter,
    CurrentInventory,
    DailyProjection,
    StockoutRisk,
    WasteProjection,
    ScenarioOutcome,
    BaselineComparison,
)
from app.services.demand_forecasting import get_demand_service

logger = logging.getLogger(__name__)
settings = get_settings()


class InventorySimulationService:
    """Service for inventory simulation and what-if analysis"""
    
    # Waste rate assumptions by scenario
    SCENARIO_WASTE_MODIFIERS = {
        ScenarioType.INCREASED_DEMAND: -0.15,  # Less waste with higher demand
        ScenarioType.REDUCED_DEMAND: 0.20,     # More waste with lower demand
        ScenarioType.REDUCED_PURCHASE: -0.10,  # Less waste with less stock
        ScenarioType.INCREASED_PURCHASE: 0.25, # More waste with more stock
        ScenarioType.MENU_PROMOTION: -0.25,    # Less waste with promotion
        ScenarioType.SUPPLIER_DELAY: 0.05,     # Slight increase in waste
        ScenarioType.CUSTOM: 0.0,
    }
    
    def __init__(self, random_seed: int = None):
        self.random_seed = random_seed or settings.random_seed
        np.random.seed(self.random_seed)
        self.demand_service = get_demand_service()
    
    def simulate(
        self,
        consumption_history: List[IngredientConsumption],
        waste_history: List[WasteRecord],
        current_inventory: List[CurrentInventory],
        scenarios: List[ScenarioParameter],
        context: RequestContext,
        simulation_days: int = 14
    ) -> Tuple[ScenarioOutcome, List[ScenarioOutcome], List[BaselineComparison]]:
        """
        Run inventory simulation for baseline and scenarios
        
        Args:
            consumption_history: Historical consumption data
            waste_history: Historical waste data
            current_inventory: Current inventory state
            scenarios: List of scenario parameters to simulate
            context: Request context
            simulation_days: Number of days to simulate
        
        Returns:
            Tuple of (baseline_outcome, scenario_outcomes, comparisons)
        """
        # Build inventory map
        inventory_map = {inv.ingredient_id: inv for inv in current_inventory}
        
        # Get ingredient IDs from inventory
        ingredient_ids = list(inventory_map.keys())
        
        # Calculate historical metrics
        historical_metrics = self._calculate_historical_metrics(
            consumption_history=consumption_history,
            waste_history=waste_history,
            ingredient_ids=ingredient_ids
        )
        
        # Get demand forecasts
        forecasts = self._get_demand_forecasts(
            consumption_history=consumption_history,
            context=context,
            simulation_days=simulation_days,
            ingredient_ids=ingredient_ids
        )
        
        # Simulate baseline
        baseline_outcome = self._simulate_scenario(
            scenario_id="baseline",
            scenario_type=ScenarioType.CUSTOM,
            scenario_description="No changes - baseline projection",
            modifier_percent=0,
            affected_ingredients=ingredient_ids,
            inventory_map=inventory_map,
            forecasts=forecasts,
            historical_metrics=historical_metrics,
            start_date=context.date_range.end + timedelta(days=1),
            simulation_days=simulation_days
        )
        
        # Simulate each scenario
        scenario_outcomes = []
        for i, scenario in enumerate(scenarios):
            affected = scenario.affected_ingredient_ids or ingredient_ids
            
            outcome = self._simulate_scenario(
                scenario_id=f"scenario_{i+1}",
                scenario_type=scenario.scenario_type,
                scenario_description=scenario.description or f"{scenario.scenario_type.value} ({scenario.modifier_percent:+.0f}%)",
                modifier_percent=scenario.modifier_percent,
                affected_ingredients=affected,
                inventory_map=inventory_map,
                forecasts=forecasts,
                historical_metrics=historical_metrics,
                start_date=context.date_range.end + timedelta(days=1) + timedelta(days=scenario.start_offset_days),
                simulation_days=scenario.duration_days
            )
            scenario_outcomes.append(outcome)
        
        # Generate comparisons
        comparisons = self._generate_comparisons(
            baseline=baseline_outcome,
            scenarios=scenario_outcomes,
            ingredient_ids=ingredient_ids
        )
        
        return baseline_outcome, scenario_outcomes, comparisons
    
    def _calculate_historical_metrics(
        self,
        consumption_history: List[IngredientConsumption],
        waste_history: List[WasteRecord],
        ingredient_ids: List[str]
    ) -> Dict[str, Dict]:
        """Calculate historical metrics per ingredient"""
        metrics = {}
        
        # Group by ingredient
        consumption_by_ing = defaultdict(list)
        for record in consumption_history:
            consumption_by_ing[record.ingredient_id].append(record.quantity_used)
        
        waste_by_ing = defaultdict(list)
        waste_reasons = defaultdict(lambda: defaultdict(float))
        for record in waste_history:
            waste_by_ing[record.ingredient_id].append(record.quantity_wasted)
            waste_reasons[record.ingredient_id][record.reason.value] += record.quantity_wasted
        
        for ing_id in ingredient_ids:
            consumption = consumption_by_ing.get(ing_id, [0])
            waste = waste_by_ing.get(ing_id, [0])
            
            total_consumed = sum(consumption)
            total_wasted = sum(waste)
            
            metrics[ing_id] = {
                "avg_daily_consumption": np.mean(consumption) if consumption else 0,
                "std_daily_consumption": np.std(consumption) if len(consumption) > 1 else 0,
                "avg_daily_waste": np.mean(waste) if waste else 0,
                "waste_ratio": total_wasted / (total_consumed + total_wasted + 0.001),
                "primary_waste_reason": max(
                    waste_reasons[ing_id].items(),
                    key=lambda x: x[1],
                    default=("spoilage", 0)
                )[0]
            }
        
        return metrics
    
    def _get_demand_forecasts(
        self,
        consumption_history: List[IngredientConsumption],
        context: RequestContext,
        simulation_days: int,
        ingredient_ids: List[str]
    ) -> Dict[str, List[float]]:
        """Get demand forecasts for all ingredients"""
        forecasts = {}
        
        try:
            forecast_results = self.demand_service.forecast(
                consumption_history=consumption_history,
                context=context,
                forecast_days=simulation_days,
                ingredient_ids=ingredient_ids
            )
            
            for result in forecast_results:
                forecasts[result.ingredient_id] = [
                    day.predicted_usage for day in result.predicted_daily_usage
                ]
        except Exception as e:
            logger.warning(f"Demand forecasting failed, using historical average: {e}")
            
            # Fallback to historical average
            consumption_by_ing = defaultdict(list)
            for record in consumption_history:
                consumption_by_ing[record.ingredient_id].append(record.quantity_used)
            
            for ing_id in ingredient_ids:
                avg = np.mean(consumption_by_ing.get(ing_id, [0]))
                forecasts[ing_id] = [avg] * simulation_days
        
        return forecasts
    
    def _simulate_scenario(
        self,
        scenario_id: str,
        scenario_type: ScenarioType,
        scenario_description: str,
        modifier_percent: float,
        affected_ingredients: List[str],
        inventory_map: Dict[str, CurrentInventory],
        forecasts: Dict[str, List[float]],
        historical_metrics: Dict[str, Dict],
        start_date: date,
        simulation_days: int
    ) -> ScenarioOutcome:
        """Simulate a single scenario"""
        
        daily_projections: Dict[str, List[DailyProjection]] = {}
        stockout_risks: Dict[str, StockoutRisk] = {}
        waste_projections: Dict[str, WasteProjection] = {}
        
        for ing_id in affected_ingredients:
            if ing_id not in inventory_map:
                continue
            
            inventory = inventory_map[ing_id]
            forecast = forecasts.get(ing_id, [0] * simulation_days)
            metrics = historical_metrics.get(ing_id, {
                "avg_daily_consumption": 0,
                "waste_ratio": 0.05,
                "primary_waste_reason": "spoilage"
            })
            
            # Apply demand modifier
            demand_modifier = 1 + (modifier_percent / 100)
            
            # Project daily inventory
            projections = []
            current_stock = inventory.current_stock
            cumulative_consumption = 0
            cumulative_waste = 0
            stockout_date = None
            
            # Get waste modifier for scenario type
            waste_modifier = self.SCENARIO_WASTE_MODIFIERS.get(scenario_type, 0)
            base_waste_ratio = metrics["waste_ratio"] * (1 + waste_modifier)
            
            for day_offset in range(simulation_days):
                projection_date = start_date + timedelta(days=day_offset)
                
                # Get forecasted demand with modifier
                base_demand = forecast[day_offset] if day_offset < len(forecast) else metrics["avg_daily_consumption"]
                adjusted_demand = base_demand * demand_modifier
                
                # Add some variability
                daily_consumption = max(0, adjusted_demand + np.random.normal(0, metrics.get("std_daily_consumption", 0) * 0.5))
                
                # Calculate waste (increases when overstocked)
                days_of_stock = current_stock / (adjusted_demand + 0.001)
                overstock_factor = max(0, (days_of_stock - 7) / 7) if days_of_stock > 7 else 0
                daily_waste = daily_consumption * base_waste_ratio * (1 + overstock_factor)
                
                # Update stock
                new_stock = current_stock - daily_consumption - daily_waste
                
                # Check for stockout
                is_stockout = new_stock <= 0
                is_below_reorder = new_stock <= (inventory.reorder_point or 0)
                
                if is_stockout and stockout_date is None:
                    stockout_date = projection_date
                
                # Don't go below zero
                new_stock = max(0, new_stock)
                
                cumulative_consumption += daily_consumption
                cumulative_waste += daily_waste
                
                projections.append(DailyProjection(
                    date=projection_date,
                    projected_stock=round(new_stock, 2),
                    projected_consumption=round(daily_consumption, 2),
                    projected_waste=round(daily_waste, 2),
                    cumulative_consumption=round(cumulative_consumption, 2),
                    cumulative_waste=round(cumulative_waste, 2),
                    is_below_reorder=is_below_reorder,
                    is_stockout=is_stockout
                ))
                
                current_stock = new_stock
            
            daily_projections[ing_id] = projections
            
            # Calculate stockout risk
            stockout_days = [p for p in projections if p.is_stockout]
            stockout_probability = len(stockout_days) / len(projections) if projections else 0
            
            days_until_stockout = None
            if stockout_date:
                days_until_stockout = (stockout_date - start_date).days
            
            stockout_risks[ing_id] = StockoutRisk(
                stockout_probability=round(stockout_probability, 3),
                estimated_stockout_date=stockout_date,
                days_until_stockout=days_until_stockout,
                service_risk_level=self._classify_stockout_risk(stockout_probability, days_until_stockout)
            )
            
            # Calculate waste projection
            total_waste = cumulative_waste
            waste_projections[ing_id] = WasteProjection(
                expected_total_waste=round(total_waste, 2),
                waste_cost_estimate=None,  # Would need cost data
                primary_waste_reason=metrics["primary_waste_reason"],
                waste_reduction_potential=min(0.4, base_waste_ratio * 2)
            )
        
        # Generate insights
        key_insights = self._generate_insights(
            scenario_type=scenario_type,
            modifier_percent=modifier_percent,
            stockout_risks=stockout_risks,
            waste_projections=waste_projections
        )
        
        # Generate recommendations
        recommended_actions = self._generate_scenario_recommendations(
            scenario_type=scenario_type,
            stockout_risks=stockout_risks,
            waste_projections=waste_projections
        )
        
        return ScenarioOutcome(
            scenario_id=scenario_id,
            scenario_type=scenario_type,
            scenario_description=scenario_description,
            affected_ingredients=affected_ingredients,
            daily_projections=daily_projections,
            stockout_risk=stockout_risks,
            waste_projection=waste_projections,
            key_insights=key_insights,
            recommended_actions=recommended_actions
        )
    
    def _classify_stockout_risk(
        self,
        probability: float,
        days_until: Optional[int]
    ) -> RiskLevel:
        """Classify stockout risk level"""
        if probability > 0.5 or (days_until is not None and days_until <= 3):
            return RiskLevel.HIGH
        elif probability > 0.2 or (days_until is not None and days_until <= 7):
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    def _generate_insights(
        self,
        scenario_type: ScenarioType,
        modifier_percent: float,
        stockout_risks: Dict[str, StockoutRisk],
        waste_projections: Dict[str, WasteProjection]
    ) -> List[str]:
        """Generate key insights from simulation"""
        insights = []
        
        # Stockout insights
        high_risk_items = [
            ing_id for ing_id, risk in stockout_risks.items()
            if risk.service_risk_level == RiskLevel.HIGH
        ]
        
        if high_risk_items:
            insights.append(f"High stockout risk for {len(high_risk_items)} ingredient(s)")
            
            earliest_stockout = min(
                (risk.days_until_stockout for risk in stockout_risks.values() if risk.days_until_stockout),
                default=None
            )
            if earliest_stockout:
                insights.append(f"Earliest stockout expected in {earliest_stockout} day(s)")
        
        # Waste insights
        total_waste = sum(wp.expected_total_waste for wp in waste_projections.values())
        if total_waste > 0:
            insights.append(f"Total projected waste: {total_waste:.1f} units across all ingredients")
        
        # Scenario-specific insights
        if scenario_type == ScenarioType.INCREASED_DEMAND:
            insights.append(f"Demand increase of {modifier_percent:.0f}% will accelerate stock depletion")
        elif scenario_type == ScenarioType.MENU_PROMOTION:
            insights.append("Promotion expected to reduce waste through faster turnover")
        elif scenario_type == ScenarioType.SUPPLIER_DELAY:
            insights.append("Plan for extended stock duration without resupply")
        
        return insights
    
    def _generate_scenario_recommendations(
        self,
        scenario_type: ScenarioType,
        stockout_risks: Dict[str, StockoutRisk],
        waste_projections: Dict[str, WasteProjection]
    ) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Check for imminent stockouts
        urgent_items = [
            ing_id for ing_id, risk in stockout_risks.items()
            if risk.days_until_stockout and risk.days_until_stockout <= 5
        ]
        
        if urgent_items:
            recommendations.append(f"Place urgent order for {len(urgent_items)} item(s) within 2 days")
        
        # Check for high waste
        high_waste_items = [
            ing_id for ing_id, wp in waste_projections.items()
            if wp.expected_total_waste > 5
        ]
        
        if high_waste_items:
            recommendations.append(f"Consider menu promotions for {len(high_waste_items)} high-waste item(s)")
        
        # Scenario-specific recommendations
        if scenario_type == ScenarioType.INCREASED_DEMAND:
            recommendations.append("Increase order quantities by the demand increase percentage")
            recommendations.append("Consider pre-prepping items to handle volume")
        elif scenario_type == ScenarioType.REDUCED_DEMAND:
            recommendations.append("Reduce order quantities to prevent spoilage")
            recommendations.append("Run promotions to maintain inventory turnover")
        elif scenario_type == ScenarioType.SUPPLIER_DELAY:
            recommendations.append("Identify alternative suppliers for critical items")
            recommendations.append("Consider menu adjustments if stockout is likely")
        
        return recommendations
    
    def _generate_comparisons(
        self,
        baseline: ScenarioOutcome,
        scenarios: List[ScenarioOutcome],
        ingredient_ids: List[str]
    ) -> List[BaselineComparison]:
        """Generate baseline vs scenario comparisons"""
        comparisons = []
        
        for ing_id in ingredient_ids:
            baseline_proj = baseline.daily_projections.get(ing_id, [])
            baseline_consumption = sum(p.projected_consumption for p in baseline_proj)
            baseline_waste = sum(p.projected_waste for p in baseline_proj)
            baseline_stockout = baseline.stockout_risk.get(ing_id)
            baseline_stockout_date = baseline_stockout.estimated_stockout_date if baseline_stockout else None
            
            # Use first scenario for comparison (or aggregate later)
            if scenarios:
                scenario = scenarios[0]
                scenario_proj = scenario.daily_projections.get(ing_id, [])
                scenario_consumption = sum(p.projected_consumption for p in scenario_proj)
                scenario_waste = sum(p.projected_waste for p in scenario_proj)
                scenario_stockout = scenario.stockout_risk.get(ing_id)
                scenario_stockout_date = scenario_stockout.estimated_stockout_date if scenario_stockout else None
                
                consumption_change = ((scenario_consumption - baseline_consumption) / (baseline_consumption + 0.001)) * 100
                waste_change = ((scenario_waste - baseline_waste) / (baseline_waste + 0.001)) * 100
                
                comparisons.append(BaselineComparison(
                    ingredient_id=ing_id,
                    baseline_total_consumption=round(baseline_consumption, 2),
                    scenario_total_consumption=round(scenario_consumption, 2),
                    consumption_change_percent=round(consumption_change, 1),
                    baseline_expected_waste=round(baseline_waste, 2),
                    scenario_expected_waste=round(scenario_waste, 2),
                    waste_change_percent=round(waste_change, 1),
                    baseline_stockout_date=baseline_stockout_date,
                    scenario_stockout_date=scenario_stockout_date
                ))
        
        return comparisons


# Singleton instance
_simulation_service: Optional[InventorySimulationService] = None


def get_simulation_service() -> InventorySimulationService:
    """Get or create simulation service instance"""
    global _simulation_service
    if _simulation_service is None:
        _simulation_service = InventorySimulationService()
    return _simulation_service
