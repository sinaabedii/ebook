"""
Management command to cleanup orphaned media files.
"""
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from core.models import Book, BookPage


class Command(BaseCommand):
    help = 'Cleanup orphaned media files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN - No files will be deleted"))
        
        # Get all referenced files
        pdf_files = set(Book.objects.exclude(pdf_file='').values_list('pdf_file', flat=True))
        thumbnails = set(Book.objects.exclude(thumbnail='').values_list('thumbnail', flat=True))
        page_images = set(BookPage.objects.exclude(image='').values_list('image', flat=True))
        page_thumbs = set(BookPage.objects.exclude(thumbnail='').values_list('thumbnail', flat=True))
        
        referenced_files = pdf_files | thumbnails | page_images | page_thumbs
        
        # Check media directories
        media_root = settings.MEDIA_ROOT
        orphaned_files = []
        total_size = 0
        
        for root, dirs, files in os.walk(media_root):
            for filename in files:
                filepath = os.path.join(root, filename)
                relative_path = os.path.relpath(filepath, media_root).replace('\\', '/')
                
                if relative_path not in referenced_files:
                    file_size = os.path.getsize(filepath)
                    orphaned_files.append((filepath, file_size))
                    total_size += file_size

        if not orphaned_files:
            self.stdout.write(self.style.SUCCESS("No orphaned files found"))
            return

        self.stdout.write(f"Found {len(orphaned_files)} orphaned files ({total_size / 1024 / 1024:.2f} MB)")
        
        for filepath, size in orphaned_files:
            if dry_run:
                self.stdout.write(f"  Would delete: {filepath} ({size / 1024:.1f} KB)")
            else:
                try:
                    os.remove(filepath)
                    self.stdout.write(f"  Deleted: {filepath}")
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"  Error deleting {filepath}: {e}"))

        if not dry_run:
            self.stdout.write(self.style.SUCCESS(
                f"\nDeleted {len(orphaned_files)} files ({total_size / 1024 / 1024:.2f} MB)"
            ))
