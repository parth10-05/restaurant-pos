"""
Structured logging configuration
"""
import logging
import sys
from typing import Any, Dict

import structlog

from app.config import get_settings

settings = get_settings()


def setup_logging() -> None:
    """Configure structured logging"""
    
    # Configure standard logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.log_level.upper()),
    )
    
    # Configure structlog
    processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]
    
    if settings.log_json:
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer())
    
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = None) -> structlog.stdlib.BoundLogger:
    """Get a structured logger instance"""
    return structlog.get_logger(name)


def log_prediction_request(
    endpoint: str,
    request_id: str,
    input_summary: Dict[str, Any]
) -> None:
    """Log incoming prediction request"""
    logger = get_logger("prediction")
    logger.info(
        "prediction_request",
        endpoint=endpoint,
        request_id=request_id,
        input_summary=input_summary
    )


def log_prediction_result(
    endpoint: str,
    request_id: str,
    output_summary: Dict[str, Any],
    processing_time_ms: float
) -> None:
    """Log prediction result"""
    logger = get_logger("prediction")
    logger.info(
        "prediction_result",
        endpoint=endpoint,
        request_id=request_id,
        output_summary=output_summary,
        processing_time_ms=processing_time_ms
    )


def log_model_fallback(
    model_name: str,
    fallback_model: str,
    reason: str
) -> None:
    """Log when falling back to alternative model"""
    logger = get_logger("model")
    logger.warning(
        "model_fallback",
        primary_model=model_name,
        fallback_model=fallback_model,
        reason=reason
    )


def log_error(
    context: str,
    error: Exception,
    extra: Dict[str, Any] = None
) -> None:
    """Log an error with context"""
    logger = get_logger("error")
    logger.error(
        "error_occurred",
        context=context,
        error_type=type(error).__name__,
        error_message=str(error),
        extra=extra or {}
    )
