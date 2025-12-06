"""
API Views for the E-Book Platform.
"""

from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Q
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import Book, BookPage, UserBookmark, ReadingProgress
from .serializers import (
    BookListSerializer,
    BookDetailSerializer,
    BookCreateSerializer,
    BookUploadSerializer,
    BookPageSerializer,
    UserBookmarkSerializer,
    ReadingProgressSerializer,
    UploadResponseSerializer,
)


class BookViewSet(viewsets.ModelViewSet):
    """ViewSet for managing books."""
    
    queryset = Book.objects.all()
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BookListSerializer
        elif self.action == 'create':
            return BookCreateSerializer
        return BookDetailSerializer
    
    def get_queryset(self):
        queryset = Book.objects.all()
        
        # Filter by processing status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(processing_status=status_filter)
        
        return queryset.order_by('-created_at')
    
    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter('q', openapi.IN_QUERY, description="Search query", type=openapi.TYPE_STRING),
        ]
    )
    @action(detail=False, methods=['get'])
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
    
    def perform_destroy(self, instance):
        """Delete book and all associated files."""
        instance.delete()


class PdfUploadView(APIView):
    """View for uploading PDF files."""
    
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        request_body=BookUploadSerializer,
        responses={200: UploadResponseSerializer}
    )
    def post(self, request):
        """Upload a PDF file and create a new book."""
        serializer = BookUploadSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        file = serializer.validated_data['file']
        title = serializer.validated_data.get('title') or file.name.replace('.pdf', '').replace('_', ' ')
        description = serializer.validated_data.get('description', '')
        
        # Create book instance
        book = Book.objects.create(
            title=title,
            description=description,
            pdf_file=file,
            file_size=file.size,
            processing_status=Book.ProcessingStatus.PROCESSING,
            uploaded_by=request.user if request.user.is_authenticated else None,
        )
        
        # Trigger async PDF processing
        from pdf_processor.tasks import process_pdf_task
        process_pdf_task.delay(book.id)
        
        return Response({
            'book_id': book.id,
            'status': 'processing',
            'estimated_time': max(30, book.file_size // (1024 * 1024) * 2),  # Rough estimate
            'message': 'فایل با موفقیت آپلود شد و در حال پردازش است.'
        })


class UploadStatusView(APIView):
    """View for checking upload/processing status."""
    
    permission_classes = [AllowAny]

    @swagger_auto_schema(responses={200: UploadResponseSerializer})
    def get(self, request, book_id):
        """Get the processing status of a book."""
        book = get_object_or_404(Book, id=book_id)
        
        response_data = {
            'book_id': book.id,
            'status': book.processing_status,
        }
        
        if book.processing_status == Book.ProcessingStatus.FAILED:
            response_data['message'] = book.processing_error or 'خطا در پردازش فایل'
        
        return Response(response_data)


class PageListView(generics.ListAPIView):
    """View for listing pages of a book."""
    
    serializer_class = BookPageSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        book_id = self.kwargs.get('book_id')
        return BookPage.objects.filter(book_id=book_id).order_by('page_number')


class PageDetailView(generics.RetrieveAPIView):
    """View for getting a specific page."""
    
    serializer_class = BookPageSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        book_id = self.kwargs.get('book_id')
        page_number = self.kwargs.get('page_number')
        return get_object_or_404(BookPage, book_id=book_id, page_number=page_number)


class PageRangeView(APIView):
    """View for getting a range of pages (for preloading)."""
    
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter('start', openapi.IN_QUERY, description="Start page", type=openapi.TYPE_INTEGER),
            openapi.Parameter('end', openapi.IN_QUERY, description="End page", type=openapi.TYPE_INTEGER),
        ]
    )
    def get(self, request, book_id):
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


class BookmarkViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user bookmarks."""
    
    serializer_class = UserBookmarkSerializer
    permission_classes = [AllowAny]  # Change to IsAuthenticated in production
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            queryset = UserBookmark.objects.filter(user=self.request.user)
        else:
            queryset = UserBookmark.objects.none()
        
        # Filter by book
        book_id = self.request.query_params.get('book_id')
        if book_id:
            queryset = queryset.filter(book_id=book_id)
        
        return queryset.order_by('-created_at')


class ReadingProgressView(APIView):
    """View for managing reading progress."""
    
    permission_classes = [AllowAny]  # Change to IsAuthenticated in production

    def get(self, request, book_id):
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

    def post(self, request, book_id):
        """Update reading progress for a book."""
        if not request.user.is_authenticated:
            return Response({'message': 'Saved locally'})
        
        current_page = request.data.get('current_page', 1)
        
        progress, created = ReadingProgress.objects.update_or_create(
            user=request.user,
            book_id=book_id,
            defaults={'current_page': current_page}
        )
        
        serializer = ReadingProgressSerializer(progress)
        return Response(serializer.data)
