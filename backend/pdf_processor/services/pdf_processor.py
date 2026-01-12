"""
PDF Processing Service for converting PDF to page images.
"""
from __future__ import annotations

import io
import logging
import os
from typing import Optional, Tuple

import PyPDF2
from django.conf import settings
from django.core.files.base import ContentFile
from PIL import Image

logger = logging.getLogger(__name__)


class PdfProcessorService:
    """Service for processing PDF files into page images."""

    # Default configuration
    DEFAULT_DPI = 150
    DEFAULT_PAGE_FORMAT = 'JPEG'
    DEFAULT_PAGE_QUALITY = 85
    DEFAULT_THUMBNAIL_SIZE = (200, 280)
    DEFAULT_THUMBNAIL_FORMAT = 'JPEG'
    DEFAULT_THUMBNAIL_QUALITY = 70

    def __init__(self) -> None:
        """Initialize processor with configuration from settings."""
        config = getattr(settings, 'PDF_PROCESSING', {})
        self.page_dpi = config.get('PAGE_IMAGE_DPI', self.DEFAULT_DPI)
        self.page_format = config.get('PAGE_IMAGE_FORMAT', self.DEFAULT_PAGE_FORMAT)
        self.page_quality = config.get('PAGE_IMAGE_QUALITY', self.DEFAULT_PAGE_QUALITY)
        self.thumbnail_size = config.get('THUMBNAIL_SIZE', self.DEFAULT_THUMBNAIL_SIZE)
        self.thumbnail_format = config.get('THUMBNAIL_FORMAT', self.DEFAULT_THUMBNAIL_FORMAT)
        self.thumbnail_quality = config.get('THUMBNAIL_QUALITY', self.DEFAULT_THUMBNAIL_QUALITY)

    def process_book(self, book) -> bool:
        """
        Process a book's PDF file into individual page images.

        Args:
            book: Book model instance

        Returns:
            True if processing was successful, False otherwise
        """
        from core.models import Book

        try:
            logger.info(f"Processing PDF for book: {book.title}")

            book.processing_status = Book.ProcessingStatus.PROCESSING
            book.save(update_fields=['processing_status'])

            pdf_path = book.pdf_file.path

            if not os.path.exists(pdf_path):
                raise FileNotFoundError(f"PDF file not found: {pdf_path}")

            # Get page count
            page_count = self._get_page_count(pdf_path)
            book.page_count = page_count
            book.save(update_fields=['page_count'])

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

            # Mark as completed
            book.processing_status = Book.ProcessingStatus.COMPLETED
            book.processing_error = ''
            book.save(update_fields=['processing_status', 'processing_error'])

            logger.info(f"Successfully processed book: {book.title}")
            return True

        except Exception as e:
            logger.exception(f"Error processing book {book.id}: {e}")
            book.processing_status = Book.ProcessingStatus.FAILED
            book.processing_error = str(e)
            book.save(update_fields=['processing_status', 'processing_error'])
            return False

    def _get_page_count(self, pdf_path: str) -> int:
        """Get the number of pages in a PDF file."""
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            return len(reader.pages)

    def _process_page(self, book, pdf_path: str, page_num: int) -> None:
        """
        Process a single page of the PDF.

        Args:
            book: Book model instance
            pdf_path: Path to the PDF file
            page_num: Page number (1-indexed)
        """
        from core.models import BookPage

        # Render page to image
        page_image = self._render_page_image(pdf_path, page_num)

        if page_image is None:
            raise ValueError(f"Failed to render page {page_num}")

        width, height = page_image.size

        # Create content files
        page_content = self._image_to_content(
            page_image, self.page_format, self.page_quality
        )
        thumbnail_image = self._create_thumbnail(page_image)
        thumbnail_content = self._image_to_content(
            thumbnail_image, self.thumbnail_format, self.thumbnail_quality
        )

        # Create or update BookPage
        page, _ = BookPage.objects.update_or_create(
            book=book,
            page_number=page_num,
            defaults={'width': width, 'height': height}
        )

        # Save files
        page_filename = f"page_{book.id}_{page_num}.{self.page_format.lower()}"
        thumb_filename = f"thumb_{book.id}_{page_num}.{self.thumbnail_format.lower()}"

        page.image.save(page_filename, page_content, save=False)
        page.thumbnail.save(thumb_filename, thumbnail_content, save=False)
        page.save()

    def _render_page_image(self, pdf_path: str, page_num: int) -> Optional[Image.Image]:
        """
        Render a PDF page to an image.

        Tries multiple backends in order: pypdfium2, pdf2image, PyMuPDF, placeholder.
        """
        # Try pypdfium2 first (works well on Windows)
        image = self._try_pypdfium2(pdf_path, page_num)
        if image:
            return image

        # Try pdf2image (requires poppler)
        image = self._try_pdf2image(pdf_path, page_num)
        if image:
            return image

        # Try PyMuPDF
        image = self._try_pymupdf(pdf_path, page_num)
        if image:
            return image

        # Fallback to placeholder
        return self._create_placeholder_image(page_num)

    def _try_pypdfium2(self, pdf_path: str, page_num: int) -> Optional[Image.Image]:
        """Try rendering with pypdfium2."""
        try:
            import pypdfium2 as pdfium
            pdf = pdfium.PdfDocument(pdf_path)
            page = pdf[page_num - 1]
            scale = self.page_dpi / 72
            bitmap = page.render(scale=scale)
            img = bitmap.to_pil()
            pdf.close()
            return img
        except ImportError:
            logger.debug("pypdfium2 not available")
        except Exception as e:
            logger.warning(f"pypdfium2 failed: {e}")
        return None

    def _try_pdf2image(self, pdf_path: str, page_num: int) -> Optional[Image.Image]:
        """Try rendering with pdf2image."""
        try:
            from pdf2image import convert_from_path
            images = convert_from_path(
                pdf_path,
                dpi=self.page_dpi,
                first_page=page_num,
                last_page=page_num,
            )
            return images[0] if images else None
        except ImportError:
            logger.debug("pdf2image not available")
        except Exception as e:
            logger.warning(f"pdf2image failed: {e}")
        return None

    def _try_pymupdf(self, pdf_path: str, page_num: int) -> Optional[Image.Image]:
        """Try rendering with PyMuPDF."""
        try:
            import fitz
            doc = fitz.open(pdf_path)
            page = doc.load_page(page_num - 1)
            zoom = self.page_dpi / 72
            matrix = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=matrix)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            doc.close()
            return img
        except ImportError:
            logger.debug("PyMuPDF not available")
        except Exception as e:
            logger.warning(f"PyMuPDF failed: {e}")
        return None

    def _create_placeholder_image(self, page_num: int) -> Image.Image:
        """Create a placeholder image for a page."""
        # A4 dimensions at target DPI
        width = int(595 * self.page_dpi / 72)
        height = int(842 * self.page_dpi / 72)

        img = Image.new('RGB', (width, height), color='#FDF5E6')

        try:
            from PIL import ImageDraw, ImageFont
            draw = ImageDraw.Draw(img)

            try:
                font = ImageFont.truetype("arial.ttf", 48)
            except OSError:
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

    def _image_to_content(
        self,
        image: Image.Image,
        format: str,
        quality: int
    ) -> ContentFile:
        """Convert PIL Image to Django ContentFile."""
        buffer = io.BytesIO()

        # Convert to RGB if necessary (for JPEG)
        if format.upper() == 'JPEG' and image.mode in ('RGBA', 'P'):
            image = image.convert('RGB')

        image.save(buffer, format=format, quality=quality, optimize=True)
        buffer.seek(0)

        return ContentFile(buffer.read())

    def _generate_book_thumbnail(self, book, first_page) -> None:
        """Generate book cover thumbnail from first page."""
        try:
            if first_page.thumbnail:
                filename = f"cover_{book.id}.{self.thumbnail_format.lower()}"
                book.thumbnail.save(filename, first_page.thumbnail, save=True)
                logger.info(f"Generated book thumbnail for: {book.title}")
        except Exception as e:
            logger.error(f"Error generating book thumbnail: {e}")
