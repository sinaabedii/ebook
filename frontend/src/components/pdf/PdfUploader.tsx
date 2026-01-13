/**
 * PDF Uploader Component
 * Drag-and-drop file upload with progress tracking
 */

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import { ProgressBar } from '@/components/common';
import { formatFileSize } from '@/lib/utils';
import { useLanguage } from '@/contexts';

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
  const { t, language } = useLanguage();
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
        setErrorMessage(t('uploader.onlyPdf'));
        setUploadStatus('error');
        return;
      }

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        setErrorMessage(t('uploader.maxSizeError').replace('{size}', String(maxSize)));
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
        setErrorMessage(error instanceof Error ? error.message : t('uploader.uploadError'));
      }
    },
    [maxSize, onUpload, t]
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
        <div {...getRootProps()} className={`upload-zone hover-lift ${isDragActive ? 'dragging' : ''}`}>
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div
              className={`p-4 rounded-full transition-all duration-500 ${
                isDragActive ? 'scale-110 pulse-ring' : 'hover-scale'
              }`}
              style={{ backgroundColor: isDragActive ? 'rgba(92, 0, 37, 0.2)' : 'rgba(100, 116, 139, 0.3)' }}
            >
              <Upload className={`w-10 h-10 transition-all duration-300 ${isDragActive ? 'animate-bounce-soft' : ''}`} style={{ color: isDragActive ? '#f27794' : '#94a3b8' }} />
            </div>

            <div>
              <p className="text-lg font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                {isDragActive ? t('uploader.dropHere') : t('uploader.uploadPdf')}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('uploader.dragOrClick')}</p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>{t('uploader.maxSize').replace('{size}', String(maxSize))}</p>
            </div>
          </div>
        </div>
      )}

      {/* Uploading State */}
      {uploadStatus === 'uploading' && selectedFile && (
        <div className="glass p-6 rounded-xl animate-fade-in-up">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-lg shine" style={{ backgroundColor: 'rgba(92, 0, 37, 0.2)' }}>
              <FileText className="w-8 h-8" style={{ color: '#f27794' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{selectedFile.name}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              onClick={resetUpload}
              className="p-2 rounded-lg transition-all duration-300 hover-scale"
              style={{ color: 'var(--text-tertiary)' }}
              aria-label={t('common.cancel')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <ProgressBar progress={uploadProgress} label={t('upload.uploading')} />
        </div>
      )}

      {/* Success State */}
      {uploadStatus === 'success' && selectedFile && (
        <div className="glass p-6 rounded-xl border animate-scale-in" style={{ borderColor: 'rgba(92, 0, 37, 0.3)' }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg pulse-ring" style={{ backgroundColor: 'rgba(92, 0, 37, 0.2)' }}>
              <CheckCircle className="w-8 h-8" style={{ color: '#f27794' }} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gradient">{t('upload.success')}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedFile.name}</p>
            </div>
          </div>

          <button
            onClick={resetUpload}
            className="w-full py-2 px-4 rounded-lg transition-all duration-300 hover-lift"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          >
            {t('upload.uploadAnother')}
          </button>
        </div>
      )}

      {/* Error State */}
      {uploadStatus === 'error' && (
        <div className="glass p-6 rounded-xl border border-red-500/30 animate-fade-in-up">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-400 animate-wiggle" />
            </div>
            <div className="flex-1">
              <p className="text-red-400 font-medium">{t('upload.error')}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{errorMessage}</p>
            </div>
          </div>

          <button
            onClick={resetUpload}
            className="w-full py-2 px-4 rounded-lg transition-all duration-300 hover-lift"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          >
            {t('upload.tryAgain')}
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfUploader;
