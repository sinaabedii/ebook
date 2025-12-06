import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ResponsiveLayout } from '@/components/layout';
import { BookCardSkeleton } from '@/components/common';
import { bookApi, getFullImageUrl, handleApiError } from '@/api/djangoApi';
import { useResponsive } from '@/hooks';
import type { Book } from '@/types';
import { 
  Upload, 
  BookOpen, 
  Clock, 
  FileText, 
  ArrowLeft,
  Star,
  TrendingUp
} from 'lucide-react';

export default function HomePage() {
  const { isMobile } = useResponsive();
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setIsLoading(true);
        const response = await bookApi.getBooks(1, 6);
        setRecentBooks(response.results);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, []);

  return (
    <ResponsiveLayout>
      {/* Hero Section */}
      <section className="relative mb-12">
        <div className="glass rounded-2xl p-8 md:p-12 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-transparent to-purple-600/20 pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              کتابخانه دیجیتال تعاملی
            </h1>
            <p className="text-lg text-slate-300 mb-8">
              PDF های خود را آپلود کنید و با جلوه‌های بصری حرفه‌ای مطالعه کنید.
              تجربه‌ای مانند ورق زدن کتاب واقعی!
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link
                href="/upload"
                className="control-btn-primary flex items-center gap-2 px-6 py-3 text-lg"
              >
                <Upload className="w-5 h-5" />
                <span>آپلود PDF</span>
              </Link>
              
              <Link
                href="/library"
                className="control-btn flex items-center gap-2 px-6 py-3 text-lg"
              >
                <BookOpen className="w-5 h-5" />
                <span>کتابخانه من</span>
              </Link>
            </div>
          </div>

          {/* Decorative book illustration */}
          <div className="absolute -left-10 -bottom-10 w-64 h-64 opacity-10">
            <BookOpen className="w-full h-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-400" />
          ویژگی‌های برجسته
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<FileText className="w-8 h-8" />}
            title="پشتیبانی از PDF"
            description="آپلود فایل‌های PDF تا 500 مگابایت با پردازش خودکار"
          />
          <FeatureCard
            icon={<BookOpen className="w-8 h-8" />}
            title="ورق زدن واقعی"
            description="انیمیشن‌های 3D حرفه‌ای برای تجربه مطالعه واقعی"
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="بهینه‌سازی موبایل"
            description="تجربه عالی در تمام دستگاه‌ها با کنترل‌های لمسی"
          />
        </div>
      </section>

      {/* Recent Books Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary-400" />
            کتاب‌های اخیر
          </h2>
          
          <Link
            href="/library"
            className="text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
          >
            <span>مشاهده همه</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {error && (
          <div className="glass p-6 rounded-xl text-center text-red-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
            {[...Array(6)].map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : recentBooks.length > 0 ? (
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
            {recentBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="glass p-12 rounded-xl text-center">
            <BookOpen className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">
              هنوز کتابی اضافه نشده
            </h3>
            <p className="text-slate-400 mb-6">
              اولین کتاب خود را آپلود کنید تا در اینجا نمایش داده شود
            </p>
            <Link
              href="/upload"
              className="control-btn-primary inline-flex items-center gap-2 px-6 py-3"
            >
              <Upload className="w-5 h-5" />
              <span>آپلود PDF</span>
            </Link>
          </div>
        )}
      </section>
    </ResponsiveLayout>
  );
}

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="glass p-6 rounded-xl hover:border-primary-500/30 transition-all duration-300">
      <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}

// Book Card Component
interface BookCardProps {
  book: Book;
}

function BookCard({ book }: BookCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  return (
    <Link href={`/viewer/${book.id}`} className="book-card group">
      {/* Thumbnail */}
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-700">
        {book.thumbnail_url ? (
          <img
            src={getFullImageUrl(book.thumbnail_url)}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-slate-500" />
          </div>
        )}
        
        {/* Page count badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-xs text-white">
          {book.page_count} صفحه
        </div>

        {/* Processing indicator */}
        {!book.is_processed && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-sm text-white">در حال پردازش...</span>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 truncate group-hover:text-primary-400 transition-colors">
          {book.title}
        </h3>
        {book.description && (
          <p className="text-sm text-slate-400 line-clamp-2 mb-2">
            {book.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span>{formatDate(book.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
