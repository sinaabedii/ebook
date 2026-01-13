"""
API Views for the E-Book Platform.
"""
from __future__ import annotations

import logging
import re
from typing import Optional

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics, status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Book, BookPage, ReadingProgress, UserBookmark
from .serializers import (
    BookCreateSerializer,
    BookDetailSerializer,
    BookListSerializer,
    BookPageSerializer,
    BookUploadSerializer,
    ReadingProgressSerializer,
    UploadResponseSerializer,
    UserBookmarkSerializer,
)
from .services import BackgroundTaskManager

logger = logging.getLogger(__name__)


# =============================================================================
# Helper Functions
# =============================================================================

def extract_title_from_filename(filename: str) -> str:
    """Extract clean title from filename."""
    # Remove extension
    title = filename.rsplit('.', 1)[0]
    # Replace underscores and dashes with spaces
    title = re.sub(r'[_-]+', ' ', title)
    # Remove multiple spaces
    title = re.sub(r'\s+', ' ', title).strip()
    return title


def process_pdf_background(book_id: int) -> bool:
    """Process PDF in background thread."""
    from .services import PdfProcessorService

    try:
        book = Book.objects.get(id=book_id)
        processor = PdfProcessorService()
        return processor.process_book(book)
    except Book.DoesNotExist:
        logger.error(f"Book {book_id} not found for processing")
        return False
    except Exception as e:
        logger.exception(f"Background processing failed for book {book_id}: {e}")
        return False


# =============================================================================
# Book ViewSet
# =============================================================================

class BookViewSet(viewsets.ModelViewSet):
    """ViewSet for managing books."""

    queryset = Book.objects.all()
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return BookListSerializer
        elif self.action == 'create':
            return BookCreateSerializer
        return BookDetailSerializer

    def get_queryset(self):
        """Filter queryset based on query parameters."""
        queryset = Book.objects.all()

        # Filter by processing status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(processing_status=status_filter)

        return queryset.order_by('-created_at')

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                'q', openapi.IN_QUERY,
                description="Search query",
                type=openapi.TYPE_STRING
            ),
        ]
    )
    def search(self, request):
        """Search books by title or description."""
        query = request.query_params.get('q', '')
        if not query:
            return Response([])

        books = Book.objects.filter(
            Q(title__icontains=query) | Q(description__icontains=query),
            processing_status=Book.ProcessingStatus.COMPLETED
        )[:20]

        serializer = BookListSerializer(books, many=True, context={'request': request})
        return Response(serializer.data)


# =============================================================================
# Upload Views
# =============================================================================

class PdfUploadView(APIView):
    """View for uploading PDF files."""

    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        request_body=BookUploadSerializer,
        responses={201: UploadResponseSerializer}
    )
    def post(self, request):
        """Upload a PDF file and create a new book."""
        serializer = BookUploadSerializer(data=request.data)

        if not serializer.is_valid():
            logger.warning(f"Invalid upload request: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        file = serializer.validated_data['file']
        title = serializer.validated_data.get('title') or extract_title_from_filename(file.name)
        description = serializer.validated_data.get('description', '')

        # Create book instance
        with transaction.atomic():
            book = Book.objects.create(
                title=title,
                description=description,
                pdf_file=file,
                file_size=file.size,
                processing_status=Book.ProcessingStatus.PROCESSING,
                uploaded_by=request.user if request.user.is_authenticated else None,
            )

        logger.info(f"Book created: {book.id} - {book.title}")

        # Process PDF in background
        task_manager = BackgroundTaskManager()
        task_id = task_manager.submit(
            process_pdf_background,
            book.id,
            task_name=f"process_book_{book.id}"
        )

        # Estimate processing time based on file size (seconds)
        estimated_time = max(5, book.file_size // (1024 * 1024))

        return Response({
            'book_id': book.id,
            'task_id': task_id,
            'status': 'processing',
            'estimated_time': estimated_time,
            'message': 'فایل با موفقیت آپلود شد و در حال پردازش است.'
        }, status=status.HTTP_201_CREATED)


class UploadStatusView(APIView):
    """View for checking upload/processing status."""

    permission_classes = [AllowAny]

    @swagger_auto_schema(responses={200: UploadResponseSerializer})
    def get(self, request, book_id: int):
        """Get the processing status of a book."""
        book = get_object_or_404(Book, id=book_id)

        response_data = {
            'book_id': book.id,
            'status': book.processing_status,
        }

        if book.processing_status == Book.ProcessingStatus.FAILED:
            response_data['message'] = book.processing_error or 'خطا در پردازش فایل'

        return Response(response_data)


# =============================================================================
# Page Views
# =============================================================================

class PageListView(generics.ListAPIView):
    """View for listing pages of a book."""

    serializer_class = BookPageSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        """Get pages for specified book."""
        book_id = self.kwargs.get('book_id')
        return BookPage.objects.filter(book_id=book_id).order_by('page_number')


class PageDetailView(generics.RetrieveAPIView):
    """View for getting a specific page."""

    serializer_class = BookPageSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        """Get specific page by book_id and page_number."""
        book_id = self.kwargs.get('book_id')
        page_number = self.kwargs.get('page_number')
        return get_object_or_404(BookPage, book_id=book_id, page_number=page_number)


class PageRangeView(APIView):
    """View for getting a range of pages (for preloading)."""

    permission_classes = [AllowAny]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                'start', openapi.IN_QUERY,
                description="Start page",
                type=openapi.TYPE_INTEGER
            ),
            openapi.Parameter(
                'end', openapi.IN_QUERY,
                description="End page",
                type=openapi.TYPE_INTEGER
            ),
        ]
    )
    def get(self, request, book_id: int):
        """Get pages within a range."""
        start = int(request.query_params.get('start', 1))
        end = int(request.query_params.get('end', start + 5))

        pages = BookPage.objects.filter(
            book_id=book_id,
            page_number__gte=start,
            page_number__lte=end
        ).order_by('page_number')

        serializer = BookPageSerializer(pages, many=True, context={'request': request})
        return Response(serializer.data)


# =============================================================================
# Bookmark ViewSet
# =============================================================================

class BookmarkViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user bookmarks."""

    serializer_class = UserBookmarkSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """Get bookmarks for current user."""
        if not self.request.user.is_authenticated:
            return UserBookmark.objects.none()

        queryset = UserBookmark.objects.filter(user=self.request.user)

        # Filter by book if specified
        book_id = self.request.query_params.get('book_id')
        if book_id:
            queryset = queryset.filter(book_id=book_id)

        return queryset.order_by('-created_at')


# =============================================================================
# Reading Progress View
# =============================================================================

class ReadingProgressView(APIView):
    """View for managing reading progress."""

    permission_classes = [AllowAny]

    def get(self, request, book_id: int):
        """Get reading progress for a book."""
        if not request.user.is_authenticated:
            return Response({'current_page': 1})

        progress = ReadingProgress.objects.filter(
            user=request.user,
            book_id=book_id
        ).first()

        if progress:
            serializer = ReadingProgressSerializer(progress)
            return Response(serializer.data)

        return Response({'current_page': 1})

    def post(self, request, book_id: int):
        """Update reading progress for a book."""
        if not request.user.is_authenticated:
            return Response({'message': 'Saved locally'})

        current_page = request.data.get('current_page', 1)

        progress, _ = ReadingProgress.objects.update_or_create(
            user=request.user,
            book_id=book_id,
            defaults={'current_page': current_page}
        )

        serializer = ReadingProgressSerializer(progress)
        return Response(serializer.data)
