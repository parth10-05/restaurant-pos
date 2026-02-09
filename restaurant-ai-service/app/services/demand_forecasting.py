"""
Demand Forecasting Service
Implements multi-model forecasting with Prophet (primary) and ARIMA (fallback)
"""
import logging
from datetime import date, timedelta
from typing import List, Dict, Optional, Tuple
from collections import defaultdict

import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA

from app.config import get_settings
from app.schemas.common import (
    IngredientConsumption,
    RequestContext,
    Trend,
    ConfidenceBand,
    SeasonalityFlag,
)
from app.schemas.demand import (
    DailyForecast,
    SeasonalityFactor,
    DemandExplanation,
    IngredientForecast,
)

logger = logging.getLogger(__name__)
settings = get_settings()

# Try to import Prophet, but allow graceful degradation
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    logger.warning("Prophet not available, using ARIMA only")


class DemandForecastingService:
    """Service for ingredient-level demand forecasting"""
    
    def __init__(self, random_seed: int = None):
        self.random_seed = random_seed or settings.random_seed
        np.random.seed(self.random_seed)
    
    def forecast(
        self,
        consumption_history: List[IngredientConsumption],
        context: RequestContext,
        forecast_days: int = 7,
        ingredient_ids: Optional[List[str]] = None
    ) -> List[IngredientForecast]:
        """
        Generate demand forecasts for ingredients
        
        Args:
            consumption_history: Historical consumption records
            context: Request context with date range and seasonality
            forecast_days: Number of days to forecast
            ingredient_ids: Specific ingredients to forecast (None = all)
        
        Returns:
            List of IngredientForecast objects
        """
        # Group history by ingredient
        ingredient_data = self._group_by_ingredient(consumption_history)
        
        # Filter to requested ingredients if specified
        if ingredient_ids:
            ingredient_data = {
                k: v for k, v in ingredient_data.items() 
                if k in ingredient_ids
            }
        
        forecasts = []
        for ingredient_id, records in ingredient_data.items():
            try:
                forecast = self._forecast_ingredient(
                    ingredient_id=ingredient_id,
                    records=records,
                    context=context,
                    forecast_days=forecast_days
                )
                forecasts.append(forecast)
            except Exception as e:
                logger.error(f"Failed to forecast {ingredient_id}: {e}")
                # Return a degraded forecast
                forecast = self._fallback_forecast(
                    ingredient_id=ingredient_id,
                    records=records,
                    forecast_days=forecast_days
                )
                forecasts.append(forecast)
        
        return forecasts
    
    def _group_by_ingredient(
        self, 
        records: List[IngredientConsumption]
    ) -> Dict[str, List[IngredientConsumption]]:
        """Group consumption records by ingredient ID"""
        grouped = defaultdict(list)
        for record in records:
            grouped[record.ingredient_id].append(record)
        
        # Sort each group by date
        for ingredient_id in grouped:
            grouped[ingredient_id].sort(key=lambda x: x.date)
        
        return dict(grouped)
    
    def _forecast_ingredient(
        self,
        ingredient_id: str,
        records: List[IngredientConsumption],
        context: RequestContext,
        forecast_days: int
    ) -> IngredientForecast:
        """Generate forecast for a single ingredient"""
        # Prepare DataFrame
        df = pd.DataFrame([
            {"ds": r.date, "y": r.quantity_used}
            for r in records
        ])
        df["ds"] = pd.to_datetime(df["ds"])
        
        unit = records[0].unit if records else "units"
        
        # Try Prophet first, fallback to ARIMA
        model_used = "Prophet"
        try:
            if PROPHET_AVAILABLE and settings.enable_prophet and len(df) >= 14:
                forecast_df, model_info = self._prophet_forecast(df, forecast_days, context)
            else:
                raise ValueError("Prophet not available or insufficient data")
        except Exception as e:
            logger.info(f"Prophet failed for {ingredient_id}, using ARIMA: {e}")
            model_used = "ARIMA"
            forecast_df, model_info = self._arima_forecast(df, forecast_days)
        
        # Detect anomalies (spikes and drops)
        forecast_df = self._detect_anomalies(forecast_df, df)
        
        # Calculate trend
        trend, trend_strength = self._calculate_trend(df, forecast_df)
        
        # Build seasonality factors
        seasonality_factors = self._extract_seasonality(df, context, model_info)
        
        # Calculate confidence score
        confidence_score = self._calculate_confidence(df, model_info)
        
        # Build daily forecasts
        daily_forecasts = [
            DailyForecast(
                date=row["ds"].date(),
                predicted_usage=max(0, row["yhat"]),
                lower_bound=max(0, row["yhat_lower"]),
                upper_bound=max(0, row["yhat_upper"]),
                is_spike=row.get("is_spike", False),
                is_drop=row.get("is_drop", False)
            )
            for _, row in forecast_df.iterrows()
        ]
        
        # Build confidence bands
        confidence_bands = [
            ConfidenceBand(
                date=row["ds"].date(),
                lower=max(0, row["yhat_lower"]),
                mean=max(0, row["yhat"]),
                upper=max(0, row["yhat_upper"])
            )
            for _, row in forecast_df.iterrows()
        ]
        
        # Calculate totals
        total_predicted = sum(f.predicted_usage for f in daily_forecasts)
        avg_daily = total_predicted / len(daily_forecasts) if daily_forecasts else 0
        
        # Build explanation
        data_quality_notes = []
        if len(df) < 14:
            data_quality_notes.append("Limited historical data (<14 days)")
        if df["y"].std() / df["y"].mean() > 0.5:
            data_quality_notes.append("High variability in historical data")
        
        explanation = DemandExplanation(
            dominant_seasonality=seasonality_factors,
            recent_trend_direction=trend,
            trend_strength=trend_strength,
            confidence_score=confidence_score,
            model_used=model_used,
            data_quality_notes=data_quality_notes
        )
        
        return IngredientForecast(
            ingredient_id=ingredient_id,
            unit=unit,
            predicted_daily_usage=daily_forecasts,
            confidence_band=confidence_bands,
            trend=trend,
            total_predicted=round(total_predicted, 2),
            avg_daily_predicted=round(avg_daily, 2),
            explanation=explanation
        )
    
    def _prophet_forecast(
        self, 
        df: pd.DataFrame, 
        forecast_days: int,
        context: RequestContext
    ) -> Tuple[pd.DataFrame, dict]:
        """Generate forecast using Prophet"""
        # Initialize Prophet with weekly seasonality
        model = Prophet(
            yearly_seasonality=False,
            weekly_seasonality=True,
            daily_seasonality=False,
            interval_width=settings.confidence_level,
            uncertainty_samples=100
        )
        
        # Add custom seasonality for festivals/holidays if indicated
        if SeasonalityFlag.FESTIVAL in context.seasonality_flags:
            model.add_seasonality(
                name="festival",
                period=30,
                fourier_order=3
            )
        
        # Fit model
        model.fit(df)
        
        # Create future dataframe
        future = model.make_future_dataframe(periods=forecast_days)
        
        # Predict
        forecast = model.predict(future)
        
        # Get only future dates
        last_date = df["ds"].max()
        forecast_df = forecast[forecast["ds"] > last_date].copy()
        
        model_info = {
            "type": "prophet",
            "weekly_seasonality": True,
            "trend_changepoints": len(model.changepoints) if hasattr(model, "changepoints") else 0
        }
        
        return forecast_df, model_info
    
    def _arima_forecast(
        self, 
        df: pd.DataFrame, 
        forecast_days: int
    ) -> Tuple[pd.DataFrame, dict]:
        """Generate forecast using ARIMA (fallback)"""
        # Prepare time series
        ts = df.set_index("ds")["y"]
        
        # Auto-select ARIMA order based on data length
        if len(ts) < 14:
            order = (1, 0, 1)
        else:
            order = (2, 1, 2)
        
        try:
            model = ARIMA(ts, order=order)
            fitted = model.fit()
            
            # Forecast
            forecast = fitted.get_forecast(steps=forecast_days)
            mean_forecast = forecast.predicted_mean
            conf_int = forecast.conf_int(alpha=1 - settings.confidence_level)
            
        except Exception:
            # Fallback to simple moving average if ARIMA fails
            logger.warning("ARIMA failed, using simple moving average")
            mean_val = ts.mean()
            std_val = ts.std()
            mean_forecast = pd.Series([mean_val] * forecast_days)
            conf_int = pd.DataFrame({
                "lower y": [mean_val - 1.96 * std_val] * forecast_days,
                "upper y": [mean_val + 1.96 * std_val] * forecast_days
            })
        
        # Build forecast dataframe
        last_date = df["ds"].max()
        future_dates = pd.date_range(
            start=last_date + timedelta(days=1),
            periods=forecast_days
        )
        
        forecast_df = pd.DataFrame({
            "ds": future_dates,
            "yhat": mean_forecast.values,
            "yhat_lower": conf_int.iloc[:, 0].values,
            "yhat_upper": conf_int.iloc[:, 1].values
        })
        
        model_info = {
            "type": "arima",
            "order": order
        }
        
        return forecast_df, model_info
    
    def _fallback_forecast(
        self,
        ingredient_id: str,
        records: List[IngredientConsumption],
        forecast_days: int
    ) -> IngredientForecast:
        """Generate simple moving average forecast as last resort"""
        if not records:
            # Return empty forecast
            return IngredientForecast(
                ingredient_id=ingredient_id,
                unit="units",
                predicted_daily_usage=[],
                confidence_band=[],
                trend=Trend.STABLE,
                total_predicted=0,
                avg_daily_predicted=0,
                explanation=DemandExplanation(
                    dominant_seasonality=[],
                    recent_trend_direction=Trend.STABLE,
                    trend_strength=0,
                    confidence_score=0,
                    model_used="fallback",
                    data_quality_notes=["Insufficient data for forecasting"]
                )
            )
        
        # Simple moving average
        quantities = [r.quantity_used for r in records]
        mean_val = np.mean(quantities)
        std_val = np.std(quantities) if len(quantities) > 1 else mean_val * 0.2
        
        last_date = max(r.date for r in records)
        unit = records[0].unit
        
        daily_forecasts = []
        confidence_bands = []
        
        for i in range(forecast_days):
            forecast_date = last_date + timedelta(days=i + 1)
            lower = max(0, mean_val - 1.96 * std_val)
            upper = mean_val + 1.96 * std_val
            
            daily_forecasts.append(DailyForecast(
                date=forecast_date,
                predicted_usage=round(mean_val, 2),
                lower_bound=round(lower, 2),
                upper_bound=round(upper, 2),
                is_spike=False,
                is_drop=False
            ))
            
            confidence_bands.append(ConfidenceBand(
                date=forecast_date,
                lower=round(lower, 2),
                mean=round(mean_val, 2),
                upper=round(upper, 2)
            ))
        
        return IngredientForecast(
            ingredient_id=ingredient_id,
            unit=unit,
            predicted_daily_usage=daily_forecasts,
            confidence_band=confidence_bands,
            trend=Trend.STABLE,
            total_predicted=round(mean_val * forecast_days, 2),
            avg_daily_predicted=round(mean_val, 2),
            explanation=DemandExplanation(
                dominant_seasonality=[],
                recent_trend_direction=Trend.STABLE,
                trend_strength=0,
                confidence_score=0.3,
                model_used="moving_average_fallback",
                data_quality_notes=["Using simple average due to model failure"]
            )
        )
    
    def _detect_anomalies(
        self, 
        forecast_df: pd.DataFrame, 
        historical_df: pd.DataFrame
    ) -> pd.DataFrame:
        """Detect spikes and drops in forecast"""
        historical_mean = historical_df["y"].mean()
        historical_std = historical_df["y"].std()
        
        # Define thresholds (2 standard deviations)
        spike_threshold = historical_mean + 2 * historical_std
        drop_threshold = max(0, historical_mean - 2 * historical_std)
        
        forecast_df["is_spike"] = forecast_df["yhat"] > spike_threshold
        forecast_df["is_drop"] = forecast_df["yhat"] < drop_threshold
        
        return forecast_df
    
    def _calculate_trend(
        self, 
        historical_df: pd.DataFrame,
        forecast_df: pd.DataFrame
    ) -> Tuple[Trend, float]:
        """Calculate trend direction and strength"""
        if len(historical_df) < 3:
            return Trend.STABLE, 0.0
        
        # Use last 7 days of historical data
        recent = historical_df.tail(7)["y"].values
        
        # Simple linear regression for trend
        x = np.arange(len(recent))
        slope = np.polyfit(x, recent, 1)[0]
        
        # Normalize slope by mean
        mean_val = np.mean(recent)
        if mean_val > 0:
            normalized_slope = slope / mean_val
        else:
            normalized_slope = 0
        
        # Determine trend
        trend_strength = min(1.0, abs(normalized_slope) * 10)
        
        if normalized_slope > 0.02:
            return Trend.UP, trend_strength
        elif normalized_slope < -0.02:
            return Trend.DOWN, trend_strength
        else:
            return Trend.STABLE, trend_strength
    
    def _extract_seasonality(
        self,
        df: pd.DataFrame,
        context: RequestContext,
        model_info: dict
    ) -> List[SeasonalityFactor]:
        """Extract seasonality factors from data"""
        factors = []
        
        if len(df) < 7:
            return factors
        
        # Analyze weekly pattern
        df_copy = df.copy()
        df_copy["day_of_week"] = df_copy["ds"].dt.dayofweek
        daily_means = df_copy.groupby("day_of_week")["y"].mean()
        
        overall_mean = df_copy["y"].mean()
        max_day = daily_means.idxmax()
        max_ratio = daily_means[max_day] / overall_mean if overall_mean > 0 else 1
        
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        if max_ratio > 1.15:  # 15% above average indicates weekly pattern
            factors.append(SeasonalityFactor(
                factor_type="weekly",
                strength=min(1.0, (max_ratio - 1) * 2),
                peak_day=day_names[max_day],
                description=f"Higher demand on {day_names[max_day]}s ({(max_ratio - 1) * 100:.0f}% above average)"
            ))
        
        # Add context-based factors
        if SeasonalityFlag.WEEKEND in context.seasonality_flags:
            weekend_mean = df_copy[df_copy["day_of_week"] >= 5]["y"].mean()
            weekday_mean = df_copy[df_copy["day_of_week"] < 5]["y"].mean()
            
            if weekend_mean > weekday_mean * 1.1:
                factors.append(SeasonalityFactor(
                    factor_type="weekend",
                    strength=min(1.0, (weekend_mean / weekday_mean - 1)),
                    peak_day=None,
                    description=f"Weekend demand {(weekend_mean / weekday_mean - 1) * 100:.0f}% higher than weekdays"
                ))
        
        if SeasonalityFlag.FESTIVAL in context.seasonality_flags:
            factors.append(SeasonalityFactor(
                factor_type="custom",
                strength=0.5,
                peak_day=None,
                description="Festival period - expect elevated demand"
            ))
        
        return factors
    
    def _calculate_confidence(
        self, 
        df: pd.DataFrame,
        model_info: dict
    ) -> float:
        """Calculate confidence score based on data quality and model fit"""
        base_confidence = 0.5
        
        # More data = higher confidence
        if len(df) >= 30:
            base_confidence += 0.2
        elif len(df) >= 14:
            base_confidence += 0.1
        
        # Lower variability = higher confidence
        cv = df["y"].std() / df["y"].mean() if df["y"].mean() > 0 else 1
        if cv < 0.2:
            base_confidence += 0.15
        elif cv < 0.4:
            base_confidence += 0.1
        
        # Prophet gets slight confidence boost
        if model_info.get("type") == "prophet":
            base_confidence += 0.05
        
        return min(0.95, base_confidence)


# Singleton instance
_demand_service: Optional[DemandForecastingService] = None


def get_demand_service() -> DemandForecastingService:
    """Get or create demand forecasting service instance"""
    global _demand_service
    if _demand_service is None:
        _demand_service = DemandForecastingService()
    return _demand_service
