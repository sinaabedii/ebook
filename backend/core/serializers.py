"""
Serializers for the E-Book Platform API.
"""
from typing import Optional

from rest_framework import serializers

from .models import Book, BookPage, ReadingProgress, UserBookmark


# =============================================================================
# Constants
# =============================================================================

MAX_FILE_SIZE_MB = 500
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


# =============================================================================
# Page Serializers
# =============================================================================

class BookPageSerializer(serializers.ModelSerializer):
    """Serializer for book pages."""

    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = BookPage
        fields = [
            'id', 'book_id', 'page_number',
            'image_url', 'thumbnail_url',
            'width', 'height',
        ]
        read_only_fields = ['id', 'book_id', 'width', 'height']

    def get_image_url(self, obj: BookPage) -> Optional[str]:
        """Get absolute URL for page image."""
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image_url

    def get_thumbnail_url(self, obj: BookPage) -> Optional[str]:
        """Get absolute URL for page thumbnail."""
        request = self.context.get('request')
        if obj.thumbnail and request:
            return request.build_absolute_uri(obj.thumbnail.url)
        return obj.thumbnail_url


# =============================================================================
# Book Serializers
# =============================================================================

class BookListSerializer(serializers.ModelSerializer):
    """Serializer for book list view."""

    thumbnail_url = serializers.SerializerMethodField()
    is_processed = serializers.BooleanField(read_only=True)
    uploaded_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'description', 'page_count',
            'thumbnail_url', 'file_size', 'is_processed',
            'uploaded_by', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'page_count', 'file_size',
            'is_processed', 'created_at', 'updated_at'
        ]

    def get_thumbnail_url(self, obj: Book) -> Optional[str]:
        """Get absolute URL for book thumbnail."""
        request = self.context.get('request')
        if obj.thumbnail and request:
            return request.build_absolute_uri(obj.thumbnail.url)
        return None


class BookDetailSerializer(serializers.ModelSerializer):
    """Serializer for book detail view."""

    thumbnail_url = serializers.SerializerMethodField()
    is_processed = serializers.BooleanField(read_only=True)
    uploaded_by = serializers.StringRelatedField(read_only=True)
    pages = BookPageSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'description', 'page_count',
            'thumbnail_url', 'file_size', 'processing_status',
            'is_processed', 'uploaded_by',
            'created_at', 'updated_at', 'pages',
        ]
        read_only_fields = [
            'id', 'page_count', 'file_size', 'processing_status',
            'is_processed', 'created_at', 'updated_at', 'pages'
        ]

    def get_thumbnail_url(self, obj: Book) -> Optional[str]:
        """Get absolute URL for book thumbnail."""
        request = self.context.get('request')
        if obj.thumbnail and request:
            return request.build_absolute_uri(obj.thumbnail.url)
        return None


class BookCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating books."""

    class Meta:
        model = Book
        fields = ['id', 'title', 'description']
        read_only_fields = ['id']


class BookUploadSerializer(serializers.Serializer):
    """Serializer for PDF upload."""

    file = serializers.FileField()
    title = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True)

    def validate_file(self, value):
        """Validate uploaded PDF file."""
        # Check extension
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError('فقط فایل‌های PDF قابل قبول هستند.')

        # Check size
        if value.size > MAX_FILE_SIZE_BYTES:
            raise serializers.ValidationError(
                f'حداکثر حجم فایل {MAX_FILE_SIZE_MB} مگابایت است.'
            )

        return value


# =============================================================================
# Response Serializers
# =============================================================================

class UploadResponseSerializer(serializers.Serializer):
    """Serializer for upload response."""

    book_id = serializers.IntegerField()
    task_id = serializers.CharField(required=False)
    status = serializers.ChoiceField(choices=['processing', 'completed', 'failed'])
    estimated_time = serializers.IntegerField(required=False)
    message = serializers.CharField(required=False)


# =============================================================================
# User Activity Serializers
# =============================================================================

class UserBookmarkSerializer(serializers.ModelSerializer):
    """Serializer for user bookmarks."""

    book_title = serializers.CharField(source='book.title', read_only=True)

    class Meta:
        model = UserBookmark
        fields = ['id', 'book', 'book_title', 'page_number', 'note', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        """Create bookmark with current user."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ReadingProgressSerializer(serializers.ModelSerializer):
    """Serializer for reading progress."""

    book_title = serializers.CharField(source='book.title', read_only=True)

    class Meta:
        model = ReadingProgress
        fields = ['id', 'book', 'book_title', 'current_page', 'last_read_at']
        read_only_fields = ['id', 'last_read_at']

    def create(self, validated_data):
        """Create or update reading progress."""
        validated_data['user'] = self.context['request'].user
        instance, _ = ReadingProgress.objects.update_or_create(
            user=validated_data['user'],
            book=validated_data['book'],
            defaults={'current_page': validated_data['current_page']}
        )
        return instance
