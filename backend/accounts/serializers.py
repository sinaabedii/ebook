"""
Serializers for authentication and user management.
"""
from typing import Any, Dict

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Organization

User = get_user_model()

# =============================================================================
# Regex Patterns
# =============================================================================

PHONE_REGEX = r'^09\d{9}$'
OTP_CODE_REGEX = r'^\d{6}$'

PHONE_ERROR = 'شماره موبایل باید با 09 شروع شود و 11 رقم باشد.'
OTP_ERROR = 'کد تایید باید 6 رقم باشد.'


# =============================================================================
# Organization Serializers
# =============================================================================

class OrganizationSerializer(serializers.ModelSerializer):
    """Serializer for Organization model."""

    user_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'slug', 'logo', 'description',
            'is_active', 'max_users', 'user_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'user_count']


# =============================================================================
# User Serializers
# =============================================================================

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""

    full_name = serializers.CharField(source='get_full_name', read_only=True)
    organization_name = serializers.CharField(
        source='organization.name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = User
        fields = [
            'id', 'phone', 'email', 'first_name', 'last_name',
            'full_name', 'national_id', 'avatar', 'organization',
            'organization_name', 'role', 'is_verified', 'date_joined'
        ]
        read_only_fields = ['id', 'is_verified', 'date_joined']


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile updates."""

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'national_id', 'avatar']


# =============================================================================
# Authentication Serializers
# =============================================================================

class OTPRequestSerializer(serializers.Serializer):
    """Serializer for OTP request."""

    phone = serializers.RegexField(
        regex=PHONE_REGEX,
        error_messages={'invalid': PHONE_ERROR}
    )


class OTPVerifySerializer(serializers.Serializer):
    """Serializer for OTP verification."""

    phone = serializers.RegexField(
        regex=PHONE_REGEX,
        error_messages={'invalid': PHONE_ERROR}
    )
    code = serializers.RegexField(
        regex=OTP_CODE_REGEX,
        error_messages={'invalid': OTP_ERROR}
    )


class RegisterSerializer(serializers.Serializer):
    """Serializer for user registration."""

    phone = serializers.RegexField(
        regex=PHONE_REGEX,
        error_messages={'invalid': PHONE_ERROR}
    )
    code = serializers.RegexField(
        regex=OTP_CODE_REGEX,
        error_messages={'invalid': OTP_ERROR}
    )
    first_name = serializers.CharField(max_length=50, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=50, required=False, allow_blank=True)
    password = serializers.CharField(min_length=6, write_only=True, required=False)
    organization_code = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate_phone(self, value: str) -> str:
        """Check if phone is already registered."""
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError('این شماره قبلاً ثبت شده است.')
        return value

    def validate_organization_code(self, value: str) -> str:
        """Validate organization code/slug."""
        if value and not Organization.objects.filter(slug=value, is_active=True).exists():
            raise serializers.ValidationError('کد سازمان نامعتبر است.')
        return value


class LoginSerializer(serializers.Serializer):
    """Serializer for login."""

    phone = serializers.RegexField(
        regex=PHONE_REGEX,
        error_messages={'invalid': PHONE_ERROR}
    )
    code = serializers.RegexField(
        regex=OTP_CODE_REGEX,
        error_messages={'invalid': OTP_ERROR}
    )


class TokenSerializer(serializers.Serializer):
    """Serializer for token response."""

    access_token = serializers.CharField()
    refresh_token = serializers.CharField(required=False)
    token_type = serializers.CharField(default='Bearer')
    expires_in = serializers.IntegerField()
    user = UserSerializer()


class RefreshTokenSerializer(serializers.Serializer):
    """Serializer for token refresh."""

    refresh_token = serializers.CharField()


# =============================================================================
# Password Serializers
# =============================================================================

class PasswordSetSerializer(serializers.Serializer):
    """Serializer for setting password."""

    password = serializers.CharField(min_length=6, write_only=True)
    password_confirm = serializers.CharField(min_length=6, write_only=True)

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate password confirmation."""
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'رمز عبور و تکرار آن مطابقت ندارند.'
            })
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""

    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(min_length=6, write_only=True)
    new_password_confirm = serializers.CharField(min_length=6, write_only=True)

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate new password confirmation."""
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'رمز عبور جدید و تکرار آن مطابقت ندارند.'
            })
        return data
