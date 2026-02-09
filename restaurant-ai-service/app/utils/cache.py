"""
Caching utilities for model results
"""
import hashlib
import json
from typing import Any, Optional
from functools import wraps
from cachetools import TTLCache

from app.config import get_settings

settings = get_settings()

# Global cache instance
_cache = TTLCache(
    maxsize=settings.cache_max_size,
    ttl=settings.cache_ttl_seconds
)


def generate_cache_key(prefix: str, data: Any) -> str:
    """Generate a deterministic cache key from input data"""
    if hasattr(data, "model_dump"):
        # Pydantic model
        serialized = json.dumps(data.model_dump(), sort_keys=True, default=str)
    elif isinstance(data, dict):
        serialized = json.dumps(data, sort_keys=True, default=str)
    elif isinstance(data, (list, tuple)):
        serialized = json.dumps([
            item.model_dump() if hasattr(item, "model_dump") else item 
            for item in data
        ], sort_keys=True, default=str)
    else:
        serialized = str(data)
    
    hash_value = hashlib.sha256(serialized.encode()).hexdigest()[:16]
    return f"{prefix}:{hash_value}"


def get_cached(key: str) -> Optional[Any]:
    """Get value from cache"""
    return _cache.get(key)


def set_cached(key: str, value: Any) -> None:
    """Set value in cache"""
    _cache[key] = value


def cached_result(prefix: str):
    """Decorator for caching function results based on input hash"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from all arguments
            cache_data = {"args": args, "kwargs": kwargs}
            cache_key = generate_cache_key(prefix, cache_data)
            
            # Check cache
            cached = get_cached(cache_key)
            if cached is not None:
                return cached
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache result
            set_cached(cache_key, result)
            
            return result
        return wrapper
    return decorator


def clear_cache() -> None:
    """Clear all cached values"""
    _cache.clear()


def get_cache_stats() -> dict:
    """Get cache statistics"""
    return {
        "size": len(_cache),
        "max_size": _cache.maxsize,
        "ttl": _cache.ttl
    }
