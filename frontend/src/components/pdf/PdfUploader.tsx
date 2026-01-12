/**
 * PDF Uploader Component
 * Drag-and-drop file upload with progress tracking
 */

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import { ProgressBar } from '@/components/common';
import { formatFileSize } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface PdfUploaderProps {
  onUpload: (file: File) => Promise<void>;
  maxSize?: number; // in MB
  className?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

// =============================================================================
// Component
// =============================================================================

export const PdfUploader: React.FC<PdfUploaderProps> = ({ onUpload, maxSize = 500, className = '' }) => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file type
      if (file.type !== 'application/pdf') {
        setErrorMessage('فقط فایل‌های PDF قابل قبول هستند');
        setUploadStatus('error');
        return;
      }

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        setErrorMessage(`حداکثر حجم فایل ${maxSize} مگابایت است`);
        setUploadStatus('error');
        return;
      }

      setSelectedFile(file);
      setUploadStatus('uploading');
      setErrorMessage('');
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      try {
        await onUpload(file);
        clearInterval(progressInterval);
        setUploadProgress(100);
        setUploadStatus('success');
      } catch (error) {
        clearInterval(progressInterval);
        setUploadStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'خطا در آپلود فایل');
      }
    },
    [maxSize, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    multiple: false,
  });

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage('');
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Idle State - Dropzone */}
      {uploadStatus === 'idle' && (
        <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'dragging' : ''}`}>
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div
              className={`p-4 rounded-full transition-all duration-300 ${
                isDragActive ? 'scale-110' : ''
              }`}
              style={{ backgroundColor: isDragActive ? 'rgba(92, 0, 37, 0.2)' : 'rgba(100, 116, 139, 0.3)' }}
            >
              <Upload className="w-10 h-10" style={{ color: isDragActive ? '#f27794' : '#94a3b8' }} />
            </div>

            <div>
              <p className="text-lg font-medium text-white mb-1">
                {isDragActive ? 'فایل را اینجا رها کنید' : 'PDF خود را آپلود کنید'}
              </p>
              <p className="text-sm text-slate-400">فایل را بکشید و اینجا رها کنید یا کلیک کنید</p>
              <p className="text-xs text-slate-500 mt-2">حداکثر حجم: {maxSize} مگابایت</p>
            </div>
          </div>
        </div>
      )}

      {/* Uploading State */}
      {uploadStatus === 'uploading' && selectedFile && (
        <div className="glass p-6 rounded-xl">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(92, 0, 37, 0.2)' }}>
              <FileText className="w-8 h-8" style={{ color: '#f27794' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{selectedFile.name}</p>
              <p className="text-sm text-slate-400">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              onClick={resetUpload}
              className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
              aria-label="لغو"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <ProgressBar progress={uploadProgress} label="در حال آپلود..." />
        </div>
      )}

      {/* Success State */}
      {uploadStatus === 'success' && selectedFile && (
        <div className="glass p-6 rounded-xl border border-green-500/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-green-500/20">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-green-400 font-medium">آپلود موفقیت‌آمیز</p>
              <p className="text-sm text-slate-400">{selectedFile.name}</p>
            </div>
          </div>

          <button
            onClick={resetUpload}
            className="w-full py-2 px-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-white transition-colors"
          >
            آپلود فایل جدید
          </button>
        </div>
      )}

      {/* Error State */}
      {uploadStatus === 'error' && (
        <div className="glass p-6 rounded-xl border border-red-500/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-red-400 font-medium">خطا در آپلود</p>
              <p className="text-sm text-slate-400">{errorMessage}</p>
            </div>
          </div>

          <button
            onClick={resetUpload}
            className="w-full py-2 px-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-white transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfUploader;
