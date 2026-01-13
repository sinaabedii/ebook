"""
Common exceptions for the application.
"""
from rest_framework import status
from rest_framework.exceptions import APIException


class ServiceUnavailableError(APIException):
    """Raised when a service is unavailable."""
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = 'سرویس در دسترس نیست.'
    default_code = 'service_unavailable'


class RateLimitExceededError(APIException):
    """Raised when rate limit is exceeded."""
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = 'تعداد درخواست‌ها بیش از حد مجاز است.'
    default_code = 'rate_limit_exceeded'
