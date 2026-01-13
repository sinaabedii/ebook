"""
Common utility functions.
"""
import re
from typing import Optional


def extract_title_from_filename(filename: str) -> str:
    """Extract clean title from filename."""
    title = filename.rsplit('.', 1)[0]
    title = re.sub(r'[_-]+', ' ', title)
    title = re.sub(r'\s+', ' ', title).strip()
    return title


def format_file_size(size_bytes: int) -> str:
    """Format file size in human-readable format."""
    if size_bytes < 1024:
        return f'{size_bytes} B'
    elif size_bytes < 1024 * 1024:
        return f'{size_bytes / 1024:.1f} KB'
    elif size_bytes < 1024 * 1024 * 1024:
        return f'{size_bytes / (1024 * 1024):.1f} MB'
    else:
        return f'{size_bytes / (1024 * 1024 * 1024):.1f} GB'


def get_client_ip(request) -> Optional[str]:
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
