"""
Custom authentication backend for token-based auth.
"""
from typing import Optional, Tuple

from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request

from .models import UserSession

User = get_user_model()


class TokenAuthentication(BaseAuthentication):
    """
    Custom token authentication using UserSession model.

    Expects Authorization header in format: Bearer <token>
    """

    keyword = 'Bearer'

    def authenticate(self, request: Request) -> Optional[Tuple[User, UserSession]]:
        """
        Authenticate the request using the Authorization header.

        Returns:
            Tuple of (user, session) if authenticated, None otherwise.

        Raises:
            AuthenticationFailed: If token is invalid or user is inactive.
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header:
            return None

        parts = auth_header.split()

        if len(parts) != 2 or parts[0] != self.keyword:
            return None

        token = parts[1]

        try:
            session = UserSession.objects.select_related('user').get(
                token=token,
                is_active=True
            )
        except UserSession.DoesNotExist:
            raise AuthenticationFailed('توکن نامعتبر است.')

        if not session.user.is_active:
            raise AuthenticationFailed('حساب کاربری غیرفعال است.')

        # Update last activity timestamp
        session.save(update_fields=['last_activity'])

        return (session.user, session)

    def authenticate_header(self, request: Request) -> str:
        """
        Return the keyword for WWW-Authenticate header.
        """
        return self.keyword
