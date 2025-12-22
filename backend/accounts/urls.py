"""
URL configuration for accounts app.
"""
from django.urls import path
from . import views

urlpatterns = [
    # OTP endpoints
    path('otp/request/', views.RequestOTPView.as_view(), name='otp-request'),
    path('otp/verify/', views.VerifyOTPView.as_view(), name='otp-verify'),
    
    # Auth endpoints
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    
    # Profile endpoints
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
]
