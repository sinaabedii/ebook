import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { ResponsiveLayout } from '@/components/layout';
import { PdfUploader } from '@/components/pdf';
import { uploadApi, handleApiError } from '@/api/djangoApi';
import { FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';

type UploadStep = 'select' | 'metadata' | 'uploading' | 'processing' | 'complete' | 'error';

interface BookMetadata {
  title: string;
  description: string;
}

export default function UploadPage() {
  const router = useRouter();
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
        setErrorMessage('خطا در آپلود فایل');
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
          setErrorMessage(status.message || 'خطا در پردازش فایل');
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
        } else {
          setStep('error');
          setErrorMessage('پردازش فایل بیش از حد طول کشید');
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
    <ResponsiveLayout title="آپلود کتاب" showBackButton>
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <StepIndicator 
            step={1} 
            label="انتخاب فایل" 
            isActive={step === 'select'} 
            isCompleted={['metadata', 'uploading', 'processing', 'complete'].includes(step)} 
          />
          <div className="w-12 h-0.5 bg-slate-700 mx-2" />
          <StepIndicator 
            step={2} 
            label="اطلاعات" 
            isActive={step === 'metadata'} 
            isCompleted={['uploading', 'processing', 'complete'].includes(step)} 
          />
          <div className="w-12 h-0.5 bg-slate-700 mx-2" />
          <StepIndicator 
            step={3} 
            label="آپلود" 
            isActive={['uploading', 'processing'].includes(step)} 
            isCompleted={step === 'complete'} 
          />
        </div>

        {/* Step Content */}
        <div className="glass rounded-2xl p-8">
          {/* Step 1: File Selection */}
          {step === 'select' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 text-center">
                فایل PDF خود را انتخاب کنید
              </h2>
              <p className="text-slate-400 text-center mb-8">
                فایل‌های تا 500 مگابایت پشتیبانی می‌شوند
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
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                اطلاعات کتاب
              </h2>

              {/* File Preview */}
              <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl mb-6">
                <div className="p-3 rounded-lg bg-primary-500/20">
                  <FileText className="w-8 h-8 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-slate-400">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              {/* Title Input */}
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
                  عنوان کتاب *
                </label>
                <input
                  type="text"
                  id="title"
                  value={metadata.title}
                  onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 
                           text-white placeholder-slate-500 focus:border-primary-500 
                           focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                  placeholder="عنوان کتاب را وارد کنید"
                  required
                />
              </div>

              {/* Description Input */}
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                  توضیحات (اختیاری)
                </label>
                <textarea
                  id="description"
                  value={metadata.description}
                  onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 
                           text-white placeholder-slate-500 focus:border-primary-500 
                           focus:ring-1 focus:ring-primary-500 outline-none transition-colors resize-none"
                  placeholder="توضیحات کتاب را وارد کنید..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-3 px-6 rounded-lg bg-slate-700 text-white 
                           hover:bg-slate-600 transition-colors"
                >
                  بازگشت
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-6 rounded-lg bg-primary-500 text-white 
                           hover:bg-primary-600 transition-colors font-medium"
                >
                  آپلود کتاب
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Uploading */}
          {step === 'uploading' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-6 relative">
                <Loader className="w-full h-full text-primary-500 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                در حال آپلود...
              </h2>
              <p className="text-slate-400 mb-6">
                لطفاً صبر کنید تا فایل آپلود شود
              </p>
              
              {/* Progress Bar */}
              <div className="w-full max-w-xs mx-auto">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-slate-400 mt-2">{uploadProgress}%</p>
              </div>
            </div>
          )}

          {/* Step 3b: Processing */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
                <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                در حال پردازش...
              </h2>
              <p className="text-slate-400">
                فایل در حال تبدیل به صفحات قابل نمایش است
              </p>
              <p className="text-sm text-slate-500 mt-2">
                این عملیات ممکن است چند دقیقه طول بکشد
              </p>
            </div>
          )}

          {/* Complete */}
          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                آپلود موفقیت‌آمیز!
              </h2>
              <p className="text-slate-400 mb-8">
                کتاب شما با موفقیت آپلود و پردازش شد
              </p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleReset}
                  className="py-3 px-6 rounded-lg bg-slate-700 text-white 
                           hover:bg-slate-600 transition-colors"
                >
                  آپلود کتاب جدید
                </button>
                <button
                  onClick={handleViewBook}
                  className="py-3 px-6 rounded-lg bg-primary-500 text-white 
                           hover:bg-primary-600 transition-colors font-medium"
                >
                  مشاهده کتاب
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                خطا در آپلود
              </h2>
              <p className="text-red-400 mb-8">
                {errorMessage}
              </p>
              
              <button
                onClick={handleReset}
                className="py-3 px-6 rounded-lg bg-primary-500 text-white 
                         hover:bg-primary-600 transition-colors font-medium"
              >
                تلاش مجدد
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
        w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm
        transition-all duration-300
        ${isCompleted ? 'bg-green-500 text-white' : ''}
        ${isActive ? 'bg-primary-500 text-white ring-4 ring-primary-500/30' : ''}
        ${!isActive && !isCompleted ? 'bg-slate-700 text-slate-400' : ''}
      `}>
        {isCompleted ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          step
        )}
      </div>
      <span className={`
        text-xs mt-2 transition-colors
        ${isActive ? 'text-primary-400' : 'text-slate-500'}
      `}>
        {label}
      </span>
    </div>
  );
}
