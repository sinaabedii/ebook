"""
Health check views for monitoring.
"""
from __future__ import annotations

import time
from typing import Any, Dict

from django.db import connection
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Book


class HealthCheckView(APIView):
    """Basic health check endpoint."""

    permission_classes = [AllowAny]

    def get(self, request) -> Response:
        """Return basic health status."""
        return Response({
            'status': 'healthy',
            'timestamp': time.time(),
        })


class ReadinessCheckView(APIView):
    """Readiness check with database connectivity."""

    permission_classes = [AllowAny]

    def get(self, request) -> Response:
        """Check if the application is ready to serve requests."""
        checks = {
            'database': self._check_database(),
        }

        all_healthy = all(c['status'] == 'healthy' for c in checks.values())
        status_code = 200 if all_healthy else 503

        return Response({
            'status': 'ready' if all_healthy else 'not_ready',
            'checks': checks,
            'timestamp': time.time(),
        }, status=status_code)

    @staticmethod
    def _check_database() -> Dict[str, Any]:
        """Check database connectivity."""
        try:
            start = time.time()
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
            latency = (time.time() - start) * 1000

            return {
                'status': 'healthy',
                'latency_ms': round(latency, 2),
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
            }


class StatsView(APIView):
    """Statistics endpoint."""

    permission_classes = [AllowAny]

    def get(self, request) -> Response:
        """Return application statistics."""
        stats = {
            'books': self._get_book_stats(),
            'pages': self._get_page_stats(),
            'storage': self._get_storage_stats(),
        }
        return Response(stats)

    @staticmethod
    def _get_book_stats() -> Dict[str, int]:
        """Get book statistics."""
        return {
            'total': Book.objects.count(),
            'completed': Book.objects.filter(
                processing_status=Book.ProcessingStatus.COMPLETED
            ).count(),
            'processing': Book.objects.filter(
                processing_status=Book.ProcessingStatus.PROCESSING
            ).count(),
            'failed': Book.objects.filter(
                processing_status=Book.ProcessingStatus.FAILED
            ).count(),
        }

    @staticmethod
    def _get_page_stats() -> Dict[str, int]:
        """Get page statistics."""
        total_pages = sum(
            b.page_count for b in Book.objects.only('page_count')
        )
        return {'total': total_pages}

    @staticmethod
    def _get_storage_stats() -> Dict[str, int]:
        """Get storage statistics."""
        total_bytes = sum(
            b.file_size for b in Book.objects.only('file_size')
        )
        return {'total_bytes': total_bytes}
