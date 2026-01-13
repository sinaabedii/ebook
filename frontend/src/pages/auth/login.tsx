import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Phone, ArrowRight, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { authApi, handleApiError } from '@/api/djangoApi';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts';

type Step = 'phone' | 'otp' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login, register } = useAuth();
  const { t, language, isRTL } = useLanguage();
  
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organizationCode, setOrganizationCode] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [debugCode, setDebugCode] = useState('');
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Format phone number
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
  };

  // Handle phone input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (digits.length <= 11) {
      setPhone(digits);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    if (pastedData.length === 6) {
      otpRefs.current[5]?.focus();
    }
  };

  // Handle OTP keydown (backspace)
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (phone.length !== 11 || !phone.startsWith('09')) {
      setError('شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await authApi.requestOTP(phone);
      setSuccess(response.message);
      setCountdown(response.expires_in || 120);
      setStep('otp');
      
      // Show debug code in development
      if (response.debug_code) {
        setDebugCode(response.debug_code);
      }
      
      // Focus first OTP input
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const code = otp.join('');
    if (code.length !== 6) {
      setError('لطفاً کد ۶ رقمی را وارد کنید');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await authApi.verifyOTP(phone, code);
      setUserExists(response.user_exists);
      
      if (response.user_exists) {
        // User exists - login directly
        await login(phone, code);
        router.push('/');
      } else {
        // New user - go to register step
        setStep('register');
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const code = otp.join('');
    
    setIsLoading(true);
    
    try {
      await register({
        phone,
        code,
        first_name: firstName,
        last_name: lastName,
        organization_code: organizationCode || undefined,
      });
      router.push('/');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setOtp(['', '', '', '', '', '']);
    await handleRequestOtp({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <>
      <Head>
        <title>{t('nav.login')} | {t('home.title')}</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'} style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px]" style={{ backgroundColor: 'rgba(92, 0, 37, 0.15)' }} />
          <div className="absolute bottom-0 right-1/4 w-40 sm:w-60 lg:w-80 h-40 sm:h-60 lg:h-80 rounded-full blur-[60px] sm:blur-[80px] lg:blur-[100px]" style={{ backgroundColor: 'rgba(92, 0, 37, 0.1)' }} />
        </div>

        <div className="w-full max-w-sm sm:max-w-md relative z-10">
          {/* Logo/Header */}
          <div className="text-center mb-6 sm:mb-8 animate-fade-in-down">
            <Link href="/" className="inline-block">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 shadow-lg hover-scale overflow-hidden" style={{ boxShadow: '0 4px 15px rgba(92, 0, 37, 0.4)' }}>
                <img src="/logo/logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gradient">{t('home.title')}</h1>
            <p className="mt-2 text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
              {step === 'phone' && t('auth.loginSubtitle')}
              {step === 'otp' && t('auth.enterCode')}
              {step === 'register' && t('auth.completeProfile')}
            </p>
          </div>

          {/* Card */}
          <div className="card rounded-xl sm:rounded-2xl p-5 sm:p-8 animate-fade-in-up glass-premium">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 animate-fade-in-up">
                <AlertCircle className="w-5 h-5 flex-shrink-0 animate-wiggle" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && step === 'otp' && (
              <div className="mb-6 p-4 rounded-xl flex items-center gap-3 animate-fade-in-up" style={{ backgroundColor: 'rgba(92, 0, 37, 0.1)', border: '1px solid rgba(92, 0, 37, 0.3)' }}>
                <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#f27794' }} />
                <span className="text-sm" style={{ color: '#f27794' }}>{success}</span>
              </div>
            )}

            {/* Debug Code (Development Only) */}
            {debugCode && step === 'otp' && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-xs font-medium mb-1 text-yellow-400">کد تایید (حالت توسعه):</p>
                <p className="text-2xl font-mono font-bold tracking-widest text-yellow-300">{debugCode}</p>
              </div>
            )}

            {/* Phone Step */}
            {step === 'phone' && (
              <form onSubmit={handleRequestOtp} className="animate-fade-in-up">
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    شماره موبایل
                  </label>
                  <div className="relative group">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors" style={{ color: 'var(--text-tertiary)' }} />
                    <input
                      type="tel"
                      value={formatPhone(phone)}
                      onChange={handlePhoneChange}
                      placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
                      className="input pr-10 text-left"
                      dir="ltr"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || phone.length !== 11}
                  className="btn-primary w-full py-3 hover-lift shine"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      در حال ارسال...
                    </>
                  ) : (
                    'دریافت کد تایید'
                  )}
                </button>
              </form>
            )}

            {/* OTP Step */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="animate-fade-in-up">
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                    کد ۶ رقمی ارسال شده به {formatPhone(phone)}
                  </label>
                  
                  <div className="flex gap-1.5 sm:gap-2 justify-center" dir="ltr">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => { otpRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(index, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-lg sm:rounded-xl outline-none transition-all duration-300 hover-scale"
                        style={{ 
                          backgroundColor: 'var(--bg-secondary)', 
                          border: '2px solid var(--border-color)', 
                          color: 'var(--text-primary)',
                          animationDelay: `${index * 50}ms` 
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#5c0025'; e.target.style.boxShadow = '0 0 0 3px rgba(92, 0, 37, 0.2)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.join('').length !== 6}
                  className="btn-primary w-full py-3 hover-lift shine"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      در حال بررسی...
                    </>
                  ) : (
                    'تایید و ورود'
                  )}
                </button>

                <div className="mt-4 text-center">
                  {countdown > 0 ? (
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      ارسال مجدد کد تا {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-sm transition-colors hover-scale"
                      style={{ color: '#f27794' }}
                    >
                      ارسال مجدد کد
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(''); }}
                  className="w-full mt-4 py-2 flex items-center justify-center gap-2 transition-all duration-300 hover-scale"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <ArrowRight className="w-4 h-4" />
                  تغییر شماره موبایل
                </button>
              </form>
            )}

            {/* Register Step */}
            {step === 'register' && (
              <form onSubmit={handleRegister} className="animate-fade-in-up">
                <div className="space-y-4 mb-6">
                  <div className="animate-slide-in-right" style={{ animationDelay: '100ms' }}>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      نام
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="نام خود را وارد کنید"
                      className="input"
                      autoFocus
                    />
                  </div>

                  <div className="animate-slide-in-right" style={{ animationDelay: '200ms' }}>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      نام خانوادگی
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="نام خانوادگی خود را وارد کنید"
                      className="input"
                    />
                  </div>

                  <div className="animate-slide-in-right" style={{ animationDelay: '300ms' }}>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      کد سازمان (اختیاری)
                    </label>
                    <input
                      type="text"
                      value={organizationCode}
                      onChange={e => setOrganizationCode(e.target.value)}
                      placeholder="در صورت عضویت در سازمان، کد را وارد کنید"
                      className="input"
                      dir="ltr"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3 hover-lift shine"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      در حال ثبت‌نام...
                    </>
                  ) : (
                    'تکمیل ثبت‌نام'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('otp'); setError(''); }}
                  className="w-full mt-4 py-2 flex items-center justify-center gap-2 transition-all duration-300 hover-scale"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <ArrowRight className="w-4 h-4" />
                  بازگشت
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-tertiary)' }}>
            با ورود به سامانه، <Link href="/terms" className="transition-colors" style={{ color: '#f27794' }}>قوانین و مقررات</Link> را می‌پذیرید
          </p>
        </div>
      </div>
    </>
  );
}
