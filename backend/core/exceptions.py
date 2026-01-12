"""
Custom exceptions for the E-Book Platform.
"""
from rest_framework import status
from rest_framework.exceptions import APIException


class BookNotFoundError(APIException):
    """Raised when a book is not found."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'کتاب مورد نظر یافت نشد.'
    default_code = 'book_not_found'


class BookProcessingError(APIException):
    """Raised when PDF processing fails."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'خطا در پردازش فایل PDF.'
    default_code = 'processing_error'


class InvalidFileError(APIException):
    """Raised when uploaded file is invalid."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'فایل نامعتبر است.'
    default_code = 'invalid_file'


class FileTooLargeError(APIException):
    """Raised when file exceeds size limit."""
    status_code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    default_detail = 'حجم فایل بیش از حد مجاز است.'
    default_code = 'file_too_large'


class PageNotFoundError(APIException):
    """Raised when a page is not found."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'صفحه مورد نظر یافت نشد.'
    default_code = 'page_not_found'


class BookNotProcessedError(APIException):
    """Raised when trying to access pages of unprocessed book."""
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'کتاب هنوز پردازش نشده است.'
    default_code = 'book_not_processed'
