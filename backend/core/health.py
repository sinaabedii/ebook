"""
Health check views for monitoring.
"""
import time
from django.db import connection
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import Book


class HealthCheckView(APIView):
    """Basic health check endpoint."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Return basic health status."""
        return Response({
            'status': 'healthy',
            'timestamp': time.time(),
        })


class ReadinessCheckView(APIView):
    """Readiness check with database connectivity."""
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Check if the application is ready to serve requests."""
        checks = {
            'database': self._check_database(),
        }
        
        all_healthy = all(c['status'] == 'healthy' for c in checks.values())
        
        return Response({
            'status': 'ready' if all_healthy else 'not_ready',
            'checks': checks,
            'timestamp': time.time(),
        }, status=200 if all_healthy else 503)
    
    def _check_database(self):
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
    
    def get(self, request):
        """Return application statistics."""
        from django.db.models import Count, Sum
        
        books_stats = Book.objects.aggregate(
            total=Count('id'),
            completed=Count('id', filter=Book.objects.filter(
                processing_status=Book.ProcessingStatus.COMPLETED
            ).query.where),
            total_pages=Sum('page_count'),
            total_size=Sum('file_size'),
        )
        
        # Simpler approach
        stats = {
            'books': {
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
            },
            'pages': {
                'total': sum(b.page_count for b in Book.objects.only('page_count')),
            },
            'storage': {
                'total_bytes': sum(b.file_size for b in Book.objects.only('file_size')),
            },
        }
        
        return Response(stats)
