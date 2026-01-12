"""
Authentication views for phone-based login/register.
"""
from __future__ import annotations

import logging
import secrets
from datetime import timedelta
from typing import Optional, Tuple

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.http import HttpRequest
from django.utils import timezone
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import OTPCode, Organization, UserSession
from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    RegisterSerializer,
    UserProfileSerializer,
    UserSerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)

# =============================================================================
# Constants
# =============================================================================

ACCESS_TOKEN_EXPIRY_HOURS = 24
REFRESH_TOKEN_EXPIRY_DAYS = 30
MAX_OTP_REQUESTS_PER_HOUR = 5
OTP_EXPIRY_SECONDS = 300  # 5 minutes


# =============================================================================
# Helper Functions
# =============================================================================

def get_client_ip(request: HttpRequest) -> Optional[str]:
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def create_user_session(user: User, request: HttpRequest) -> Tuple[str, UserSession]:
    """Create a new session for user and return token."""
    token = secrets.token_urlsafe(32)

    session = UserSession.objects.create(
        user=user,
        token=token,
        device_info=request.META.get('HTTP_USER_AGENT', '')[:255],
        ip_address=get_client_ip(request),
    )

    return token, session


def build_token_response(token: str, user: User) -> dict:
    """Build standard token response dictionary."""
    return {
        'access_token': token,
        'token_type': 'Bearer',
        'expires_in': ACCESS_TOKEN_EXPIRY_HOURS * 3600,
        'user': UserSerializer(user).data
    }


# =============================================================================
# OTP Views
# =============================================================================

class RequestOTPView(APIView):
    """Request OTP code for phone verification."""

    permission_classes = [AllowAny]

    @swagger_auto_schema(request_body=OTPRequestSerializer)
    def post(self, request: HttpRequest) -> Response:
        """Send OTP code to phone number."""
        serializer = OTPRequestSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone = serializer.validated_data['phone']

        # Rate limiting check
        if self._is_rate_limited(phone):
            return Response(
                {'error': 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Create OTP
        otp = OTPCode.create_for_phone(phone)

        # TODO: Send SMS via SMS provider (Kavenegar, etc.)
        logger.info(f"OTP for {phone}: {otp.code}")

        response_data = {
            'message': 'کد تایید ارسال شد.',
            'expires_in': OTP_EXPIRY_SECONDS,
        }

        # Include debug code only in DEBUG mode
        if settings.DEBUG:
            response_data['debug_code'] = otp.code

        return Response(response_data)

    @staticmethod
    def _is_rate_limited(phone: str) -> bool:
        """Check if phone has exceeded OTP request limit."""
        one_hour_ago = timezone.now() - timedelta(hours=1)
        recent_requests = OTPCode.objects.filter(
            phone=phone,
            created_at__gte=one_hour_ago
        ).count()
        return recent_requests >= MAX_OTP_REQUESTS_PER_HOUR


class VerifyOTPView(APIView):
    """Verify OTP code."""

    permission_classes = [AllowAny]

    @swagger_auto_schema(request_body=OTPVerifySerializer)
    def post(self, request: HttpRequest) -> Response:
        """Verify OTP code and return status."""
        serializer = OTPVerifySerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone = serializer.validated_data['phone']
        code = serializer.validated_data['code']

        # Find valid OTP
        otp = OTPCode.objects.filter(
            phone=phone,
            code=code,
            is_used=False
        ).first()

        if not otp:
            return Response(
                {'error': 'کد تایید نامعتبر است.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp.is_expired:
            return Response(
                {'error': 'کد تایید منقضی شده است.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_exists = User.objects.filter(phone=phone).exists()

        return Response({
            'valid': True,
            'user_exists': user_exists,
            'message': 'کد تایید صحیح است.'
        })


# =============================================================================
# Authentication Views
# =============================================================================

class RegisterView(APIView):
    """Register new user with phone verification."""

    permission_classes = [AllowAny]

    @swagger_auto_schema(request_body=RegisterSerializer)
    def post(self, request: HttpRequest) -> Response:
        """Register a new user."""
        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone = serializer.validated_data['phone']
        code = serializer.validated_data['code']

        # Verify OTP
        otp = self._get_valid_otp(phone, code)
        if not otp:
            return Response(
                {'error': 'کد تایید نامعتبر یا منقضی شده است.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get organization if provided
        organization = self._get_organization(serializer.validated_data.get('organization_code'))
        if organization and not organization.can_add_users:
            return Response(
                {'error': 'ظرفیت سازمان تکمیل شده است.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Mark OTP as used
            otp.is_used = True
            otp.save(update_fields=['is_used'])

            # Create user
            user = User.objects.create_user(
                phone=phone,
                first_name=serializer.validated_data.get('first_name', ''),
                last_name=serializer.validated_data.get('last_name', ''),
                organization=organization,
                is_verified=True,
            )

            # Set password if provided
            password = serializer.validated_data.get('password')
            if password:
                user.set_password(password)
                user.save(update_fields=['password'])

            # Create session
            token, _ = create_user_session(user, request)

        logger.info(f"New user registered: {phone}")

        response_data = build_token_response(token, user)
        response_data['message'] = 'ثبت‌نام با موفقیت انجام شد.'

        return Response(response_data, status=status.HTTP_201_CREATED)

    @staticmethod
    def _get_valid_otp(phone: str, code: str) -> Optional[OTPCode]:
        """Get valid OTP or None."""
        otp = OTPCode.objects.filter(
            phone=phone,
            code=code,
            is_used=False
        ).first()
        return otp if otp and not otp.is_expired else None

    @staticmethod
    def _get_organization(org_code: Optional[str]) -> Optional[Organization]:
        """Get organization by code/slug."""
        if not org_code:
            return None
        return Organization.objects.filter(slug=org_code, is_active=True).first()


class LoginView(APIView):
    """Login with phone and OTP."""

    permission_classes = [AllowAny]

    @swagger_auto_schema(request_body=LoginSerializer)
    def post(self, request: HttpRequest) -> Response:
        """Login user with phone and OTP."""
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone = serializer.validated_data['phone']
        code = serializer.validated_data['code']

        # Verify OTP
        otp = OTPCode.objects.filter(
            phone=phone,
            code=code,
            is_used=False
        ).first()

        if not otp or otp.is_expired:
            return Response(
                {'error': 'کد تایید نامعتبر یا منقضی شده است.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get user
        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            return Response(
                {
                    'error': 'کاربری با این شماره یافت نشد. لطفاً ابتدا ثبت‌نام کنید.',
                    'should_register': True
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if not user.is_active:
            return Response(
                {'error': 'حساب کاربری شما غیرفعال شده است.'},
                status=status.HTTP_403_FORBIDDEN
            )

        with transaction.atomic():
            # Mark OTP as used
            otp.is_used = True
            otp.save(update_fields=['is_used'])

            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])

            # Create session
            token, _ = create_user_session(user, request)

        logger.info(f"User logged in: {phone}")

        return Response(build_token_response(token, user))


class LogoutView(APIView):
    """Logout and invalidate session."""

    permission_classes = [IsAuthenticated]

    def post(self, request: HttpRequest) -> Response:
        """Logout user."""
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            UserSession.objects.filter(token=token).update(is_active=False)

        return Response({'message': 'خروج با موفقیت انجام شد.'})


# =============================================================================
# Profile Views
# =============================================================================

class ProfileView(APIView):
    """User profile management."""

    permission_classes = [IsAuthenticated]

    def get(self, request: HttpRequest) -> Response:
        """Get current user profile."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @swagger_auto_schema(request_body=UserProfileSerializer)
    def patch(self, request: HttpRequest) -> Response:
        """Update user profile."""
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    """Change user password."""

    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(request_body=ChangePasswordSerializer)
    def post(self, request: HttpRequest) -> Response:
        """Change password."""
        serializer = ChangePasswordSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'error': 'رمز عبور فعلی صحیح نیست.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])

        return Response({'message': 'رمز عبور با موفقیت تغییر کرد.'})
