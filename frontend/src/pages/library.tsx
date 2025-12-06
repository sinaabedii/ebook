import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ResponsiveLayout } from '@/components/layout';
import { BookCardSkeleton } from '@/components/common';
import { bookApi, getFullImageUrl, handleApiError } from '@/api/djangoApi';
import { useResponsive } from '@/hooks';
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
    if (!confirm('آیا از حذف این کتاب اطمینان دارید؟')) return;

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
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  return (
    <ResponsiveLayout title="کتابخانه من">
      {/* Header Controls */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="جستجو در کتاب‌ها..."
              className="w-full pr-10 pl-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 
                       text-white placeholder-slate-500 focus:border-primary-500 
                       focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
            />
          </div>
          <button
            onClick={handleSearch}
            className="control-btn-primary px-6"
          >
            جستجو
          </button>
        </div>

        {/* Filters and View Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm 
                         text-white outline-none focus:border-primary-500"
              >
                <option value="created_at">تاریخ</option>
                <option value="title">عنوان</option>
                <option value="page_count">تعداد صفحات</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="control-btn p-2"
                title={sortOrder === 'asc' ? 'صعودی' : 'نزولی'}
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Total Count */}
            <span className="text-sm text-slate-500">
              {totalCount} کتاب
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-primary-500/20 text-primary-400' : 'text-slate-400'
              }`}
              title="نمایش شبکه‌ای"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-primary-500/20 text-primary-400' : 'text-slate-400'
              }`}
              title="نمایش لیستی"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="glass p-6 rounded-xl text-center text-red-400 mb-6">
          {error}
        </div>
      )}

      {/* Books Display */}
      {isLoading && books.length === 0 ? (
        <div className={`grid gap-6 ${
          viewMode === 'grid'
            ? isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1'
        }`}>
          {[...Array(8)].map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      ) : sortedBooks.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className={`grid gap-6 ${
              isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
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
            <div className="text-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="control-btn px-8 py-3"
              >
                {isLoading ? 'در حال بارگذاری...' : 'بارگذاری بیشتر'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="glass p-12 rounded-xl text-center">
          <BookOpen className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">
            {searchQuery ? 'نتیجه‌ای یافت نشد' : 'کتابخانه خالی است'}
          </h3>
          <p className="text-slate-400 mb-6">
            {searchQuery
              ? 'کتابی با این مشخصات یافت نشد'
              : 'اولین کتاب خود را آپلود کنید'}
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

  return (
    <div className="book-card group relative">
      <Link href={`/viewer/${book.id}`}>
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

          {/* Page count */}
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-xs text-white">
            {book.page_count} صفحه
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
            {book.title}
          </h3>
          {book.description && (
            <p className="text-sm text-slate-400 line-clamp-2 mt-1">
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
          className="p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 
                   hover:bg-black/70 transition-all"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showMenu && (
          <div className="absolute top-full left-0 mt-1 bg-slate-800 rounded-lg shadow-lg 
                        border border-slate-700 overflow-hidden z-10">
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete(book.id);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 
                       hover:bg-slate-700 w-full"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف</span>
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
  return (
    <div className="book-card flex gap-4 p-4">
      <Link href={`/viewer/${book.id}`} className="flex-shrink-0">
        <div className="w-20 h-28 rounded-lg overflow-hidden bg-slate-700">
          {book.thumbnail_url ? (
            <img
              src={getFullImageUrl(book.thumbnail_url)}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-slate-500" />
            </div>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/viewer/${book.id}`}>
          <h3 className="font-semibold text-white hover:text-primary-400 transition-colors truncate">
            {book.title}
          </h3>
        </Link>
        
        {book.description && (
          <p className="text-sm text-slate-400 line-clamp-2 mt-1">
            {book.description}
          </p>
        )}

        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {book.page_count} صفحه
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(book.created_at)}
          </span>
        </div>
      </div>

      <button
        onClick={() => onDelete(book.id)}
        className="control-btn p-2 text-red-400 hover:bg-red-500/20"
        title="حذف"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
