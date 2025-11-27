'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  onUpload: (file: File) => void;
}

export default function FileUploader({ onUpload }: FileUploaderProps) {
  const [dragError, setDragError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setDragError(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setDragError('File is too large. Maximum size is 10MB.');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setDragError('Invalid file type. Please upload PDF, PNG, JPG, or WEBP.');
      } else {
        setDragError('Invalid file. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const hasError = isDragReject || dragError;

  return (
    <div
      {...getRootProps()}
      className={`
        relative bg-white rounded-3xl p-12 text-center cursor-pointer transition-all duration-500 overflow-hidden group
        ${isDragActive && !isDragReject 
          ? 'ring-4 ring-[#0071e3] ring-offset-4 shadow-2xl shadow-[#0071e3]/20' 
          : hasError 
            ? 'ring-4 ring-[#ff3b30] ring-offset-4' 
            : 'shadow-lg hover:shadow-2xl border-2 border-dashed border-[#d2d2d7] hover:border-[#0071e3]'
        }
      `}
    >
      <input {...getInputProps()} />
      
      {/* Background gradient on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br from-[#0071e3]/5 to-[#00c7be]/5 transition-opacity duration-500 ${
        isDragActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
      }`} />
      
      {/* Animated border */}
      <div className={`absolute inset-0 rounded-3xl transition-opacity duration-500 ${isDragActive ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#0071e3] via-[#00c7be] to-[#0071e3] animate-gradient p-[2px]">
          <div className="w-full h-full bg-white rounded-3xl" />
        </div>
      </div>

      <div className="relative">
        {/* Icon */}
        <div className={`
          w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center transition-all duration-500
          ${isDragActive && !isDragReject 
            ? 'bg-gradient-to-br from-[#0071e3] to-[#00c7be] scale-110' 
            : hasError 
              ? 'bg-gradient-to-br from-[#ff3b30] to-[#ff6b6b]' 
              : 'bg-gradient-to-br from-[#f5f5f7] to-[#e8e8ed] group-hover:from-[#0071e3]/10 group-hover:to-[#00c7be]/10'
          }
        `}>
          <svg 
            className={`w-10 h-10 transition-all duration-500 ${
              isDragActive && !isDragReject 
                ? 'text-white scale-110' 
                : hasError 
                  ? 'text-white' 
                  : 'text-[#86868b] group-hover:text-[#0071e3]'
            }`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        {/* Text */}
        {hasError ? (
          <>
            <p className="text-xl font-bold text-[#ff3b30] mb-2">Invalid File</p>
            <p className="text-[#86868b]">{dragError || 'Please upload PDF, PNG, JPG, or WEBP files only'}</p>
          </>
        ) : isDragActive ? (
          <>
            <p className="text-xl font-bold text-[#0071e3] mb-2">Drop your file here</p>
            <p className="text-[#86868b]">Release to start the analysis</p>
          </>
        ) : (
          <>
            <p className="text-xl font-bold text-[#1d1d1f] mb-2">Drag & drop your document</p>
            <p className="text-[#86868b] mb-6">or click to browse your files</p>
            <button 
              type="button" 
              className="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-[#0071e3] to-[#0077ed] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-[#0071e3]/25 transition-all duration-300 hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Choose File
            </button>
          </>
        )}
      </div>
    </div>
  );
}
