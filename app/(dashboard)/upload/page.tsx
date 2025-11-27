'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { useUser } from '@clerk/nextjs';

type UploadStatus = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

const steps = [
  { id: 'upload', label: 'Uploading document' },
  { id: 'ocr', label: 'Extracting text with OCR' },
  { id: 'gpt', label: 'Analyzing with GPT-4o' },
  { id: 'nexus', label: 'Cross-referencing with Pal Nexus' },
  { id: 'report', label: 'Generating compliance report' },
];

const documentTypes = [
  { name: 'Employee Handbook', icon: '📘' },
  { name: 'Safety Manual', icon: '🦺' },
  { name: 'HIPAA Documents', icon: '🏥' },
  { name: 'Permits & Licenses', icon: '📋' },
  { name: 'Training Records', icon: '📝' },
  { name: 'Policy Documents', icon: '📜' },
];

export default function UploadPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Get subscription from Clerk
  const subscription = user?.publicMetadata?.subscription as {
    tier?: string;
    uploadsUsed?: number;
  } | undefined;
  
  const tier = subscription?.tier || 'free';
  const uploadsUsed = subscription?.uploadsUsed || 0;
  const maxUploads = tier === 'pro' ? Infinity : tier === 'growth' ? 20 : tier === 'starter' ? 5 : 1;
  const canUpload = uploadsUsed < maxUploads;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const processFile = async (file: File) => {
    if (!canUpload) {
      setError(`You've reached your ${maxUploads} analysis limit. Upgrade to continue.`);
      return;
    }

    setStatus('uploading');
    setProgress(0);
    setError(null);
    setFileName(file.name);
    setFileSize(formatFileSize(file.size));
    setCurrentStep(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Step 1: Upload
      setCurrentStep(0);
      for (let i = 0; i <= 20; i += 4) {
        await new Promise(r => setTimeout(r, 60));
        setProgress(i);
      }

      // Step 2: OCR
      setStatus('analyzing');
      setCurrentStep(1);
      for (let i = 20; i <= 35; i += 3) {
        await new Promise(r => setTimeout(r, 80));
        setProgress(i);
      }
      
      // Step 3: GPT-4o
      setCurrentStep(2);
      for (let i = 35; i <= 55; i += 2) {
        await new Promise(r => setTimeout(r, 100));
        setProgress(i);
      }
      
      // Step 4: Pal Nexus
      setCurrentStep(3);
      for (let i = 55; i <= 75; i += 4) {
        await new Promise(r => setTimeout(r, 70));
        setProgress(i);
      }

      // Call demo analysis API
      const analyzeResponse = await fetch('/api/demo-analyze', {
        method: 'POST',
        body: formData,
      });

      setCurrentStep(4);
      for (let i = 75; i <= 100; i += 5) {
        await new Promise(r => setTimeout(r, 40));
        setProgress(i);
      }

      if (!analyzeResponse.ok) {
        const data = await analyzeResponse.json();
        throw new Error(data.error || 'Failed to analyze document');
      }

      const analyzeData = await analyzeResponse.json();
      setAnalysisResult(analyzeData);
      
      setStatus('success');
      
      // Store result in sessionStorage
      sessionStorage.setItem(`report_${analyzeData.reportId}`, JSON.stringify({
        id: analyzeData.reportId,
        fileName: file.name,
        analysis: analyzeData.analysis,
        ocr: analyzeData.ocr,
        createdAt: new Date().toISOString(),
        isDemo: true,
      }));

      await new Promise(r => setTimeout(r, 1200));
      router.push(`/reports/${analyzeData.reportId}`);

    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File is too large. Maximum size is 10MB.');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload PDF, PNG, JPG, or WEBP.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, [canUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: status !== 'idle' || !canUpload,
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <NavBar />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-[720px] mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-[40px] md:text-[48px] font-semibold text-white mb-4">
              Analyze Document
            </h1>
            <p className="text-[19px] text-white/60">
              Upload any compliance document for AI-powered analysis
            </p>
            {isLoaded && (
              <p className="text-[14px] text-white/40 mt-2">
                {uploadsUsed}/{maxUploads === Infinity ? '∞' : maxUploads} analyses used this month
              </p>
            )}
          </motion.div>

          <AnimatePresence mode="wait">
            {/* Upload Area */}
            {status === 'idle' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {!canUpload ? (
                  <div className="bg-[#1d1d1f] rounded-3xl p-12 text-center border border-white/10">
                    <div className="w-20 h-20 bg-[#ff9500]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-[#ff9500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-white mb-3">Analysis limit reached</h2>
                    <p className="text-white/60 mb-6">
                      You've used all {maxUploads} {maxUploads === 1 ? 'analysis' : 'analyses'} this month. Upgrade for more.
                    </p>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors"
                    >
                      Upgrade Now
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div
                      {...getRootProps()}
                      className={`relative bg-[#1d1d1f] rounded-3xl p-12 md:p-16 text-center cursor-pointer transition-all duration-300 border-2 border-dashed ${
                        isDragActive
                          ? 'border-[#0071e3] bg-[#0071e3]/10'
                          : error 
                            ? 'border-[#ff3b30] bg-[#ff3b30]/5' 
                            : 'border-white/20 hover:border-[#0071e3]/50'
                      }`}
                    >
                      <input {...getInputProps()} />

                      <motion.div 
                        className={`w-24 h-24 mx-auto mb-8 rounded-3xl flex items-center justify-center transition-colors ${
                          isDragActive ? 'bg-[#0071e3]' : 'bg-[#0071e3]/20'
                        }`}
                        animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                      >
                        <svg 
                          className={`w-12 h-12 ${isDragActive ? 'text-white' : 'text-[#0071e3]'}`} 
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </motion.div>

                      {isDragActive ? (
                        <p className="text-[24px] font-semibold text-[#0071e3]">Drop your file here</p>
                      ) : (
                        <>
                          <p className="text-[24px] font-semibold text-white mb-2">
                            Drag & drop your document
                          </p>
                          <p className="text-[17px] text-white/50 mb-8">
                            or click to browse from your computer
                          </p>
                          <motion.button 
                            className="px-8 py-4 bg-[#0071e3] text-white text-[17px] font-medium rounded-full hover:bg-[#0077ed] transition-colors shadow-lg shadow-[#0071e3]/25"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Choose File
                          </motion.button>
                        </>
                      )}

                      {error && (
                        <motion.p 
                          className="mt-8 text-[#ff3b30] font-medium"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {error}
                        </motion.p>
                      )}
                    </div>

                    {/* Supported formats */}
                    <div className="mt-8 text-center">
                      <p className="text-[13px] text-white/40 mb-6">
                        Supports PDF, PNG, JPG, WEBP · Max 10MB
                      </p>
                      
                      <p className="text-[13px] text-white/50 mb-4 font-medium">Works great with:</p>
                      <div className="flex flex-wrap justify-center gap-3">
                        {documentTypes.map((type) => (
                          <motion.span 
                            key={type.name}
                            className="px-4 py-2.5 bg-[#1d1d1f] rounded-full text-[14px] text-white/70 border border-white/10 flex items-center gap-2"
                            whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.3)' }}
                          >
                            <span>{type.icon}</span>
                            {type.name}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Processing */}
            {(status === 'uploading' || status === 'analyzing') && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-[#1d1d1f] rounded-3xl p-12 md:p-16 border border-white/10"
              >
                {/* Progress Circle */}
                <div className="w-40 h-40 mx-auto mb-10 relative">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                    <motion.circle 
                      cx="50" cy="50" r="42" fill="none" 
                      stroke="#0071e3" 
                      strokeWidth="6"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 264' }}
                      animate={{ strokeDasharray: `${progress * 2.64} 264` }}
                      transition={{ duration: 0.3 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-white">{progress}%</span>
                    <span className="text-[13px] text-white/50">Complete</span>
                  </div>
                </div>

                {/* Current step */}
                <div className="text-center mb-10">
                  <p className="text-[24px] font-semibold text-white mb-2">{steps[currentStep].label}</p>
                  <div className="flex items-center justify-center gap-2 text-white/50">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                    <span className="text-[15px]">{fileName}</span>
                    <span className="text-[13px]">({fileSize})</span>
                  </div>
                </div>

                {/* Steps */}
                <div className="max-w-md mx-auto space-y-3">
                  {steps.map((step, i) => (
                    <motion.div 
                      key={step.id}
                      className={`flex items-center gap-4 p-4 rounded-2xl ${
                        i === currentStep 
                          ? 'bg-[#0071e3]/10 ring-1 ring-[#0071e3]/30' 
                          : i < currentStep 
                            ? 'bg-[#34c759]/10' 
                            : 'bg-white/5'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        i < currentStep 
                          ? 'bg-[#34c759]' 
                          : i === currentStep 
                            ? 'bg-[#0071e3]' 
                            : 'bg-white/10'
                      }`}>
                        {i < currentStep ? (
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : i === currentStep ? (
                          <motion.div
                            className="w-2.5 h-2.5 bg-white rounded-full"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        ) : (
                          <span className="text-sm font-medium text-white/40">{i + 1}</span>
                        )}
                      </div>
                      <span className={`text-[15px] font-medium ${
                        i <= currentStep ? 'text-white' : 'text-white/40'
                      }`}>
                        {step.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Success */}
            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#1d1d1f] rounded-3xl p-12 md:p-16 text-center border border-white/10"
              >
                <motion.div 
                  className="w-24 h-24 bg-[#34c759] rounded-full flex items-center justify-center mx-auto mb-8"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                >
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h2 className="text-[28px] font-semibold text-white mb-3">Analysis Complete</h2>
                <p className="text-[17px] text-white/60 mb-2">Your compliance report is ready.</p>
                {analysisResult && (
                  <div className="mb-6 p-4 bg-white/5 rounded-2xl inline-flex items-center gap-6">
                    <div className="text-center">
                      <p className={`text-3xl font-bold ${
                        analysisResult.analysis.overallRiskScore >= 7 ? 'text-[#ff3b30]' : 'text-[#ff9500]'
                      }`}>{analysisResult.analysis.overallRiskScore}</p>
                      <p className="text-[11px] text-white/50">Risk Score</p>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white">{analysisResult.analysis.risks?.length || 0}</p>
                      <p className="text-[11px] text-white/50">Risks Found</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 text-[#0071e3]">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-[15px] font-medium">Redirecting to report...</span>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-[#1d1d1f] rounded-3xl p-12 md:p-16 text-center border border-white/10"
              >
                <div className="w-24 h-24 bg-[#ff3b30]/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <svg className="w-12 h-12 text-[#ff3b30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <h2 className="text-[28px] font-semibold text-white mb-3">Something went wrong</h2>
                <p className="text-[17px] text-white/60 mb-8 max-w-md mx-auto">{error}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button 
                    onClick={() => { setStatus('idle'); setError(null); }}
                    className="px-8 py-4 bg-[#0071e3] text-white text-[17px] font-medium rounded-full hover:bg-[#0077ed] transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Try Again
                  </motion.button>
                  <Link
                    href="/dashboard"
                    className="px-8 py-4 bg-white/10 text-white text-[17px] font-medium rounded-full hover:bg-white/20 transition-colors"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Security note */}
          {status === 'idle' && canUpload && (
            <motion.div 
              className="mt-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center gap-2 text-white/40">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-[13px]">Your documents are encrypted and deleted after analysis</span>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
