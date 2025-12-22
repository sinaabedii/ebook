import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ResponsiveLayout } from '@/components/layout';
import { bookApi, getFullImageUrl, handleApiError } from '@/api/djangoApi';
import { useResponsive } from '@/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts';
import type { Book } from '@/types';
import { 
  Upload, 
  BookOpen, 
  Clock, 
  FileText, 
  ArrowLeft,
  Sparkles,
  Zap,
  Shield,
  ChevronLeft,
  Play,
  Layers
} from 'lucide-react';

export default function HomePage() {
  const { isMobile, isTablet } = useResponsive();
  const { isAuthenticated, user } = useAuth();
  const { t, language } = useLanguage();
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setIsLoading(true);
        const response = await bookApi.getBooks(1, 8);
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
    <ResponsiveLayout showNav={true}>
      {/* Hero Section */}
      <section className="relative mb-8 sm:mb-12 lg:mb-16">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl card">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-primary-500/20 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-40 sm:w-60 lg:w-80 h-40 sm:h-60 lg:h-80 bg-accent-500/15 rounded-full blur-[60px] sm:blur-[80px] lg:blur-[100px] translate-x-1/3 translate-y-1/3" />
          
          <div className="relative z-10 px-4 sm:px-8 lg:px-16 py-8 sm:py-12 lg:py-20">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Content */}
              <div className={`flex-1 text-center ${language === 'fa' ? 'lg:text-right' : 'lg:text-left'}`}>
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs sm:text-sm mb-4 sm:mb-6">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{t('home.badge')}</span>
                </div>
                
                <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {t('home.heroTitle1')}
                  <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary-400 to-primary-600"> {t('home.heroTitle2')} </span>
                  {t('home.heroTitle3')}
                </h1>
                
                <p className="text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {t('home.heroDescription')}
                </p>
                
                <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center ${language === 'fa' ? 'lg:justify-start' : 'lg:justify-start'}`}>
                  <Link href="/upload" className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-medium rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/25">
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{t('home.startButton')}</span>
                  </Link>
                  
                  <Link href="/library" className="btn-secondary px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{t('home.viewBooks')}</span>
                  </Link>
                </div>
                
                {/* Stats - Hidden on mobile */}
                <div className="hidden sm:flex items-center justify-center lg:justify-start gap-6 lg:gap-8 mt-8 lg:mt-10 pt-8 lg:pt-10" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <div className="text-center">
                    <p className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{language === 'fa' ? '۱۰۰+' : '100+'}</p>
                    <p className="text-xs lg:text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('common.books')}</p>
                  </div>
                  <div className="w-px h-10 lg:h-12" style={{ backgroundColor: 'var(--border-color)' }} />
                  <div className="text-center">
                    <p className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{language === 'fa' ? '۵۰+' : '50+'}</p>
                    <p className="text-xs lg:text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('common.users')}</p>
                  </div>
                  <div className="w-px h-10 lg:h-12" style={{ backgroundColor: 'var(--border-color)' }} />
                  <div className="text-center">
                    <p className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{language === 'fa' ? '۴.۹' : '4.9'}</p>
                    <p className="text-xs lg:text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('common.rating')}</p>
                  </div>
                </div>
              </div>
              
              {/* 3D Book Preview - Only on large screens */}
              <div className="hidden xl:block flex-shrink-0">
                <div className="relative w-64 h-80 rounded-lg bg-gradient-to-br from-amber-800 to-amber-950 shadow-2xl shadow-black/50 flex items-center justify-center">
                  <div className="text-center p-6">
                    <BookOpen className="w-14 h-14 text-amber-400 mx-auto mb-4" />
                    <p className="text-amber-100 font-bold text-lg">{t('common.yourLibrary')}</p>
                    <p className="text-amber-200/70 text-sm mt-2">{t('common.alwaysAvailable')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-8 sm:mb-12 lg:mb-16">
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('home.whyUs')}
          </h2>
          <p className="text-sm sm:text-base max-w-2xl mx-auto px-4" style={{ color: 'var(--text-secondary)' }}>
            {t('home.whyUsDesc')}
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <FeatureCard
            icon={<FileText className="w-5 h-5 sm:w-6 sm:h-6" />}
            title={t('home.featurePdf')}
            description={t('home.featurePdfDesc')}
            color="primary"
          />
          <FeatureCard
            icon={<Layers className="w-5 h-5 sm:w-6 sm:h-6" />}
            title={t('home.feature3d')}
            description={t('home.feature3dDesc')}
            color="accent"
          />
          <FeatureCard
            icon={<Zap className="w-5 h-5 sm:w-6 sm:h-6" />}
            title={t('home.featureSpeed')}
            description={t('home.featureSpeedDesc')}
            color="yellow"
          />
          <FeatureCard
            icon={<Shield className="w-5 h-5 sm:w-6 sm:h-6" />}
            title={t('home.featureSecurity')}
            description={t('home.featureSecurityDesc')}
            color="blue"
          />
        </div>
      </section>

      {/* Recent Books Section */}
      <section className="mb-8 sm:mb-12 lg:mb-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('home.recentBooks')}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('home.recentBooksDesc')}</p>
          </div>
          
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            <span>{t('home.viewAll')}</span>
            <ChevronLeft className={`w-4 h-4 ${language === 'en' ? 'rotate-180' : ''}`} />
          </Link>
        </div>

        {error && (
          <div className="card p-6 text-center text-red-400 border-red-500/20">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : recentBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {recentBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="mb-8">
          <div className="card p-8 sm:p-12 text-center bg-gradient-to-br from-primary-500/10 to-accent-500/10 border-primary-500/20">
            <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              {t('common.startNow')}
            </h3>
            <p className="mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              {t('common.freeRegisterDesc')}
            </p>
            <Link href="/auth/login" className="btn-primary px-8 py-3">
              {t('common.freeRegister')}
            </Link>
          </div>
        </section>
      )}
    </ResponsiveLayout>
  );
}

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'primary' | 'accent' | 'yellow' | 'blue';
}

const colorClasses = {
  primary: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
  accent: 'bg-accent-500/10 text-accent-400 border-accent-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  return (
    <div className="card rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:shadow-xl group">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 border ${colorClasses[color]} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-1 sm:mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="text-xs sm:text-sm leading-relaxed hidden sm:block" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
    </div>
  );
}

// Book Card Skeleton
function BookCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[3/4] skeleton-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-5 skeleton-shimmer rounded w-3/4" />
        <div className="h-4 skeleton-shimmer rounded w-1/2" />
      </div>
    </div>
  );
}

// Empty State
function EmptyState() {
  const { t } = useLanguage();
  return (
    <div className="card p-12 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        <BookOpen className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        {t('home.noBooks')}
      </h3>
      <p className="mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-tertiary)' }}>
        {t('home.noBooksDesc')}
      </p>
      <Link href="/upload" className="btn-primary">
        <Upload className="w-5 h-5" />
        <span>{t('library.uploadFirst')}</span>
      </Link>
    </div>
  );
}

// Book Card Component
interface BookCardProps {
  book: Book;
}

function BookCard({ book }: BookCardProps) {
  const { t, language } = useLanguage();
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US');
  };

  return (
    <Link href={`/viewer/${book.id}`} className="block group">
      <div className="card rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {/* Book Cover */}
        <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          {book.thumbnail_url ? (
            <img
              src={getFullImageUrl(book.thumbnail_url)}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-900 to-amber-950">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400" />
            </div>
          )}
          
          {/* Page count badge */}
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-[10px] sm:text-xs text-white font-medium">
            {book.page_count} {t('library.page')}
          </div>

          {/* Processing indicator */}
          {!book.is_processed && (
            <div className="absolute inset-0 backdrop-blur-sm flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
              <div className="text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2 sm:mb-3" />
                <span className="text-xs sm:text-sm text-white">{t('library.processing')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 sm:p-4">
          <h3 className="font-medium sm:font-semibold text-sm sm:text-base mb-1 truncate group-hover:text-primary-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
            {book.title}
          </h3>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{formatDate(book.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
