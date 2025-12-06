import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FlipBookViewer } from '@/components/pdf';
import { BookLoadingSpinner, ErrorMessage } from '@/components/common';
import { bookApi, pagesApi, handleApiError } from '@/api/djangoApi';
import type { Book, Page } from '@/types';
import { ArrowRight, BookOpen, Download, Share2, Bookmark } from 'lucide-react';

export default function ViewerPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [book, setBook] = useState<Book | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!id) return;

    const fetchBookData = async () => {
      try {
        setIsLoading(true);
        const bookId = parseInt(id as string);
        
        // Fetch book and pages in parallel
        const [bookData, pagesData] = await Promise.all([
          bookApi.getBook(bookId),
          pagesApi.getPages(bookId),
        ]);

        setBook(bookData);
        setPages(pagesData);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookData();
  }, [id]);

  const handleGoBack = () => {
    router.push('/library');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Save reading progress
    if (book) {
      localStorage.setItem(`reading_progress_${book.id}`, page.toString());
    }
  };

  const handleShare = async () => {
    if (!book) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: book.description || `کتاب ${book.title}`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy link to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('لینک کپی شد');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <BookLoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <ErrorMessage
          title="خطا در بارگذاری کتاب"
          message={error}
          onRetry={() => router.reload()}
        />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">کتاب یافت نشد</h2>
          <p className="text-slate-400 mb-6">این کتاب وجود ندارد یا حذف شده است</p>
          <button
            onClick={handleGoBack}
            className="control-btn-primary px-6 py-3"
          >
            بازگشت به کتابخانه
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{book.title} | FlipBook</title>
        <meta name="description" content={book.description || book.title} />
      </Head>

      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 px-4 py-3 border-b border-slate-700/50 glass">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left: Back button and title */}
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={handleGoBack}
                className="control-btn flex-shrink-0"
                aria-label="بازگشت"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <div className="min-w-0">
                <h1 className="font-semibold text-white truncate">
                  {book.title}
                </h1>
                <p className="text-xs text-slate-400">
                  صفحه {currentPage} از {book.page_count}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="control-btn"
                aria-label="اشتراک‌گذاری"
                title="اشتراک‌گذاری"
              >
                <Share2 className="w-5 h-5" />
              </button>
              
              <button
                className="control-btn"
                aria-label="بوکمارک"
                title="افزودن بوکمارک"
              >
                <Bookmark className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Viewer */}
        <main className="flex-1 min-h-0">
          <FlipBookViewer
            bookId={book.id}
            pages={pages}
            initialPage={currentPage}
            onPageChange={handlePageChange}
            className="h-full"
          />
        </main>
      </div>
    </>
  );
}
