import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ResponsiveLayout } from '@/components/layout';
import { BookCardSkeleton } from '@/components/common';
import { bookApi, getFullImageUrl, handleApiError } from '@/api/djangoApi';
import { useResponsive } from '@/hooks';
import { useLanguage } from '@/contexts';
import type { Book } from '@/types';
import {
  Search,
  Grid,
  List,
  SortAsc,
  SortDesc,
  BookOpen,
  Clock,
  FileText,
  Trash2,
  MoreVertical,
  Upload,
  Filter,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';
type SortField = 'created_at' | 'title' | 'page_count';
type SortOrder = 'asc' | 'desc';

export default function LibraryPage() {
  const { isMobile } = useResponsive();
  const { t, language } = useLanguage();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchBooks = useCallback(async (pageNum: number, append = false) => {
    try {
      setIsLoading(true);
      const response = await bookApi.getBooks(pageNum, 12);
      
      if (append) {
        setBooks(prev => [...prev, ...response.results]);
      } else {
        setBooks(response.results);
      }
      
      setTotalCount(response.count);
      setHasMore(!!response.next);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks(1);
  }, [fetchBooks]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      fetchBooks(1);
      return;
    }

    try {
      setIsLoading(true);
      const results = await bookApi.searchBooks(searchQuery);
      setBooks(results);
      setHasMore(false);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, fetchBooks]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchBooks(nextPage, true);
    }
  };

  const handleDelete = async (bookId: number) => {
    if (!confirm(t('library.deleteConfirm'))) return;

    try {
      await bookApi.deleteBook(bookId);
      setBooks(prev => prev.filter(book => book.id !== bookId));
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const sortedBooks = [...books].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'title':
        comparison = a.title.localeCompare(b.title, 'fa');
        break;
      case 'page_count':
        comparison = a.page_count - b.page_count;
        break;
      case 'created_at':
      default:
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US');
  };

  return (
    <ResponsiveLayout>
      {/* Page Header */}
      <div className="text-center mb-6 sm:mb-8 pt-4">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl shadow-lg mb-3 sm:mb-4" style={{ background: 'linear-gradient(135deg, #8a1945 0%, #5c0025 100%)', boxShadow: '0 4px 15px rgba(92, 0, 37, 0.4)' }}>
          <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2" style={{ color: 'var(--text-primary)' }}>{t('library.title')}</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('common.yourLibrary')}</p>
      </div>

      {/* Header Controls */}
      <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2 sm:gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute ${language === 'fa' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5`} style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('library.searchPlaceholder')}
              className={`input w-full ${language === 'fa' ? 'pr-9 sm:pr-10 pl-3 sm:pl-4' : 'pl-9 sm:pl-10 pr-3 sm:pr-4'} py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base`}
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-white text-sm font-medium transition-colors"
            style={{ backgroundColor: '#5c0025' }}
          >
            {t('common.search')}
          </button>
        </div>

        {/* Filters and View Options */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Sort Options */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: 'var(--text-tertiary)' }} />
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                onFocus={(e) => { e.target.style.borderColor = '#5c0025'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
              >
                <option value="created_at">{t('library.newest')}</option>
                <option value="title">{t('library.nameAZ')}</option>
                <option value="page_count">{t('library.pages')}</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="btn-icon p-1.5 sm:p-2"
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <SortDesc className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>
            </div>

            {/* Total Count */}
            <span className="text-xs sm:text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {totalCount} {t('library.booksCount')}
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'text-white' : ''
              }`}
              style={viewMode === 'grid' ? { backgroundColor: 'rgba(92, 0, 37, 0.3)', color: '#f27794' } : { color: 'var(--text-tertiary)' }}
              title={t('library.gridView')}
            >
              <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'text-white' : ''
              }`}
              style={viewMode === 'list' ? { backgroundColor: 'rgba(92, 0, 37, 0.3)', color: '#f27794' } : { color: 'var(--text-tertiary)' }}
              title={t('library.listView')}
            >
              <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 sm:p-6 rounded-xl text-center text-red-400 mb-4 sm:mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Books Display */}
      {isLoading && books.length === 0 ? (
        <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${
          viewMode === 'grid'
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
            : 'grid-cols-1'
        }`}>
          {[...Array(8)].map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      ) : sortedBooks.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {sortedBooks.map((book) => (
                <GridBookCard key={book.id} book={book} onDelete={handleDelete} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedBooks.map((book) => (
                <ListBookCard 
                  key={book.id} 
                  book={book} 
                  onDelete={handleDelete}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-6 sm:mt-8">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="btn-secondary px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-medium"
              >
                {isLoading ? t('common.loading') : t('common.next')}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card p-8 sm:p-12 rounded-xl sm:rounded-2xl text-center">
          <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
          <h3 className="text-lg sm:text-xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {searchQuery ? t('library.empty') : t('library.empty')}
          </h3>
          <p className="mb-6 text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            {searchQuery
              ? t('library.empty')
              : t('library.emptyDescription')}
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-white transition-colors text-sm sm:text-base font-medium"
            style={{ backgroundColor: '#5c0025' }}
          >
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{t('library.uploadFirst')}</span>
          </Link>
        </div>
      )}
    </ResponsiveLayout>
  );
}

// Grid Book Card
interface BookCardProps {
  book: Book;
  onDelete: (id: number) => void;
}

function GridBookCard({ book, onDelete }: BookCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="card rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl group relative">
      <Link href={`/viewer/${book.id}`}>
        {/* Thumbnail */}
        <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          {book.thumbnail_url ? (
            <img
              src={getFullImageUrl(book.thumbnail_url)}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #5c0025 0%, #3d0018 100%)' }}>
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: '#f27794' }} />
            </div>
          )}

          {/* Page count */}
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-[10px] sm:text-xs text-white font-medium">
            {book.page_count} {t('library.page')}
          </div>
        </div>

        {/* Info */}
        <div className="p-3 sm:p-4">
          <h3 className="font-medium sm:font-semibold text-sm sm:text-base truncate transition-colors" style={{ color: 'var(--text-primary)' }}>
            {book.title}
          </h3>
          {book.description && (
            <p className="text-xs sm:text-sm line-clamp-2 mt-1 hidden sm:block" style={{ color: 'var(--text-tertiary)' }}>
              {book.description}
            </p>
          )}
        </div>
      </Link>

      {/* Menu Button */}
      <div className="absolute top-2 left-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 sm:p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 
                   hover:bg-black/70 transition-all"
        >
          <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {showMenu && (
          <div className="absolute top-full left-0 mt-1 rounded-lg shadow-lg overflow-hidden z-10" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete(book.id);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-400 
                       hover:bg-red-500/10 w-full"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{t('common.delete')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// List Book Card
interface ListBookCardProps extends BookCardProps {
  formatDate: (date: string) => string;
}

function ListBookCard({ book, onDelete, formatDate }: ListBookCardProps) {
  const { t } = useLanguage();
  return (
    <div className="card rounded-xl overflow-hidden flex gap-3 sm:gap-4 p-3 sm:p-4 transition-colors">
      <Link href={`/viewer/${book.id}`} className="flex-shrink-0">
        <div className="w-16 h-22 sm:w-20 sm:h-28 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          {book.thumbnail_url ? (
            <img
              src={getFullImageUrl(book.thumbnail_url)}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #5c0025 0%, #3d0018 100%)' }}>
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#f27794' }} />
            </div>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/viewer/${book.id}`}>
          <h3 className="font-medium sm:font-semibold text-sm sm:text-base transition-colors truncate" style={{ color: 'var(--text-primary)' }}>
            {book.title}
          </h3>
        </Link>
        
        {book.description && (
          <p className="text-xs sm:text-sm line-clamp-2 mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {book.description}
          </p>
        )}

        <div className="flex items-center gap-3 sm:gap-4 mt-2 text-[10px] sm:text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {book.page_count} {t('library.page')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(book.created_at)}
          </span>
        </div>
      </div>

      <button
        onClick={() => onDelete(book.id)}
        className="p-1.5 sm:p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors self-start"
        title={t('common.delete')}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
