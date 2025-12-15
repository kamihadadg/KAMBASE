import Image from 'next/image';
import { useState } from 'react';

interface FilePreviewProps {
  file: File | string;
  onRemove?: () => void;
  className?: string;
}

export default function FilePreview({ file, onRemove, className = '' }: FilePreviewProps) {
  const [imageError, setImageError] = useState(false);

  const isFile = file instanceof File;
  const fileName = isFile ? file.name : file.split('/').pop() || 'file';
  const fileUrl = isFile ? URL.createObjectURL(file) : file;
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

  if (isImage && !imageError) {
    return (
      <div className={`relative group ${className}`}>
        <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
          <Image
            src={fileUrl}
            alt={fileName}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove file"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate" title={fileName}>
          {fileName}
        </p>
      </div>
    );
  }

  // Document file preview
  return (
    <div className={`flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg ${className}`}>
      <div className="flex-shrink-0">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={fileName}>
          {fileName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isFile ? `${(file.size / 1024).toFixed(1)} KB` : 'Uploaded'}
        </p>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          title="Remove file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
