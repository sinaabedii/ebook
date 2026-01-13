import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ResponsiveLayout } from '@/components/layout';
import { bookApi, getFullImageUrl, handleApiError } from '@/api/djangoApi';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts';
import type { Book } from '@/types';
import { 
  Upload, 
  BookOpen, 
  Clock, 
  FileText, 
  Sparkles,
  Zap,
  Shield,
  ChevronLeft,
  Play,
  Layers
} from 'lucide-react';

// Dynamic import for Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import bookAnimation from '../../public/json/Book Idea.json';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
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
        const errorKey = handleApiError(err);
        // Check if it's a translation key or direct message
        setError(errorKey.startsWith('errors.') ? t(errorKey) : errorKey);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [t]);

  return (
    <ResponsiveLayout showNav={true}>
      {/* Hero Section */}
      <section className="relative mb-8 sm:mb-12 lg:mb-16 animate-fade-in-up">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl card shine">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-brand-800/30 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-40 sm:w-60 lg:w-80 h-40 sm:h-60 lg:h-80 bg-brand-700/20 rounded-full blur-[60px] sm:blur-[80px] lg:blur-[100px] translate-x-1/3 translate-y-1/3" />
          
          <div className="relative z-10 px-4 sm:px-8 lg:px-16 py-8 sm:py-12 lg:py-20">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Content */}
              <div className={`flex-1 text-center ${language === 'fa' ? 'lg:text-right' : 'lg:text-left'}`}>
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm mb-4 sm:mb-6 animate-bounce-soft" style={{ backgroundColor: 'rgba(92, 0, 37, 0.15)', border: '1px solid rgba(92, 0, 37, 0.25)', color: '#5c0025' }}>
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{t('home.badge')}</span>
                </div>
                
                <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {t('home.heroTitle1')}
                  <span className="text-gradient"> {t('home.heroTitle2')} </span>
                  {t('home.heroTitle3')}
                </h1>
                
                <p className="text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {t('home.heroDescription')}
                </p>
                
                <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center ${language === 'fa' ? 'lg:justify-start' : 'lg:justify-start'}`}>
                  <Link href="/upload" className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-medium rounded-xl text-white transition-all shadow-lg hover-lift" style={{ background: 'linear-gradient(135deg, #8a1945 0%, #5c0025 50%, #3d0018 100%)', boxShadow: '0 4px 15px rgba(92, 0, 37, 0.4)' }}>
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{t('home.startButton')}</span>
                  </Link>
                  
                  <Link href="/library" className="btn-secondary px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg hover-lift">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{t('home.viewBooks')}</span>
                  </Link>
                </div>
                
                {/* Stats - Hidden on mobile */}
                <div className="hidden sm:flex items-center justify-center lg:justify-start gap-6 lg:gap-8 mt-8 lg:mt-10 pt-8 lg:pt-10" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <div className="text-center animate-fade-in-up delay-100">
                    <p className="text-2xl lg:text-3xl font-bold text-gradient">{language === 'fa' ? '۱۰۰+' : '100+'}</p>
                    <p className="text-xs lg:text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('common.books')}</p>
                  </div>
                  <div className="w-px h-10 lg:h-12" style={{ backgroundColor: 'var(--border-color)' }} />
                  <div className="text-center animate-fade-in-up delay-200">
                    <p className="text-2xl lg:text-3xl font-bold text-gradient">{language === 'fa' ? '۵۰+' : '50+'}</p>
                    <p className="text-xs lg:text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('common.users')}</p>
                  </div>
                  <div className="w-px h-10 lg:h-12" style={{ backgroundColor: 'var(--border-color)' }} />
                  <div className="text-center animate-fade-in-up delay-300">
                    <p className="text-2xl lg:text-3xl font-bold text-gradient">{language === 'fa' ? '۴.۹' : '4.9'}</p>
                    <p className="text-xs lg:text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('common.rating')}</p>
                  </div>
                </div>
              </div>
              
              {/* Lottie Animation - Visible on tablet and up */}
              <div className="hidden md:flex flex-shrink-0 items-center justify-center hover-scale">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 lg:w-72 lg:h-72 xl:w-80 xl:h-80">
                  <Lottie 
                    animationData={bookAnimation}
                    loop={true}
                    autoplay={true}
                    className="w-full h-full drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-8 sm:mb-12 lg:mb-16 animate-fade-in-up delay-200">
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4 text-gradient">
            {t('home.whyUs')}
          </h2>
          <p className="text-sm sm:text-base max-w-2xl mx-auto px-4" style={{ color: 'var(--text-secondary)' }}>
            {t('home.whyUsDesc')}
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="animate-fade-in-up delay-100">
            <FeatureCard
              icon={<FileText className="w-5 h-5 sm:w-6 sm:h-6" />}
              title={t('home.featurePdf')}
              description={t('home.featurePdfDesc')}
              color="primary"
            />
          </div>
          <div className="animate-fade-in-up delay-200">
            <FeatureCard
              icon={<Layers className="w-5 h-5 sm:w-6 sm:h-6" />}
              title={t('home.feature3d')}
              description={t('home.feature3dDesc')}
              color="accent"
            />
          </div>
          <div className="animate-fade-in-up delay-300">
            <FeatureCard
              icon={<Zap className="w-5 h-5 sm:w-6 sm:h-6" />}
              title={t('home.featureSpeed')}
              description={t('home.featureSpeedDesc')}
              color="yellow"
            />
          </div>
          <div className="animate-fade-in-up delay-400">
            <FeatureCard
              icon={<Shield className="w-5 h-5 sm:w-6 sm:h-6" />}
              title={t('home.featureSecurity')}
              description={t('home.featureSecurityDesc')}
              color="blue"
            />
          </div>
        </div>
      </section>

      {/* Recent Books Section */}
      <section className="mb-8 sm:mb-12 lg:mb-16 animate-fade-in-up delay-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2 text-gradient">
              {t('home.recentBooks')}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('home.recentBooksDesc')}</p>
          </div>
          
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-sm transition-all duration-300 hover-scale"
            style={{ color: '#f27794' }}
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
        <section className="mb-8 animate-fade-in-up">
          <div className="card p-8 sm:p-12 text-center border-animated shine" style={{ background: 'linear-gradient(135deg, rgba(92, 0, 37, 0.15), rgba(92, 0, 37, 0.05))', borderColor: 'rgba(92, 0, 37, 0.3)' }}>
            <h3 className="text-2xl font-bold mb-4 text-gradient">
              {t('common.startNow')}
            </h3>
            <p className="mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              {t('common.freeRegisterDesc')}
            </p>
            <Link href="/auth/login" className="btn-primary px-8 py-3 hover-lift">
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
  primary: 'border',
  accent: 'border',
  yellow: 'border',
  blue: 'border',
};

const colorStyles = {
  primary: { backgroundColor: 'rgba(92, 0, 37, 0.12)', color: '#5c0025', borderColor: 'rgba(92, 0, 37, 0.2)' },
  accent: { backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#16a34a', borderColor: 'rgba(34, 197, 94, 0.2)' },
  yellow: { backgroundColor: 'rgba(234, 179, 8, 0.12)', color: '#ca8a04', borderColor: 'rgba(234, 179, 8, 0.2)' },
  blue: { backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', borderColor: 'rgba(59, 130, 246, 0.2)' },
};

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  return (
    <div className="card rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:shadow-xl group hover-lift border-animated">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 ${colorClasses[color]} group-hover:scale-110 transition-transform duration-300 shine`} style={colorStyles[color]}>
        {icon}
      </div>
      <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-1 sm:mb-2 group-hover:text-gradient transition-all" style={{ color: 'var(--text-primary)' }}>{title}</h3>
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
    <div className="card p-12 text-center animate-scale-in">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shine" style={{ background: 'linear-gradient(135deg, rgba(92, 0, 37, 0.2), rgba(92, 0, 37, 0.1))' }}>
        <BookOpen className="w-10 h-10 animate-bounce-soft" style={{ color: '#f27794' }} />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gradient">
        {t('home.noBooks')}
      </h3>
      <p className="mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-tertiary)' }}>
        {t('home.noBooksDesc')}
      </p>
      <Link href="/upload" className="btn-primary hover-lift shine">
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
      <div className="card rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover-lift border-animated">
        {/* Book Cover */}
        <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          {book.thumbnail_url ? (
            <img
              src={getFullImageUrl(book.thumbnail_url)}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center shine" style={{ background: 'linear-gradient(135deg, #5c0025 0%, #3d0018 100%)' }}>
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 animate-bounce-soft" style={{ color: '#f27794' }} />
            </div>
          )}
          
          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Page count badge */}
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-[10px] sm:text-xs text-white font-medium group-hover:bg-brand-primary/80 transition-colors duration-300">
            {book.page_count} {t('library.page')}
          </div>

          {/* Processing indicator */}
          {!book.is_processed && (
            <div className="absolute inset-0 backdrop-blur-sm flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
              <div className="text-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2 sm:mb-3" style={{ borderColor: '#5c0025', borderTopColor: 'transparent' }} />
                <span className="text-xs sm:text-sm text-white">{t('library.processing')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 sm:p-4">
          <h3 className="font-medium sm:font-semibold text-sm sm:text-base mb-1 truncate group-hover:text-brand-400 transition-colors duration-300" style={{ color: 'var(--text-primary)' }}>
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
