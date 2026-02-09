"""Utility modules"""
from .cache import (
    generate_cache_key,
    get_cached,
    set_cached,
    cached_result,
    clear_cache,
    get_cache_stats,
)
from .logging import (
    setup_logging,
    get_logger,
    log_prediction_request,
    log_prediction_result,
    log_model_fallback,
    log_error,
)

__all__ = [
    "generate_cache_key",
    "get_cached",
    "set_cached",
    "cached_result",
    "clear_cache",
    "get_cache_stats",
    "setup_logging",
    "get_logger",
    "log_prediction_request",
    "log_prediction_result",
    "log_model_fallback",
    "log_error",
]
