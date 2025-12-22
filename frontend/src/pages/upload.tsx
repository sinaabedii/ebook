import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { ResponsiveLayout } from '@/components/layout';
import { PdfUploader } from '@/components/pdf';
import { uploadApi, handleApiError } from '@/api/djangoApi';
import { useLanguage } from '@/contexts';
import { FileText, CheckCircle, AlertCircle, Loader, Upload, BookOpen, ArrowRight } from 'lucide-react';

type UploadStep = 'select' | 'metadata' | 'uploading' | 'processing' | 'complete' | 'error';

interface BookMetadata {
  title: string;
  description: string;
}

export default function UploadPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [step, setStep] = useState<UploadStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<BookMetadata>({ title: '', description: '' });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bookId, setBookId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    // Auto-fill title from filename
    const titleFromFile = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
    setMetadata(prev => ({ ...prev, title: titleFromFile }));
    setStep('metadata');
  };

  const handleMetadataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) return;

    setStep('uploading');
    setUploadProgress(0);

    try {
      const response = await uploadApi.uploadPdf(
        selectedFile,
        metadata,
        (progress) => setUploadProgress(progress)
      );

      setBookId(response.book_id);
      
      if (response.status === 'completed') {
        setStep('complete');
      } else if (response.status === 'processing') {
        setStep('processing');
        // Poll for completion
        pollProcessingStatus(response.book_id);
      } else {
        setStep('error');
        setErrorMessage(t('upload.error'));
      }
    } catch (error) {
      setStep('error');
      setErrorMessage(handleApiError(error));
    }
  };

  const pollProcessingStatus = async (id: number) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const status = await uploadApi.checkStatus(id);
        
        if (status.status === 'completed') {
          setStep('complete');
          return;
        } else if (status.status === 'failed') {
          setStep('error');
          setErrorMessage(status.message || t('upload.error'));
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
        } else {
          setStep('error');
          setErrorMessage(t('upload.error'));
        }
      } catch (error) {
        setStep('error');
        setErrorMessage(handleApiError(error));
      }
    };

    checkStatus();
  };

  const handleViewBook = () => {
    if (bookId) {
      router.push(`/viewer/${bookId}`);
    }
  };

  const handleReset = () => {
    setStep('select');
    setSelectedFile(null);
    setMetadata({ title: '', description: '' });
    setUploadProgress(0);
    setBookId(null);
    setErrorMessage('');
  };

  return (
    <ResponsiveLayout showBackButton>
      <div className="max-w-2xl mx-auto pt-4">
        {/* Page Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/25 mb-3 sm:mb-4">
            <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2" style={{ color: 'var(--text-primary)' }}>{t('upload.title')}</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('home.subtitle')}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <StepIndicator 
            step={1} 
            label={t('upload.step1')} 
            isActive={step === 'select'} 
            isCompleted={['metadata', 'uploading', 'processing', 'complete'].includes(step)} 
          />
          <div className={`w-6 sm:w-12 h-0.5 mx-1 sm:mx-2 transition-colors ${['metadata', 'uploading', 'processing', 'complete'].includes(step) ? 'bg-primary-500' : ''}`} style={{ backgroundColor: !['metadata', 'uploading', 'processing', 'complete'].includes(step) ? 'var(--border-color)' : undefined }} />
          <StepIndicator 
            step={2} 
            label={t('upload.step2')} 
            isActive={step === 'metadata'} 
            isCompleted={['uploading', 'processing', 'complete'].includes(step)} 
          />
          <div className={`w-6 sm:w-12 h-0.5 mx-1 sm:mx-2 transition-colors ${['uploading', 'processing', 'complete'].includes(step) ? 'bg-primary-500' : ''}`} style={{ backgroundColor: !['uploading', 'processing', 'complete'].includes(step) ? 'var(--border-color)' : undefined }} />
          <StepIndicator 
            step={3} 
            label={t('upload.step3')} 
            isActive={['uploading', 'processing'].includes(step)} 
            isCompleted={step === 'complete'} 
          />
        </div>

        {/* Step Content */}
        <div className="card rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
          {/* Step 1: File Selection */}
          {step === 'select' && (
            <div>
              <h2 className="text-base sm:text-xl font-semibold mb-2 text-center" style={{ color: 'var(--text-primary)' }}>
                {t('upload.dragDrop')}
              </h2>
              <p className="text-center mb-6 sm:mb-8 text-xs sm:text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {t('upload.maxSize')}
              </p>
              
              <PdfUploader
                onUpload={handleFileSelect}
                maxSize={500}
              />
            </div>
          )}

          {/* Step 2: Metadata Form */}
          {step === 'metadata' && selectedFile && (
            <form onSubmit={handleMetadataSubmit}>
              <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
                {t('upload.step2')}
              </h2>

              {/* File Preview */}
              <div className="flex items-center gap-4 p-4 rounded-xl mb-6" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 border border-primary-500/20">
                  <FileText className="w-7 h-7 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{selectedFile.name}</p>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <div className="badge-success">✓</div>
              </div>

              {/* Title Input */}
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {t('upload.bookTitle')} *
                </label>
                <input
                  type="text"
                  id="title"
                  value={metadata.title}
                  onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                  className="input"
                  placeholder={t('upload.bookTitlePlaceholder')}
                  required
                />
              </div>

              {/* Description Input */}
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {t('upload.bookDescription')}
                </label>
                <textarea
                  id="description"
                  value={metadata.description}
                  onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="input resize-none"
                  placeholder={t('upload.bookDescriptionPlaceholder')}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-secondary flex-1"
                >
                  {t('common.back')}
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  <Upload className="w-4 h-4" />
                  {t('upload.uploadButton')}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Uploading */}
          {step === 'uploading' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: 'var(--border-color)' }} />
                <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
                <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <span className="text-xl font-bold text-primary-400">{uploadProgress}%</span>
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('upload.uploading')}
              </h2>
              <p className="mb-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {t('common.loading')}
              </p>
              
              {/* Progress Bar */}
              <div className="w-full max-w-sm mx-auto">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3b: Processing */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: 'var(--border-color)' }} />
                <div className="absolute inset-0 rounded-full border-4 border-accent-500 border-t-transparent animate-spin" />
                <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <BookOpen className="w-8 h-8 text-accent-400" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('upload.processing')}
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('upload.preparingPages')}
              </p>
            </div>
          )}

          {/* Complete */}
          {step === 'complete' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent-500/20 to-accent-600/20 border border-accent-500/30 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-accent-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('upload.success')}
              </h2>
              <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t('upload.successDesc')}
              </p>
              
              <div className="flex gap-4 justify-center">
                <button onClick={handleReset} className="btn-secondary">
                  <Upload className="w-4 h-4" />
                  {t('upload.uploadAnother')}
                </button>
                <button onClick={handleViewBook} className="btn-primary">
                  <BookOpen className="w-4 h-4" />
                  {t('upload.viewBook')}
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('upload.error')}
              </h2>
              <p className="text-red-400 mb-8 text-sm">
                {errorMessage}
              </p>
              
              <button onClick={handleReset} className="btn-primary">
                {t('upload.tryAgain')}
              </button>
            </div>
          )}
        </div>
      </div>
    </ResponsiveLayout>
  );
}

// Step Indicator Component
interface StepIndicatorProps {
  step: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

function StepIndicator({ step, label, isActive, isCompleted }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center">
      <div className={`
        w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center font-semibold text-xs sm:text-sm
        transition-all duration-300 border-2
        ${isCompleted ? 'bg-accent-500 border-accent-500 text-white shadow-lg shadow-accent-500/25' : ''}
        ${isActive ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/25' : ''}
        ${!isActive && !isCompleted ? 'bg-surface-800 border-surface-700 text-surface-500' : ''}
      `}>
        {isCompleted ? (
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
        ) : (
          step
        )}
      </div>
      <span className={`
        text-[10px] sm:text-xs mt-1.5 sm:mt-2 font-medium transition-colors
        ${isCompleted ? 'text-accent-400' : ''}
        ${isActive ? 'text-primary-400' : ''}
        ${!isActive && !isCompleted ? 'text-surface-500' : ''}
      `}>
        {label}
      </span>
    </div>
  );
}
