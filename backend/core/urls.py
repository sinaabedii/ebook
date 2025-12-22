"""
URL configuration for the Core API.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .health import HealthCheckView, ReadinessCheckView, StatsView

router = DefaultRouter()
router.register(r'books', views.BookViewSet, basename='book')
router.register(r'bookmarks', views.BookmarkViewSet, basename='bookmark')

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # Upload endpoints
    path('upload/', views.PdfUploadView.as_view(), name='pdf-upload'),
    path('upload/status/<int:book_id>/', views.UploadStatusView.as_view(), name='upload-status'),
    
    # Page endpoints
    path('pages/<int:book_id>/', views.PageListView.as_view(), name='page-list'),
    path('pages/<int:book_id>/<int:page_number>/', views.PageDetailView.as_view(), name='page-detail'),
    path('pages/<int:book_id>/range/', views.PageRangeView.as_view(), name='page-range'),
    
    # Reading progress
    path('progress/<int:book_id>/', views.ReadingProgressView.as_view(), name='reading-progress'),
    
    # Health & Monitoring
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('ready/', ReadinessCheckView.as_view(), name='readiness-check'),
    path('stats/', StatsView.as_view(), name='stats'),
]
