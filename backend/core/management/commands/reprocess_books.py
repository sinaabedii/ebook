"""
Management command to reprocess PDF books.
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from core.models import Book
from pdf_processor.services import PdfProcessorService


class Command(BaseCommand):
    help = 'Reprocess PDF files for books'

    def add_arguments(self, parser):
        parser.add_argument(
            '--book-id',
            type=int,
            help='Reprocess specific book by ID',
        )
        parser.add_argument(
            '--failed-only',
            action='store_true',
            help='Only reprocess failed books',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Reprocess all books',
        )

    def handle(self, *args, **options):
        processor = PdfProcessorService()
        
        if options['book_id']:
            books = Book.objects.filter(id=options['book_id'])
            if not books.exists():
                raise CommandError(f"Book with ID {options['book_id']} not found")
        elif options['failed_only']:
            books = Book.objects.filter(processing_status=Book.ProcessingStatus.FAILED)
        elif options['all']:
            books = Book.objects.all()
        else:
            self.stdout.write(self.style.WARNING(
                'Please specify --book-id, --failed-only, or --all'
            ))
            return

        total = books.count()
        success_count = 0
        fail_count = 0

        self.stdout.write(f"Processing {total} book(s)...")

        for i, book in enumerate(books, 1):
            self.stdout.write(f"\n[{i}/{total}] Processing: {book.title[:50]}...")
            
            try:
                with transaction.atomic():
                    # Delete existing pages
                    deleted_count = book.pages.all().delete()[0]
                    if deleted_count:
                        self.stdout.write(f"  Deleted {deleted_count} existing pages")
                    
                    # Reset status
                    book.processing_status = Book.ProcessingStatus.PROCESSING
                    book.processing_error = ''
                    book.save(update_fields=['processing_status', 'processing_error'])
                
                # Process book
                success = processor.process_book(book)
                
                if success:
                    success_count += 1
                    self.stdout.write(self.style.SUCCESS(
                        f"  Done! {book.pages.count()} pages created"
                    ))
                else:
                    fail_count += 1
                    self.stdout.write(self.style.ERROR(
                        f"  Failed: {book.processing_error}"
                    ))
                    
            except Exception as e:
                fail_count += 1
                self.stdout.write(self.style.ERROR(f"  Error: {e}"))

        self.stdout.write("\n" + "=" * 50)
        self.stdout.write(self.style.SUCCESS(f"Success: {success_count}"))
        if fail_count:
            self.stdout.write(self.style.ERROR(f"Failed: {fail_count}"))
