import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { PresentationViewer } from '@/components/pdf';
import { BookLoadingSpinner, ErrorMessage } from '@/components/common';
import { bookApi, pagesApi, handleApiError } from '@/api/djangoApi';
import type { Book, Page } from '@/types';
import { BookOpen } from 'lucide-react';

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
        
        // Load saved reading progress
        const savedPage = localStorage.getItem(`reading_progress_${bookId}`);
        if (savedPage) {
          setCurrentPage(parseInt(savedPage));
        }
        
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)' }}>
        <BookLoadingSpinner />
        <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>در حال بارگذاری کتاب...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)' }}>
        <ErrorMessage
          title="خطا در بارگذاری کتاب"
          message={error}
          onRetry={() => router.reload()}
        />
      </div>
    );
  }

  // Book not found
  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)' }}>
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
          <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>کتاب یافت نشد</h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>این کتاب وجود ندارد یا حذف شده است</p>
          <button
            onClick={handleGoBack}
            className="px-6 py-3 rounded-xl text-white font-medium transition-colors hover-lift"
            style={{ backgroundColor: '#5c0025' }}
          >
            بازگشت به کتابخانه
          </button>
        </div>
      </div>
    );
  }

  // Direct to Presentation Mode
  return (
    <>
      <Head>
        <title>{book.title} | ArianDoc</title>
        <meta name="description" content={book.description || book.title} />
      </Head>

      <PresentationViewer
        pages={pages}
        initialPage={currentPage}
        bookTitle={book.title}
        onClose={handleGoBack}
        onPageChange={handlePageChange}
      />
    </>
  );
}
