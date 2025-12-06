"""
PDF Processing Service for converting PDF to page images.
"""

import os
import io
import logging
from pathlib import Path
from typing import Optional, Tuple, List

from django.conf import settings
from django.core.files.base import ContentFile
from PIL import Image
import PyPDF2

logger = logging.getLogger(__name__)


class PdfProcessorService:
    """Service for processing PDF files into page images."""
    
    def __init__(self):
        self.config = getattr(settings, 'PDF_PROCESSING', {})
        self.page_dpi = self.config.get('PAGE_IMAGE_DPI', 150)
        self.page_format = self.config.get('PAGE_IMAGE_FORMAT', 'JPEG')
        self.page_quality = self.config.get('PAGE_IMAGE_QUALITY', 85)
        self.thumbnail_size = self.config.get('THUMBNAIL_SIZE', (200, 280))
        self.thumbnail_format = self.config.get('THUMBNAIL_FORMAT', 'JPEG')
        self.thumbnail_quality = self.config.get('THUMBNAIL_QUALITY', 70)
    
    def process_book(self, book) -> bool:
        """
        Process a book's PDF file into individual page images.
        
        Args:
            book: Book model instance
            
        Returns:
            bool: True if processing was successful
        """
        from core.models import Book, BookPage
        
        try:
            logger.info(f"Processing PDF for book: {book.title}")
            
            # Update status to processing
            book.processing_status = Book.ProcessingStatus.PROCESSING
            book.save()
            
            # Get PDF file path
            pdf_path = book.pdf_file.path
            
            if not os.path.exists(pdf_path):
                raise FileNotFoundError(f"PDF file not found: {pdf_path}")
            
            # Get page count and process pages
            page_count = self._get_page_count(pdf_path)
            book.page_count = page_count
            book.save()
            
            logger.info(f"PDF has {page_count} pages")
            
            # Process each page
            for page_num in range(1, page_count + 1):
                try:
                    self._process_page(book, pdf_path, page_num)
                    logger.info(f"Processed page {page_num}/{page_count}")
                except Exception as e:
                    logger.error(f"Error processing page {page_num}: {e}")
                    continue
            
            # Generate book thumbnail from first page
            first_page = book.pages.first()
            if first_page:
                self._generate_book_thumbnail(book, first_page)
            
            # Update status to completed
            book.processing_status = Book.ProcessingStatus.COMPLETED
            book.processing_error = ''
            book.save()
            
            logger.info(f"Successfully processed book: {book.title}")
            return True
            
        except Exception as e:
            logger.exception(f"Error processing book {book.id}: {e}")
            book.processing_status = Book.ProcessingStatus.FAILED
            book.processing_error = str(e)
            book.save()
            return False
    
    def _get_page_count(self, pdf_path: str) -> int:
        """Get the number of pages in a PDF file."""
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            return len(reader.pages)
    
    def _process_page(self, book, pdf_path: str, page_num: int):
        """
        Process a single page of the PDF.
        
        Args:
            book: Book model instance
            pdf_path: Path to the PDF file
            page_num: Page number (1-indexed)
        """
        from core.models import BookPage
        
        # Convert PDF page to image using pdf2image or fallback
        page_image = self._render_page_image(pdf_path, page_num)
        
        if page_image is None:
            raise ValueError(f"Failed to render page {page_num}")
        
        # Get image dimensions
        width, height = page_image.size
        
        # Save page image
        page_image_content = self._image_to_content(page_image, self.page_format, self.page_quality)
        
        # Create thumbnail
        thumbnail_image = self._create_thumbnail(page_image)
        thumbnail_content = self._image_to_content(thumbnail_image, self.thumbnail_format, self.thumbnail_quality)
        
        # Create or update BookPage
        page, created = BookPage.objects.update_or_create(
            book=book,
            page_number=page_num,
            defaults={
                'width': width,
                'height': height,
            }
        )
        
        # Save files
        page_filename = f"page_{book.id}_{page_num}.{self.page_format.lower()}"
        thumb_filename = f"thumb_{book.id}_{page_num}.{self.thumbnail_format.lower()}"
        
        page.image.save(page_filename, page_image_content, save=False)
        page.thumbnail.save(thumb_filename, thumbnail_content, save=False)
        page.save()
    
    def _render_page_image(self, pdf_path: str, page_num: int) -> Optional[Image.Image]:
        """
        Render a PDF page to an image.
        
        Tries to use pdf2image (requires poppler), falls back to PyMuPDF if available,
        or creates a placeholder image.
        """
        # Try pdf2image first (best quality)
        try:
            from pdf2image import convert_from_path
            images = convert_from_path(
                pdf_path,
                dpi=self.page_dpi,
                first_page=page_num,
                last_page=page_num,
            )
            if images:
                return images[0]
        except ImportError:
            logger.warning("pdf2image not available, trying alternative method")
        except Exception as e:
            logger.warning(f"pdf2image failed: {e}, trying alternative method")
        
        # Try PyMuPDF (fitz)
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(pdf_path)
            page = doc.load_page(page_num - 1)  # 0-indexed
            
            # Render page to pixmap
            zoom = self.page_dpi / 72  # Default PDF DPI is 72
            matrix = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=matrix)
            
            # Convert to PIL Image
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            doc.close()
            return img
        except ImportError:
            logger.warning("PyMuPDF not available, creating placeholder")
        except Exception as e:
            logger.warning(f"PyMuPDF failed: {e}, creating placeholder")
        
        # Fallback: Create a placeholder image
        return self._create_placeholder_image(page_num)
    
    def _create_placeholder_image(self, page_num: int) -> Image.Image:
        """Create a placeholder image for a page."""
        # Create a simple placeholder with page number
        width = int(595 * self.page_dpi / 72)  # A4 width at target DPI
        height = int(842 * self.page_dpi / 72)  # A4 height at target DPI
        
        img = Image.new('RGB', (width, height), color='#FDF5E6')  # Paper color
        
        # Add page number text (requires pillow with freetype)
        try:
            from PIL import ImageDraw, ImageFont
            draw = ImageDraw.Draw(img)
            
            # Try to use a font, fall back to default
            try:
                font = ImageFont.truetype("arial.ttf", 48)
            except:
                font = ImageFont.load_default()
            
            text = f"صفحه {page_num}"
            text_bbox = draw.textbbox((0, 0), text, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]
            
            x = (width - text_width) // 2
            y = (height - text_height) // 2
            
            draw.text((x, y), text, fill='#666666', font=font)
        except Exception as e:
            logger.warning(f"Could not add text to placeholder: {e}")
        
        return img
    
    def _create_thumbnail(self, image: Image.Image) -> Image.Image:
        """Create a thumbnail from an image."""
        thumbnail = image.copy()
        thumbnail.thumbnail(self.thumbnail_size, Image.Resampling.LANCZOS)
        return thumbnail
    
    def _image_to_content(self, image: Image.Image, format: str, quality: int) -> ContentFile:
        """Convert PIL Image to Django ContentFile."""
        buffer = io.BytesIO()
        
        # Convert to RGB if necessary (for JPEG)
        if format.upper() == 'JPEG' and image.mode in ('RGBA', 'P'):
            image = image.convert('RGB')
        
        image.save(buffer, format=format, quality=quality, optimize=True)
        buffer.seek(0)
        
        return ContentFile(buffer.read())
    
    def _generate_book_thumbnail(self, book, first_page):
        """Generate book cover thumbnail from first page."""
        try:
            if first_page.thumbnail:
                # Copy first page thumbnail as book thumbnail
                book.thumbnail.save(
                    f"cover_{book.id}.{self.thumbnail_format.lower()}",
                    first_page.thumbnail,
                    save=True
                )
                logger.info(f"Generated book thumbnail for: {book.title}")
        except Exception as e:
            logger.error(f"Error generating book thumbnail: {e}")
