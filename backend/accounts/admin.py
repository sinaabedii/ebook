"""
Admin configuration for accounts app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, Organization, OTPCode, UserSession


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    """Admin for Organization model."""
    
    list_display = ['name', 'slug', 'user_count', 'max_users', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['user_count', 'created_at', 'updated_at']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin for custom User model."""
    
    list_display = [
        'phone', 'get_full_name', 'organization', 'role',
        'is_verified', 'is_active', 'date_joined'
    ]
    list_filter = ['role', 'is_verified', 'is_active', 'organization', 'date_joined']
    search_fields = ['phone', 'first_name', 'last_name', 'email']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('phone', 'password')}),
        ('اطلاعات شخصی', {'fields': ('first_name', 'last_name', 'email', 'national_id', 'avatar')}),
        ('سازمان', {'fields': ('organization', 'role')}),
        ('وضعیت', {'fields': ('is_verified', 'is_active', 'is_staff', 'is_superuser')}),
        ('دسترسی‌ها', {'fields': ('groups', 'user_permissions')}),
        ('تاریخ‌ها', {'fields': ('date_joined', 'last_login')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone', 'password1', 'password2', 'first_name', 'last_name', 'organization', 'role'),
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login']


@admin.register(OTPCode)
class OTPCodeAdmin(admin.ModelAdmin):
    """Admin for OTPCode model."""
    
    list_display = ['phone', 'code', 'is_used', 'is_expired_display', 'created_at', 'expires_at']
    list_filter = ['is_used', 'created_at']
    search_fields = ['phone']
    ordering = ['-created_at']
    readonly_fields = ['phone', 'code', 'created_at', 'expires_at']
    
    def is_expired_display(self, obj):
        if obj.is_expired:
            return format_html('<span style="color: red;">منقضی</span>')
        return format_html('<span style="color: green;">معتبر</span>')
    is_expired_display.short_description = 'وضعیت'


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    """Admin for UserSession model."""
    
    list_display = ['user', 'ip_address', 'is_active', 'created_at', 'last_activity']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__phone', 'ip_address']
    ordering = ['-last_activity']
    readonly_fields = ['user', 'token', 'device_info', 'ip_address', 'created_at', 'last_activity']
    
    actions = ['deactivate_sessions']
    
    @admin.action(description='غیرفعال کردن نشست‌ها')
    def deactivate_sessions(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f'{queryset.count()} نشست غیرفعال شد.')
