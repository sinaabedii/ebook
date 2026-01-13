/**
 * Language Context
 * Provides internationalization (i18n) support throughout the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import {
  STORAGE_KEYS,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  LANGUAGE_DIRECTIONS,
  type SupportedLanguage,
} from '@/lib/constants';
import { getStorageItem, setStorageItem, isBrowser } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

type Direction = 'rtl' | 'ltr';

interface Translations {
  [key: string]: string | Translations;
}

interface LanguageContextType {
  language: SupportedLanguage;
  direction: Direction;
  isRTL: boolean;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

interface LanguageProviderProps {
  children: ReactNode;
}

// =============================================================================
// Translations
// =============================================================================

const translations: Record<SupportedLanguage, Translations> = {
  fa: {
    common: {
      loading: 'در حال بارگذاری...',
      error: 'خطا',
      retry: 'تلاش مجدد',
      save: 'ذخیره',
      cancel: 'انصراف',
      delete: 'حذف',
      edit: 'ویرایش',
      search: 'جستجو',
      close: 'بستن',
      back: 'بازگشت',
      next: 'بعدی',
      previous: 'قبلی',
      yes: 'بله',
      no: 'خیر',
      confirm: 'تایید',
      settings: 'تنظیمات',
      language: 'زبان',
      theme: 'تم',
      lightMode: 'روشن',
      darkMode: 'تاریک',
      persian: 'فارسی',
      english: 'English',
      books: 'کتاب',
      users: 'کاربر',
      rating: 'امتیاز',
      yourLibrary: 'کتابخانه شما',
      alwaysAvailable: 'همیشه در دسترس',
      startNow: 'همین الان شروع کنید',
      freeRegister: 'ثبت‌نام رایگان',
      freeRegisterDesc: 'با ثبت‌نام رایگان، کتابخانه شخصی خود را بسازید.',
    },
    nav: {
      home: 'خانه',
      library: 'کتابخانه',
      upload: 'آپلود',
      profile: 'پروفایل',
      login: 'ورود',
      logout: 'خروج',
      register: 'ثبت‌نام',
    },
    home: {
      title: 'ArianDoc',
      subtitle: 'تبدیل PDF به کتاب دیجیتال تعاملی',
      badge: 'تجربه‌ای متفاوت از مطالعه',
      heroTitle1: 'کتابخانه',
      heroTitle2: 'دیجیتال',
      heroTitle3: 'تعاملی',
      heroDescription: 'فایل‌های PDF خود را به کتاب‌های دیجیتال زیبا تبدیل کنید.',
      startButton: 'شروع کنید',
      viewBooks: 'مشاهده کتاب‌ها',
      whyUs: 'چرا ArianDoc؟',
      whyUsDesc: 'امکانات حرفه‌ای برای بهترین تجربه مطالعه دیجیتال',
      recentBooks: 'کتاب‌های اخیر',
      recentBooksDesc: 'جدیدترین کتاب‌های اضافه شده',
      viewAll: 'مشاهده همه',
      noBooks: 'هنوز کتابی اضافه نشده',
      noBooksDesc: 'اولین کتاب خود را آپلود کنید',
      featurePdf: 'پشتیبانی PDF',
      featurePdfDesc: 'آپلود فایل‌های PDF تا ۵۰۰ مگابایت',
      feature3d: 'ورق زدن ۳D',
      feature3dDesc: 'انیمیشن واقعی ورق زدن کتاب',
      featureSpeed: 'سرعت بالا',
      featureSpeedDesc: 'بارگذاری سریع و بهینه تصاویر',
      featureSecurity: 'امنیت',
      featureSecurityDesc: 'ذخیره امن فایل‌ها در سرور',
    },
    library: {
      title: 'کتابخانه من',
      empty: 'کتابی یافت نشد',
      emptyDescription: 'اولین کتاب خود را آپلود کنید',
      uploadFirst: 'آپلود کتاب',
      searchPlaceholder: 'جستجوی کتاب...',
      newest: 'جدیدترین',
      nameAZ: 'نام (الف-ی)',
      pages: 'صفحه',
      page: 'صفحه',
      deleteConfirm: 'آیا از حذف این کتاب مطمئن هستید؟',
      processing: 'در حال پردازش...',
      booksCount: 'کتاب',
      gridView: 'نمایش شبکه‌ای',
      listView: 'نمایش لیستی',
    },
    upload: {
      title: 'آپلود کتاب جدید',
      dragDrop: 'فایل PDF را اینجا بکشید و رها کنید',
      maxSize: 'حداکثر حجم: 50 مگابایت',
      processing: 'در حال پردازش...',
      uploading: 'در حال آپلود...',
      success: 'آپلود با موفقیت انجام شد',
      successDesc: 'کتاب شما با موفقیت آپلود و پردازش شد',
      error: 'خطا در آپلود',
      bookTitle: 'عنوان کتاب',
      bookTitlePlaceholder: 'نام کتاب را وارد کنید',
      bookDescription: 'توضیحات',
      bookDescriptionPlaceholder: 'توضیحات کتاب (اختیاری)',
      step1: 'انتخاب فایل',
      step2: 'اطلاعات کتاب',
      step3: 'پردازش',
      uploadButton: 'آپلود و پردازش',
      viewBook: 'مشاهده کتاب',
      uploadAnother: 'آپلود کتاب دیگر',
      tryAgain: 'تلاش مجدد',
      preparingPages: 'در حال آماده‌سازی صفحات...',
    },
    uploader: {
      onlyPdf: 'فقط فایل‌های PDF قابل قبول هستند',
      maxSizeError: 'حداکثر حجم فایل {size} مگابایت است',
      uploadError: 'خطا در آپلود فایل',
      dropHere: 'فایل را اینجا رها کنید',
      uploadPdf: 'PDF خود را آپلود کنید',
      dragOrClick: 'فایل را بکشید و اینجا رها کنید یا کلیک کنید',
      maxSize: 'حداکثر حجم: {size} مگابایت',
    },
    footer: {
      privacy: 'حریم خصوصی',
      terms: 'قوانین استفاده',
      about: 'درباره ما',
      copyright: '© ۱۴۰۴',
    },
    errors: {
      networkError: 'ارتباط با سرور برقرار نشد',
      unknownError: 'خطای ناشناخته رخ داد',
      invalidPhone: 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود',
      invalidOtp: 'لطفاً کد ۶ رقمی را وارد کنید',
      uploadFailed: 'خطا در آپلود فایل',
      processingTimeout: 'زمان پردازش بیش از حد انتظار طول کشید',
      fileTooLarge: 'حداکثر حجم فایل {size} مگابایت است',
      invalidFileType: 'فقط فایل‌های PDF قابل قبول هستند',
    },
    auth: {
      loginSubtitle: 'برای ادامه شماره موبایل خود را وارد کنید',
      enterCode: 'کد تایید ارسال شده را وارد کنید',
      completeProfile: 'تکمیل اطلاعات',
      phoneNumber: 'شماره موبایل',
      phonePlaceholder: '۰۹۱۲ ۳۴۵ ۶۷۸۹',
      getCode: 'دریافت کد تایید',
      sending: 'در حال ارسال...',
      verifyCode: 'کد ۶ رقمی ارسال شده به',
      verifyAndLogin: 'تایید و ورود',
      checking: 'در حال بررسی...',
      resendIn: 'ارسال مجدد کد تا',
      resendCode: 'ارسال مجدد کد',
      changeNumber: 'تغییر شماره موبایل',
      firstName: 'نام',
      firstNamePlaceholder: 'نام خود را وارد کنید',
      lastName: 'نام خانوادگی',
      lastNamePlaceholder: 'نام خانوادگی خود را وارد کنید',
      orgCode: 'کد سازمان (اختیاری)',
      orgCodePlaceholder: 'در صورت عضویت در سازمان، کد را وارد کنید',
      completeRegister: 'تکمیل ثبت‌نام',
      registering: 'در حال ثبت‌نام...',
      back: 'بازگشت',
      termsText: 'با ورود به سامانه،',
      termsLink: 'قوانین و مقررات',
      termsAccept: 'را می‌پذیرید',
      debugCode: 'کد تایید (حالت توسعه):',
    },
    profile: {
      title: 'پروفایل',
      personalInfo: 'اطلاعات شخصی',
      edit: 'ویرایش',
      firstName: 'نام',
      firstNamePlaceholder: 'نام خود را وارد کنید',
      lastName: 'نام خانوادگی',
      lastNamePlaceholder: 'نام خانوادگی خود را وارد کنید',
      email: 'ایمیل',
      emailPlaceholder: 'email@example.com',
      nationalId: 'کد ملی',
      nationalIdPlaceholder: '۱۲۳۴۵۶۷۸۹۰',
      phone: 'شماره موبایل',
      role: 'نقش',
      joinDate: 'تاریخ عضویت',
      saveChanges: 'ذخیره تغییرات',
      saving: 'در حال ذخیره...',
      cancel: 'انصراف',
      updateSuccess: 'اطلاعات با موفقیت بروزرسانی شد',
      active: 'فعال',
      user: 'کاربر',
      roles: {
        admin: 'مدیر سیستم',
        org_admin: 'مدیر سازمان',
        manager: 'مدیر',
        member: 'کاربر عادی',
      },
    },
  },
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      yes: 'Yes',
      no: 'No',
      confirm: 'Confirm',
      settings: 'Settings',
      language: 'Language',
      theme: 'Theme',
      lightMode: 'Light',
      darkMode: 'Dark',
      persian: 'فارسی',
      english: 'English',
      books: 'Books',
      users: 'Users',
      rating: 'Rating',
      yourLibrary: 'Your Library',
      alwaysAvailable: 'Always Available',
      startNow: 'Start Now',
      freeRegister: 'Free Registration',
      freeRegisterDesc: 'Create your personal library with free registration.',
    },
    nav: {
      home: 'Home',
      library: 'Library',
      upload: 'Upload',
      profile: 'Profile',
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
    },
    home: {
      title: 'ArianDoc',
      subtitle: 'Convert PDF to Interactive Digital Book',
      badge: 'A Different Reading Experience',
      heroTitle1: 'Digital',
      heroTitle2: 'Library',
      heroTitle3: 'Interactive',
      heroDescription: 'Transform your PDF files into beautiful digital books.',
      startButton: 'Get Started',
      viewBooks: 'View Books',
      whyUs: 'Why ArianDoc?',
      whyUsDesc: 'Professional features for the best digital reading experience',
      recentBooks: 'Recent Books',
      recentBooksDesc: 'Latest added books',
      viewAll: 'View All',
      noBooks: 'No books added yet',
      noBooksDesc: 'Upload your first book',
      featurePdf: 'PDF Support',
      featurePdfDesc: 'Upload PDF files up to 500MB',
      feature3d: '3D Page Flip',
      feature3dDesc: 'Realistic book page turning animation',
      featureSpeed: 'High Speed',
      featureSpeedDesc: 'Fast and optimized image loading',
      featureSecurity: 'Security',
      featureSecurityDesc: 'Secure file storage on server',
    },
    library: {
      title: 'My Library',
      empty: 'No books found',
      emptyDescription: 'Upload your first book',
      uploadFirst: 'Upload Book',
      searchPlaceholder: 'Search books...',
      newest: 'Newest',
      nameAZ: 'Name (A-Z)',
      pages: 'pages',
      page: 'page',
      deleteConfirm: 'Are you sure you want to delete this book?',
      processing: 'Processing...',
      booksCount: 'books',
      gridView: 'Grid View',
      listView: 'List View',
    },
    upload: {
      title: 'Upload New Book',
      dragDrop: 'Drag and drop PDF file here',
      maxSize: 'Max size: 50MB',
      processing: 'Processing...',
      uploading: 'Uploading...',
      success: 'Upload Successful',
      successDesc: 'Your book has been successfully uploaded and processed',
      error: 'Upload Failed',
      bookTitle: 'Book Title',
      bookTitlePlaceholder: 'Enter book name',
      bookDescription: 'Description',
      bookDescriptionPlaceholder: 'Book description (optional)',
      step1: 'Select File',
      step2: 'Book Info',
      step3: 'Processing',
      uploadButton: 'Upload & Process',
      viewBook: 'View Book',
      uploadAnother: 'Upload Another Book',
      tryAgain: 'Try Again',
      preparingPages: 'Preparing pages...',
    },
    uploader: {
      onlyPdf: 'Only PDF files are accepted',
      maxSizeError: 'Maximum file size is {size}MB',
      uploadError: 'Error uploading file',
      dropHere: 'Drop file here',
      uploadPdf: 'Upload your PDF',
      dragOrClick: 'Drag and drop or click to select',
      maxSize: 'Max size: {size}MB',
    },
    footer: {
      privacy: 'Privacy Policy',
      terms: 'Terms of Use',
      about: 'About Us',
      copyright: '© 2025',
    },
    errors: {
      networkError: 'Could not connect to server',
      unknownError: 'An unknown error occurred',
      invalidPhone: 'Phone number must be 11 digits starting with 09',
      invalidOtp: 'Please enter a 6-digit code',
      uploadFailed: 'File upload failed',
      processingTimeout: 'Processing took longer than expected',
      fileTooLarge: 'Maximum file size is {size}MB',
      invalidFileType: 'Only PDF files are accepted',
    },
    auth: {
      loginSubtitle: 'Enter your phone number to continue',
      enterCode: 'Enter the verification code sent',
      completeProfile: 'Complete Profile',
      phoneNumber: 'Phone Number',
      phonePlaceholder: '0912 345 6789',
      getCode: 'Get Verification Code',
      sending: 'Sending...',
      verifyCode: '6-digit code sent to',
      verifyAndLogin: 'Verify & Login',
      checking: 'Checking...',
      resendIn: 'Resend code in',
      resendCode: 'Resend Code',
      changeNumber: 'Change Phone Number',
      firstName: 'First Name',
      firstNamePlaceholder: 'Enter your first name',
      lastName: 'Last Name',
      lastNamePlaceholder: 'Enter your last name',
      orgCode: 'Organization Code (Optional)',
      orgCodePlaceholder: 'Enter organization code if applicable',
      completeRegister: 'Complete Registration',
      registering: 'Registering...',
      back: 'Back',
      termsText: 'By logging in, you accept the',
      termsLink: 'Terms and Conditions',
      termsAccept: '',
      debugCode: 'Verification Code (Dev Mode):',
    },
    profile: {
      title: 'Profile',
      personalInfo: 'Personal Information',
      edit: 'Edit',
      firstName: 'First Name',
      firstNamePlaceholder: 'Enter your first name',
      lastName: 'Last Name',
      lastNamePlaceholder: 'Enter your last name',
      email: 'Email',
      emailPlaceholder: 'email@example.com',
      nationalId: 'National ID',
      nationalIdPlaceholder: '1234567890',
      phone: 'Phone Number',
      role: 'Role',
      joinDate: 'Join Date',
      saveChanges: 'Save Changes',
      saving: 'Saving...',
      cancel: 'Cancel',
      updateSuccess: 'Information updated successfully',
      active: 'Active',
      user: 'User',
      roles: {
        admin: 'System Admin',
        org_admin: 'Organization Admin',
        manager: 'Manager',
        member: 'Member',
      },
    },
  },
};

// =============================================================================
// Context
// =============================================================================

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// =============================================================================
// Provider Component
// =============================================================================

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);

  const direction: Direction = LANGUAGE_DIRECTIONS[language];
  const isRTL = direction === 'rtl';

  // Load language from storage on mount
  useEffect(() => {
    const savedLang = getStorageItem(STORAGE_KEYS.language) as SupportedLanguage | null;
    if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) {
      setLanguageState(savedLang);
    }
    setMounted(true);
  }, []);

  // Apply direction to document
  useEffect(() => {
    if (!mounted || !isBrowser()) return;

    const root = document.documentElement;
    root.dir = direction;
    root.lang = language;

    setStorageItem(STORAGE_KEYS.language, language);
  }, [language, direction, mounted]);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      setLanguageState(lang);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'fa' ? 'en' : 'fa'));
  }, []);

  const t = useCallback(
    (key: string): string => {
      const keys = key.split('.');
      let value: unknown = translations[language];

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          // Fallback to Persian
          value = translations.fa;
          for (const fallbackKey of keys) {
            if (value && typeof value === 'object' && fallbackKey in value) {
              value = (value as Record<string, unknown>)[fallbackKey];
            } else {
              return key;
            }
          }
          break;
        }
      }

      return typeof value === 'string' ? value : key;
    },
    [language]
  );

  const value = useMemo<LanguageContextType>(
    () => ({ language, direction, isRTL, setLanguage, toggleLanguage, t }),
    [language, direction, isRTL, setLanguage, toggleLanguage, t]
  );

  if (!mounted) return null;

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

// =============================================================================
// Hook
// =============================================================================

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
