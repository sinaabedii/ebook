"""
Custom User and Organization models for enterprise authentication.
"""
import random
import string
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import RegexValidator
from django.utils import timezone


# Phone number validator for Iran
phone_regex = RegexValidator(
    regex=r'^09\d{9}$',
    message='شماره موبایل باید با 09 شروع شود و 11 رقم باشد.'
)


class Organization(models.Model):
    """Model representing an organization/company."""
    
    name = models.CharField(
        max_length=255,
        verbose_name='نام سازمان'
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        verbose_name='شناسه یکتا'
    )
    logo = models.ImageField(
        upload_to='organizations/',
        blank=True,
        null=True,
        verbose_name='لوگو'
    )
    description = models.TextField(
        blank=True,
        verbose_name='توضیحات'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='فعال'
    )
    max_users = models.PositiveIntegerField(
        default=100,
        verbose_name='حداکثر کاربران'
    )
    max_storage_gb = models.PositiveIntegerField(
        default=10,
        verbose_name='حداکثر فضای ذخیره‌سازی (GB)'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='تاریخ ایجاد'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='تاریخ بروزرسانی'
    )

    class Meta:
        verbose_name = 'سازمان'
        verbose_name_plural = 'سازمان‌ها'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def user_count(self):
        return self.users.count()

    @property
    def can_add_users(self):
        return self.user_count < self.max_users


class CustomUserManager(BaseUserManager):
    """Custom user manager for phone-based authentication."""

    def create_user(self, phone, password=None, **extra_fields):
        """Create and save a regular user."""
        if not phone:
            raise ValueError('شماره موبایل الزامی است')
        
        user = self.model(phone=phone, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        """Create and save a superuser."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(phone, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model with phone number as primary identifier."""
    
    class Role(models.TextChoices):
        ADMIN = 'admin', 'مدیر سیستم'
        ORG_ADMIN = 'org_admin', 'مدیر سازمان'
        MANAGER = 'manager', 'مدیر'
        MEMBER = 'member', 'کاربر عادی'
    
    phone = models.CharField(
        max_length=11,
        unique=True,
        validators=[phone_regex],
        verbose_name='شماره موبایل'
    )
    email = models.EmailField(
        blank=True,
        null=True,
        verbose_name='ایمیل'
    )
    first_name = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='نام'
    )
    last_name = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='نام خانوادگی'
    )
    national_id = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        verbose_name='کد ملی'
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        verbose_name='تصویر پروفایل'
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        verbose_name='سازمان'
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MEMBER,
        verbose_name='نقش'
    )
    is_verified = models.BooleanField(
        default=False,
        verbose_name='تایید شده'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='فعال'
    )
    is_staff = models.BooleanField(
        default=False,
        verbose_name='دسترسی ادمین'
    )
    date_joined = models.DateTimeField(
        default=timezone.now,
        verbose_name='تاریخ عضویت'
    )
    last_login = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='آخرین ورود'
    )

    objects = CustomUserManager()

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'کاربر'
        verbose_name_plural = 'کاربران'
        indexes = [
            models.Index(fields=['phone']),
            models.Index(fields=['organization']),
            models.Index(fields=['role']),
        ]

    def __str__(self):
        return self.get_full_name() or self.phone

    def get_full_name(self):
        """Return the full name."""
        full_name = f'{self.first_name} {self.last_name}'.strip()
        return full_name if full_name else None

    def get_short_name(self):
        """Return the short name."""
        return self.first_name or self.phone

    @property
    def is_org_admin(self):
        return self.role in [self.Role.ADMIN, self.Role.ORG_ADMIN]


class OTPCode(models.Model):
    """Model for storing OTP verification codes."""
    
    phone = models.CharField(
        max_length=11,
        validators=[phone_regex],
        verbose_name='شماره موبایل'
    )
    code = models.CharField(
        max_length=6,
        verbose_name='کد تایید'
    )
    is_used = models.BooleanField(
        default=False,
        verbose_name='استفاده شده'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='تاریخ ایجاد'
    )
    expires_at = models.DateTimeField(
        verbose_name='تاریخ انقضا'
    )

    class Meta:
        verbose_name = 'کد تایید'
        verbose_name_plural = 'کدهای تایید'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone', 'code']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f'{self.phone} - {self.code}'

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired

    @classmethod
    def generate_code(cls, length=6):
        """Generate a random numeric code."""
        return ''.join(random.choices(string.digits, k=length))

    @classmethod
    def create_for_phone(cls, phone, expiry_minutes=5):
        """Create a new OTP code for a phone number."""
        from datetime import timedelta
        
        # Invalidate previous codes
        cls.objects.filter(phone=phone, is_used=False).update(is_used=True)
        
        code = cls.generate_code()
        expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
        
        return cls.objects.create(
            phone=phone,
            code=code,
            expires_at=expires_at
        )


class UserSession(models.Model):
    """Model for tracking user sessions."""
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sessions',
        verbose_name='کاربر'
    )
    token = models.CharField(
        max_length=255,
        unique=True,
        verbose_name='توکن'
    )
    device_info = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='اطلاعات دستگاه'
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='آدرس IP'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='فعال'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='تاریخ ایجاد'
    )
    last_activity = models.DateTimeField(
        auto_now=True,
        verbose_name='آخرین فعالیت'
    )

    class Meta:
        verbose_name = 'نشست کاربر'
        verbose_name_plural = 'نشست‌های کاربران'
        ordering = ['-last_activity']

    def __str__(self):
        return f'{self.user.phone} - {self.created_at}'
