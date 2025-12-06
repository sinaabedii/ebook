"""
Celery tasks for PDF processing.
"""

import logging
from celery import shared_task
from .services.pdf_processor import PdfProcessorService

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_pdf_task(self, book_id: int):
    """
    Process a PDF file asynchronously.
    
    Args:
        book_id: ID of the Book instance to process
    """
    from core.models import Book
    
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
            book.save()
        except:
            pass
        
        # Retry the task
        raise self.retry(exc=exc)


@shared_task
def cleanup_temp_files():
    """
    Cleanup temporary files created during PDF processing.
    """
    import os
    import glob
    from django.conf import settings
    
    temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp')
    
    if os.path.exists(temp_dir):
        # Delete files older than 1 hour
        import time
        current_time = time.time()
        
        for file_path in glob.glob(os.path.join(temp_dir, '*')):
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getmtime(file_path)
                if file_age > 3600:  # 1 hour
                    try:
                        os.remove(file_path)
                        logger.info(f"Deleted temp file: {file_path}")
                    except Exception as e:
                        logger.error(f"Error deleting temp file {file_path}: {e}")


@shared_task
def regenerate_thumbnails(book_id: int):
    """
    Regenerate thumbnails for a book.
    """
    from core.models import Book
    
    try:
        book = Book.objects.get(id=book_id)
        processor = PdfProcessorService()
        
        # Generate book cover thumbnail
        if book.pages.exists():
            first_page = book.pages.first()
            processor._generate_book_thumbnail(book, first_page)
            
        logger.info(f"Regenerated thumbnails for book: {book.title}")
        
    except Book.DoesNotExist:
        logger.error(f"Book with ID {book_id} does not exist")
    except Exception as exc:
        logger.exception(f"Error regenerating thumbnails for book {book_id}: {exc}")
