"""
Django Admin configuration for the E-Book Platform.
"""

from django.contrib import admin
from django.utils.html import format_html
from .models import Book, BookPage, UserBookmark, ReadingProgress


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    """Admin configuration for Book model."""
    
    list_display = [
        'id',
        'title',
        'page_count',
        'file_size_display',
        'processing_status',
        'uploaded_by',
        'created_at',
        'thumbnail_preview',
    ]
    list_filter = ['processing_status', 'created_at', 'uploaded_by']
    search_fields = ['title', 'description']
    readonly_fields = [
        'page_count',
        'file_size',
        'processing_status',
        'processing_error',
        'created_at',
        'updated_at',
        'thumbnail_preview_large',
    ]
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('title', 'description', 'pdf_file', 'thumbnail')
        }),
        ('اطلاعات پردازش', {
            'fields': ('page_count', 'file_size', 'processing_status', 'processing_error'),
            'classes': ('collapse',),
        }),
        ('اطلاعات تکمیلی', {
            'fields': ('uploaded_by', 'created_at', 'updated_at', 'thumbnail_preview_large'),
            'classes': ('collapse',),
        }),
    )
    
    actions = ['reprocess_pdf', 'mark_as_completed']

    def file_size_display(self, obj):
        """Display file size in human-readable format."""
        size = obj.file_size
        if size < 1024:
            return f'{size} B'
        elif size < 1024 * 1024:
            return f'{size / 1024:.1f} KB'
        else:
            return f'{size / (1024 * 1024):.1f} MB'
    file_size_display.short_description = 'حجم فایل'

    def thumbnail_preview(self, obj):
        """Display small thumbnail preview."""
        if obj.thumbnail:
            return format_html(
                '<img src="{}" style="max-height: 50px; max-width: 35px;" />',
                obj.thumbnail.url
            )
        return '-'
    thumbnail_preview.short_description = 'پیش‌نمایش'

    def thumbnail_preview_large(self, obj):
        """Display large thumbnail preview."""
        if obj.thumbnail:
            return format_html(
                '<img src="{}" style="max-height: 300px; max-width: 200px;" />',
                obj.thumbnail.url
            )
        return '-'
    thumbnail_preview_large.short_description = 'تصویر جلد'

    @admin.action(description='پردازش مجدد PDF')
    def reprocess_pdf(self, request, queryset):
        """Re-process selected PDFs."""
        from .tasks import process_pdf_task
        
        for book in queryset:
            book.processing_status = Book.ProcessingStatus.PROCESSING
            book.processing_error = ''
            book.save()
            process_pdf_task.delay(book.id)
        
        self.message_user(request, f'{queryset.count()} کتاب برای پردازش مجدد ارسال شد.')

    @admin.action(description='علامت‌گذاری به عنوان تکمیل شده')
    def mark_as_completed(self, request, queryset):
        """Mark selected books as completed."""
        queryset.update(processing_status=Book.ProcessingStatus.COMPLETED)
        self.message_user(request, f'{queryset.count()} کتاب به عنوان تکمیل شده علامت‌گذاری شد.')


@admin.register(BookPage)
class BookPageAdmin(admin.ModelAdmin):
    """Admin configuration for BookPage model."""
    
    list_display = ['id', 'book', 'page_number', 'width', 'height', 'image_preview']
    list_filter = ['book', 'created_at']
    search_fields = ['book__title']
    ordering = ['book', 'page_number']
    readonly_fields = ['width', 'height', 'created_at', 'image_preview_large']

    def image_preview(self, obj):
        """Display small image preview."""
        if obj.thumbnail:
            return format_html(
                '<img src="{}" style="max-height: 50px; max-width: 35px;" />',
                obj.thumbnail.url
            )
        elif obj.image:
            return format_html(
                '<img src="{}" style="max-height: 50px; max-width: 35px;" />',
                obj.image.url
            )
        return '-'
    image_preview.short_description = 'پیش‌نمایش'

    def image_preview_large(self, obj):
        """Display large image preview."""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 500px; max-width: 400px;" />',
                obj.image.url
            )
        return '-'
    image_preview_large.short_description = 'تصویر صفحه'


@admin.register(UserBookmark)
class UserBookmarkAdmin(admin.ModelAdmin):
    """Admin configuration for UserBookmark model."""
    
    list_display = ['id', 'user', 'book', 'page_number', 'created_at']
    list_filter = ['book', 'created_at', 'user']
    search_fields = ['user__username', 'book__title', 'note']
    ordering = ['-created_at']


@admin.register(ReadingProgress)
class ReadingProgressAdmin(admin.ModelAdmin):
    """Admin configuration for ReadingProgress model."""
    
    list_display = ['id', 'user', 'book', 'current_page', 'last_read_at']
    list_filter = ['book', 'last_read_at', 'user']
    search_fields = ['user__username', 'book__title']
    ordering = ['-last_read_at']
