"""
Celery tasks for PDF processing.
"""
from __future__ import annotations

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_pdf_task(self, book_id: int) -> None:
    """
    Process a PDF file asynchronously.

    Args:
        book_id: ID of the Book instance to process
    """
    from core.models import Book
    from pdf_processor.services import PdfProcessorService

    try:
        book = Book.objects.get(id=book_id)
        logger.info(f"Starting PDF processing for book: {book.title} (ID: {book_id})")

        processor = PdfProcessorService()
        success = processor.process_book(book)

        if success:
            logger.info(f"Successfully processed book: {book.title} (ID: {book_id})")
        else:
            logger.error(f"Failed to process book: {book.title} (ID: {book_id})")

    except Book.DoesNotExist:
        logger.error(f"Book with ID {book_id} does not exist")

    except Exception as exc:
        logger.exception(f"Error processing book {book_id}: {exc}")

        # Update book status to failed
        try:
            book = Book.objects.get(id=book_id)
            book.processing_status = Book.ProcessingStatus.FAILED
            book.processing_error = str(exc)
            book.save(update_fields=['processing_status', 'processing_error'])
        except Book.DoesNotExist:
            pass

        # Retry the task
        raise self.retry(exc=exc)


@shared_task
def cleanup_temp_files() -> int:
    """
    Cleanup temporary files created during PDF processing.

    Returns:
        Number of files deleted
    """
    import glob
    import os
    import time

    from django.conf import settings

    temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp')
    deleted_count = 0

    if not os.path.exists(temp_dir):
        return 0

    current_time = time.time()
    max_age_seconds = 3600  # 1 hour

    for file_path in glob.glob(os.path.join(temp_dir, '*')):
        if not os.path.isfile(file_path):
            continue

        file_age = current_time - os.path.getmtime(file_path)
        if file_age > max_age_seconds:
            try:
                os.remove(file_path)
                logger.info(f"Deleted temp file: {file_path}")
                deleted_count += 1
            except OSError as e:
                logger.error(f"Error deleting temp file {file_path}: {e}")

    return deleted_count


@shared_task
def regenerate_thumbnails(book_id: int) -> bool:
    """
    Regenerate thumbnails for a book.

    Args:
        book_id: ID of the Book instance

    Returns:
        True if successful, False otherwise
    """
    from core.models import Book
    from pdf_processor.services import PdfProcessorService

    try:
        book = Book.objects.get(id=book_id)
        processor = PdfProcessorService()

        if book.pages.exists():
            first_page = book.pages.first()
            processor._generate_book_thumbnail(book, first_page)

        logger.info(f"Regenerated thumbnails for book: {book.title}")
        return True

    except Book.DoesNotExist:
        logger.error(f"Book with ID {book_id} does not exist")
        return False

    except Exception as exc:
        logger.exception(f"Error regenerating thumbnails for book {book_id}: {exc}")
        return False
