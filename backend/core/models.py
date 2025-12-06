"""
Core models for the E-Book Platform.
"""

import os
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator

User = get_user_model()


def book_upload_path(instance, filename):
    """Generate upload path for book PDF files."""
    return f'books/{instance.id}/{filename}'


def page_image_path(instance, filename):
    """Generate upload path for page images."""
    return f'pages/{instance.book.id}/{filename}'


def thumbnail_path(instance, filename):
    """Generate upload path for thumbnails."""
    return f'thumbnails/{instance.id}/{filename}'


class Book(models.Model):
    """Model representing a book/PDF document."""
    
    class ProcessingStatus(models.TextChoices):
        PENDING = 'pending', 'در انتظار'
        PROCESSING = 'processing', 'در حال پردازش'
        COMPLETED = 'completed', 'تکمیل شده'
        FAILED = 'failed', 'ناموفق'
    
    title = models.CharField(
        max_length=255,
        verbose_name='عنوان'
    )
    description = models.TextField(
        blank=True,
        verbose_name='توضیحات'
    )
    pdf_file = models.FileField(
        upload_to='pdfs/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf'])],
        verbose_name='فایل PDF'
    )
    thumbnail = models.ImageField(
        upload_to='thumbnails/',
        blank=True,
        null=True,
        verbose_name='تصویر جلد'
    )
    page_count = models.PositiveIntegerField(
        default=0,
        verbose_name='تعداد صفحات'
    )
    file_size = models.PositiveBigIntegerField(
        default=0,
        verbose_name='حجم فایل'
    )
    processing_status = models.CharField(
        max_length=20,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.PENDING,
        verbose_name='وضعیت پردازش'
    )
    processing_error = models.TextField(
        blank=True,
        verbose_name='خطای پردازش'
    )
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='books',
        verbose_name='آپلود شده توسط'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='تاریخ ایجاد'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='تاریخ بروزرسانی'
    )

    class Meta:
        verbose_name = 'کتاب'
        verbose_name_plural = 'کتاب‌ها'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def is_processed(self):
        return self.processing_status == self.ProcessingStatus.COMPLETED

    @property
    def thumbnail_url(self):
        if self.thumbnail:
            return self.thumbnail.url
        return None

    def delete(self, *args, **kwargs):
        # Delete associated files
        if self.pdf_file:
            if os.path.isfile(self.pdf_file.path):
                os.remove(self.pdf_file.path)
        if self.thumbnail:
            if os.path.isfile(self.thumbnail.path):
                os.remove(self.thumbnail.path)
        # Delete associated pages
        for page in self.pages.all():
            page.delete()
        super().delete(*args, **kwargs)


class BookPage(models.Model):
    """Model representing a single page of a book."""
    
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='pages',
        verbose_name='کتاب'
    )
    page_number = models.PositiveIntegerField(
        verbose_name='شماره صفحه'
    )
    image = models.ImageField(
        upload_to='pages/',
        verbose_name='تصویر صفحه'
    )
    thumbnail = models.ImageField(
        upload_to='page_thumbnails/',
        blank=True,
        null=True,
        verbose_name='تامبنیل'
    )
    width = models.PositiveIntegerField(
        default=0,
        verbose_name='عرض'
    )
    height = models.PositiveIntegerField(
        default=0,
        verbose_name='ارتفاع'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='تاریخ ایجاد'
    )

    class Meta:
        verbose_name = 'صفحه کتاب'
        verbose_name_plural = 'صفحات کتاب'
        ordering = ['book', 'page_number']
        unique_together = ['book', 'page_number']

    def __str__(self):
        return f'{self.book.title} - صفحه {self.page_number}'

    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return None

    @property
    def thumbnail_url(self):
        if self.thumbnail:
            return self.thumbnail.url
        return None

    def delete(self, *args, **kwargs):
        # Delete associated files
        if self.image:
            if os.path.isfile(self.image.path):
                os.remove(self.image.path)
        if self.thumbnail:
            if os.path.isfile(self.thumbnail.path):
                os.remove(self.thumbnail.path)
        super().delete(*args, **kwargs)


class UserBookmark(models.Model):
    """Model representing a user's bookmark in a book."""
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bookmarks',
        verbose_name='کاربر'
    )
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='bookmarks',
        verbose_name='کتاب'
    )
    page_number = models.PositiveIntegerField(
        verbose_name='شماره صفحه'
    )
    note = models.TextField(
        blank=True,
        verbose_name='یادداشت'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='تاریخ ایجاد'
    )

    class Meta:
        verbose_name = 'بوکمارک'
        verbose_name_plural = 'بوکمارک‌ها'
        ordering = ['-created_at']
        unique_together = ['user', 'book', 'page_number']

    def __str__(self):
        return f'{self.user.username} - {self.book.title} - صفحه {self.page_number}'


class ReadingProgress(models.Model):
    """Model to track user's reading progress."""
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reading_progress',
        verbose_name='کاربر'
    )
    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name='reading_progress',
        verbose_name='کتاب'
    )
    current_page = models.PositiveIntegerField(
        default=1,
        verbose_name='صفحه فعلی'
    )
    last_read_at = models.DateTimeField(
        auto_now=True,
        verbose_name='آخرین مطالعه'
    )

    class Meta:
        verbose_name = 'پیشرفت مطالعه'
        verbose_name_plural = 'پیشرفت‌های مطالعه'
        unique_together = ['user', 'book']

    def __str__(self):
        return f'{self.user.username} - {self.book.title} - صفحه {self.current_page}'
