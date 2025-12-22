"""
Authentication views for phone-based login/register.
"""
import logging
import secrets
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from drf_yasg.utils import swagger_auto_schema

from .models import Organization, OTPCode, UserSession
from .serializers import (
    OTPRequestSerializer,
    OTPVerifySerializer,
    RegisterSerializer,
    LoginSerializer,
    TokenSerializer,
    UserSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)

# Token expiry settings
ACCESS_TOKEN_EXPIRY_HOURS = 24
REFRESH_TOKEN_EXPIRY_DAYS = 30


class RequestOTPView(APIView):
    """Request OTP code for phone verification."""
    
    permission_classes = [AllowAny]

    @swagger_auto_schema(request_body=OTPRequestSerializer)
    def post(self, request):
        """Send OTP code to phone number."""
        serializer = OTPRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        phone = serializer.validated_data['phone']
        
        # Rate limiting - max 5 OTP requests per hour
        one_hour_ago = timezone.now() - timedelta(hours=1)
        recent_requests = OTPCode.objects.filter(
            phone=phone,
            created_at__gte=one_hour_ago
        ).count()
        
        if recent_requests >= 5:
            return Response({
                'error': 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Create OTP
        otp = OTPCode.create_for_phone(phone)
        
        # TODO: Send SMS via SMS provider (Kavenegar, etc.)
        # For now, log the code (development only!)
        logger.info(f"OTP for {phone}: {otp.code}")
        
        # In production, remove this line and actually send SMS
        return Response({
            'message': 'کد تایید ارسال شد.',
            'expires_in': 300,  # 5 minutes
            # Remove this in production!
            'debug_code': otp.code if settings.DEBUG else None
        })


class VerifyOTPView(APIView):
    """Verify OTP code."""
    
    permission_classes = [AllowAny]

    @swagger_auto_schema(request_body=OTPVerifySerializer)
    def post(self, request):
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
            return Response({
                'error': 'کد تایید نامعتبر است.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if otp.is_expired:
            return Response({
                'error': 'کد تایید منقضی شده است.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user exists
        user_exists = User.objects.filter(phone=phone).exists()
        
        return Response({
            'valid': True,
            'user_exists': user_exists,
            'message': 'کد تایید صحیح است.'
        })


class RegisterView(APIView):
    """Register new user with phone verification."""
    
    permission_classes = [AllowAny]

    @swagger_auto_schema(request_body=RegisterSerializer)
    def post(self, request):
        """Register a new user."""
        serializer = RegisterSerializer(data=request.data)
        
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
            return Response({
                'error': 'کد تایید نامعتبر یا منقضی شده است.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get organization if provided
        organization = None
        org_code = serializer.validated_data.get('organization_code')
        if org_code:
            organization = Organization.objects.filter(slug=org_code, is_active=True).first()
            if organization and not organization.can_add_users:
                return Response({
                    'error': 'ظرفیت سازمان تکمیل شده است.'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            # Mark OTP as used
            otp.is_used = True
            otp.save()
            
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
                user.save()
            
            # Create session and token
            token, session = self._create_session(user, request)
        
        logger.info(f"New user registered: {phone}")
        
        return Response({
            'message': 'ثبت‌نام با موفقیت انجام شد.',
            'access_token': token,
            'token_type': 'Bearer',
            'expires_in': ACCESS_TOKEN_EXPIRY_HOURS * 3600,
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    
    def _create_session(self, user, request):
        """Create a new session for user."""
        token = secrets.token_urlsafe(32)
        
        session = UserSession.objects.create(
            user=user,
            token=token,
            device_info=request.META.get('HTTP_USER_AGENT', '')[:255],
            ip_address=self._get_client_ip(request),
        )
        
        return token, session
    
    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class LoginView(APIView):
    """Login with phone and OTP."""
    
    permission_classes = [AllowAny]

    @swagger_auto_schema(request_body=LoginSerializer)
    def post(self, request):
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
            return Response({
                'error': 'کد تایید نامعتبر یا منقضی شده است.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user
        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            return Response({
                'error': 'کاربری با این شماره یافت نشد. لطفاً ابتدا ثبت‌نام کنید.',
                'should_register': True
            }, status=status.HTTP_404_NOT_FOUND)
        
        if not user.is_active:
            return Response({
                'error': 'حساب کاربری شما غیرفعال شده است.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        with transaction.atomic():
            # Mark OTP as used
            otp.is_used = True
            otp.save()
            
            # Update last login
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            # Create session
            token = secrets.token_urlsafe(32)
            UserSession.objects.create(
                user=user,
                token=token,
                device_info=request.META.get('HTTP_USER_AGENT', '')[:255],
                ip_address=self._get_client_ip(request),
            )
        
        logger.info(f"User logged in: {phone}")
        
        return Response({
            'access_token': token,
            'token_type': 'Bearer',
            'expires_in': ACCESS_TOKEN_EXPIRY_HOURS * 3600,
            'user': UserSerializer(user).data
        })
    
    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class LogoutView(APIView):
    """Logout and invalidate session."""
    
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Logout user."""
        # Get token from header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            UserSession.objects.filter(token=token).update(is_active=False)
        
        return Response({'message': 'خروج با موفقیت انجام شد.'})


class ProfileView(APIView):
    """User profile management."""
    
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get current user profile."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @swagger_auto_schema(request_body=UserProfileSerializer)
    def patch(self, request):
        """Update user profile."""
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        serializer.save()
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    """Change user password."""
    
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(request_body=ChangePasswordSerializer)
    def post(self, request):
        """Change password."""
        serializer = ChangePasswordSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({
                'error': 'رمز عبور فعلی صحیح نیست.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'message': 'رمز عبور با موفقیت تغییر کرد.'})


# Import settings for DEBUG check
from django.conf import settings
