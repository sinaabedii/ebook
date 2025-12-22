import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'fa' | 'en';
type Direction = 'rtl' | 'ltr';

interface Translations {
  [key: string]: string | Translations;
}

// Persian translations (default)
const fa: Translations = {
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
    freeRegisterDesc: 'با ثبت‌نام رایگان، کتابخانه شخصی خود را بسازید و از امکانات کامل استفاده کنید.',
    privacy: 'حریم خصوصی',
    terms: 'قوانین استفاده',
    about: 'درباره ما',
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
    heroDescription: 'فایل‌های PDF خود را به کتاب‌های دیجیتال زیبا تبدیل کنید. با انیمیشن ورق زدن واقعی، مطالعه را لذت‌بخش کنید.',
    startButton: 'شروع کنید',
    viewBooks: 'مشاهده کتاب‌ها',
    features: 'ویژگی‌ها',
    whyUs: 'چرا ArianDoc؟',
    whyUsDesc: 'امکانات حرفه‌ای برای بهترین تجربه مطالعه دیجیتال',
    recentBooks: 'کتاب‌های اخیر',
    recentBooksDesc: 'جدیدترین کتاب‌های اضافه شده',
    viewAll: 'مشاهده همه',
    noBooks: 'هنوز کتابی اضافه نشده',
    noBooksDesc: 'اولین کتاب خود را آپلود کنید و از تجربه مطالعه دیجیتال لذت ببرید',
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
    sortBy: 'مرتب‌سازی',
    newest: 'جدیدترین',
    oldest: 'قدیمی‌ترین',
    nameAZ: 'نام (الف-ی)',
    nameZA: 'نام (ی-الف)',
    gridView: 'نمایش شبکه‌ای',
    listView: 'نمایش لیستی',
    pages: 'صفحه',
    page: 'صفحه',
    deleteConfirm: 'آیا از حذف این کتاب مطمئن هستید؟',
    processing: 'در حال پردازش...',
    booksCount: 'کتاب',
  },
  upload: {
    title: 'آپلود کتاب جدید',
    dragDrop: 'فایل PDF را اینجا بکشید و رها کنید',
    or: 'یا',
    browse: 'انتخاب فایل',
    selectFile: 'انتخاب از دستگاه',
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
    step4: 'تکمیل',
    uploadButton: 'آپلود و پردازش',
    viewBook: 'مشاهده کتاب',
    uploadAnother: 'آپلود کتاب دیگر',
    goToLibrary: 'رفتن به کتابخانه',
    tryAgain: 'تلاش مجدد',
    preparingPages: 'در حال آماده‌سازی صفحات...',
  },
  viewer: {
    page: 'صفحه',
    of: 'از',
    present: 'پرزنت',
    share: 'اشتراک‌گذاری',
    bookmark: 'نشانه‌گذاری',
    exit: 'خروج',
    zoomIn: 'بزرگنمایی',
    zoomOut: 'کوچکنمایی',
    fullscreen: 'تمام صفحه',
    sound: 'صدا',
    flipHint: 'از کلیدهای ← → یا سوایپ برای ورق زدن استفاده کنید',
    loadingBook: 'در حال بارگذاری کتاب...',
    bookNotFound: 'کتاب یافت نشد',
    bookNotFoundDesc: 'این کتاب وجود ندارد یا حذف شده است',
    backToLibrary: 'بازگشت به کتابخانه',
  },
  auth: {
    loginTitle: 'ورود به حساب',
    registerTitle: 'ایجاد حساب کاربری',
    phone: 'شماره موبایل',
    phonePlaceholder: '09xxxxxxxxx',
    code: 'کد تایید',
    codePlaceholder: 'کد 6 رقمی',
    name: 'نام و نام‌خانوادگی',
    namePlaceholder: 'نام خود را وارد کنید',
    sendCode: 'ارسال کد',
    verify: 'تایید',
    resendCode: 'ارسال مجدد کد',
    seconds: 'ثانیه',
    welcomeBack: 'خوش آمدید',
    welcomeMessage: 'به ArianDoc خوش آمدید',
    loginSubtitle: 'برای ادامه شماره موبایل خود را وارد کنید',
    newUser: 'کاربر جدید هستید؟',
    existingUser: 'قبلاً ثبت‌نام کرده‌اید؟',
    enterCode: 'کد تایید ارسال شده را وارد کنید',
    codeSentTo: 'کد تایید ارسال شد به',
    changeNumber: 'تغییر شماره',
    completeProfile: 'تکمیل اطلاعات',
  },
  profile: {
    title: 'پروفایل',
    myBooks: 'کتاب‌های من',
    totalBooks: 'تعداد کتاب‌ها',
    memberSince: 'عضویت از',
    editProfile: 'ویرایش پروفایل',
  },
};

// English translations
const en: Translations = {
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
    freeRegisterDesc: 'Create your personal library with free registration and enjoy full features.',
    privacy: 'Privacy',
    terms: 'Terms of Use',
    about: 'About Us',
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
    heroDescription: 'Transform your PDF files into beautiful digital books. Enjoy reading with realistic page-flip animations.',
    startButton: 'Get Started',
    viewBooks: 'View Books',
    features: 'Features',
    whyUs: 'Why ArianDoc?',
    whyUsDesc: 'Professional features for the best digital reading experience',
    recentBooks: 'Recent Books',
    recentBooksDesc: 'Latest added books',
    viewAll: 'View All',
    noBooks: 'No books added yet',
    noBooksDesc: 'Upload your first book and enjoy the digital reading experience',
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
    sortBy: 'Sort by',
    newest: 'Newest',
    oldest: 'Oldest',
    nameAZ: 'Name (A-Z)',
    nameZA: 'Name (Z-A)',
    gridView: 'Grid View',
    listView: 'List View',
    pages: 'pages',
    page: 'page',
    deleteConfirm: 'Are you sure you want to delete this book?',
    processing: 'Processing...',
    booksCount: 'books',
  },
  upload: {
    title: 'Upload New Book',
    dragDrop: 'Drag and drop PDF file here',
    or: 'or',
    browse: 'Browse Files',
    selectFile: 'Select from Device',
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
    step4: 'Complete',
    uploadButton: 'Upload & Process',
    viewBook: 'View Book',
    uploadAnother: 'Upload Another Book',
    goToLibrary: 'Go to Library',
    tryAgain: 'Try Again',
    preparingPages: 'Preparing pages...',
  },
  viewer: {
    page: 'Page',
    of: 'of',
    present: 'Present',
    share: 'Share',
    bookmark: 'Bookmark',
    exit: 'Exit',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    fullscreen: 'Fullscreen',
    sound: 'Sound',
    flipHint: 'Use ← → keys or swipe to flip pages',
    loadingBook: 'Loading book...',
    bookNotFound: 'Book not found',
    bookNotFoundDesc: 'This book does not exist or has been deleted',
    backToLibrary: 'Back to Library',
  },
  auth: {
    loginTitle: 'Sign In',
    registerTitle: 'Create Account',
    phone: 'Phone Number',
    phonePlaceholder: '09xxxxxxxxx',
    code: 'Verification Code',
    codePlaceholder: '6-digit code',
    name: 'Full Name',
    namePlaceholder: 'Enter your name',
    sendCode: 'Send Code',
    verify: 'Verify',
    resendCode: 'Resend Code',
    seconds: 'seconds',
    welcomeBack: 'Welcome Back',
    welcomeMessage: 'Welcome to ArianDoc',
    loginSubtitle: 'Enter your phone number to continue',
    newUser: 'New user?',
    existingUser: 'Already have an account?',
    enterCode: 'Enter the verification code sent',
    codeSentTo: 'Code sent to',
    changeNumber: 'Change Number',
    completeProfile: 'Complete Profile',
  },
  profile: {
    title: 'Profile',
    myBooks: 'My Books',
    totalBooks: 'Total Books',
    memberSince: 'Member Since',
    editProfile: 'Edit Profile',
  },
};

const translations: Record<Language, Translations> = { fa, en };

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('fa');
  const [mounted, setMounted] = useState(false);

  const direction: Direction = language === 'fa' ? 'rtl' : 'ltr';
  const isRTL = direction === 'rtl';

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language | null;
    if (savedLang && (savedLang === 'fa' || savedLang === 'en')) {
      setLanguageState(savedLang);
    }
    setMounted(true);
  }, []);

  // Apply direction to document
  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    root.dir = direction;
    root.lang = language;
    
    localStorage.setItem('language', language);
  }, [language, direction, mounted]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => prev === 'fa' ? 'en' : 'fa');
  };

  // Translation function
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to Persian if key not found
        value = translations['fa'];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, toggleLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
