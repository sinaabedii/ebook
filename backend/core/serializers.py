"""
Serializers for the E-Book Platform API.
"""

from rest_framework import serializers
from .models import Book, BookPage, UserBookmark, ReadingProgress


class BookPageSerializer(serializers.ModelSerializer):
    """Serializer for book pages."""
    
    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = BookPage
        fields = [
            'id',
            'book_id',
            'page_number',
            'image_url',
            'thumbnail_url',
            'width',
            'height',
        ]
        read_only_fields = ['id', 'book_id', 'width', 'height']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image_url

    def get_thumbnail_url(self, obj):
        request = self.context.get('request')
        if obj.thumbnail and request:
            return request.build_absolute_uri(obj.thumbnail.url)
        return obj.thumbnail_url


class BookListSerializer(serializers.ModelSerializer):
    """Serializer for book list view."""
    
    thumbnail_url = serializers.SerializerMethodField()
    is_processed = serializers.BooleanField(read_only=True)
    uploaded_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Book
        fields = [
            'id',
            'title',
            'description',
            'page_count',
            'thumbnail_url',
            'file_size',
            'is_processed',
            'uploaded_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'page_count', 'file_size', 'is_processed', 'created_at', 'updated_at']

    def get_thumbnail_url(self, obj):
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
            'id',
            'title',
            'description',
            'page_count',
            'thumbnail_url',
            'file_size',
            'processing_status',
            'is_processed',
            'uploaded_by',
            'created_at',
            'updated_at',
            'pages',
        ]
        read_only_fields = ['id', 'page_count', 'file_size', 'processing_status', 'is_processed', 'created_at', 'updated_at', 'pages']

    def get_thumbnail_url(self, obj):
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
        # Validate file extension
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError('فقط فایل‌های PDF قابل قبول هستند.')
        
        # Validate file size (500MB)
        max_size = 500 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError(f'حداکثر حجم فایل 500 مگابایت است.')
        
        return value


class UploadResponseSerializer(serializers.Serializer):
    """Serializer for upload response."""
    
    book_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=['processing', 'completed', 'failed'])
    estimated_time = serializers.IntegerField(required=False)
    message = serializers.CharField(required=False)


class UserBookmarkSerializer(serializers.ModelSerializer):
    """Serializer for user bookmarks."""
    
    book_title = serializers.CharField(source='book.title', read_only=True)

    class Meta:
        model = UserBookmark
        fields = [
            'id',
            'book',
            'book_title',
            'page_number',
            'note',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ReadingProgressSerializer(serializers.ModelSerializer):
    """Serializer for reading progress."""
    
    book_title = serializers.CharField(source='book.title', read_only=True)

    class Meta:
        model = ReadingProgress
        fields = [
            'id',
            'book',
            'book_title',
            'current_page',
            'last_read_at',
        ]
        read_only_fields = ['id', 'last_read_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        instance, _ = ReadingProgress.objects.update_or_create(
            user=validated_data['user'],
            book=validated_data['book'],
            defaults={'current_page': validated_data['current_page']}
        )
        return instance
