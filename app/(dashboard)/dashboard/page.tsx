'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '@/components/NavBar';
import { useUser } from '@clerk/nextjs';

interface Report {
  id: string;
  fileName: string;
  fileSize: number;
  analysis: {
    overallRiskScore: number;
    risks: any[];
    summary: string;
  };
  createdAt: string;
}

type UploadStatus = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [subscription, setSubscription] = useState({ tier: 'free', uploadsUsed: 0 });
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showAlertNotification, setShowAlertNotification] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ fileName: string; riskScore: number } | null>(null);

  const tierLimits: Record<string, number> = {
    free: 1, starter: 5, growth: 20, pro: Infinity,
  };
  const maxUploads = tierLimits[subscription.tier] || 1;
  const uploadsUsed = subscription.uploadsUsed || 0;
  const canUpload = maxUploads === Infinity || uploadsUsed < maxUploads;

  // Load reports from Clerk on mount
  useEffect(() => {
    if (isLoaded && user) {
      fetchReports();
    }
  }, [isLoaded, user]);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/get-reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        setSubscription(data.subscription || { tier: 'free', uploadsUsed: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    totalReports: reports.length,
    avgRiskScore: reports.length > 0 
      ? (reports.reduce((sum, r) => sum + (r.analysis?.overallRiskScore || 0), 0) / reports.length).toFixed(1)
      : '-',
    highRiskCount: reports.filter(r => (r.analysis?.overallRiskScore || 0) >= 7).length,
    totalRisksFound: reports.reduce((sum, r) => sum + (r.analysis?.risks?.length || 0), 0),
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        processFile(file);
      }
    }
  }, [canUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        processFile(file);
      }
    }
  }, [canUpload]);

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a PDF or image file');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be under 10MB');
      return false;
    }
    return true;
  };

  const processFile = async (file: File) => {
    if (!canUpload) {
      setUploadError(`You've reached your ${maxUploads} analysis limit this month.`);
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError(null);
    setCurrentFileName(file.name);
    setSelectedFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Progress simulation for upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 30));
      }, 100);

      // Call analysis API
      setUploadStatus('analyzing');
      
      const response = await fetch('/api/demo-analyze', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      // Progress for analysis
      for (let i = 30; i <= 90; i += 10) {
        await new Promise(r => setTimeout(r, 150));
        setUploadProgress(i);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      
      // Save report to Clerk metadata
      const report = {
        id: data.reportId,
        fileName: data.fileName || file.name,
        fileSize: data.fileSize || file.size,
        analysis: data.analysis,
        createdAt: new Date().toISOString(),
      };

      try {
        const saveResponse = await fetch('/api/save-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
        });
        
        const saveData = await saveResponse.json();
        
        // Show alert notification if triggered
        if (saveData.alertTriggered && saveData.alertInfo) {
          setAlertInfo({
            fileName: saveData.alertInfo.fileName,
            riskScore: saveData.alertInfo.riskScore,
          });
          setShowAlertNotification(true);
          
          // Auto-hide after 10 seconds
          setTimeout(() => setShowAlertNotification(false), 10000);
        }
      } catch (saveError) {
        console.error('Failed to save report:', saveError);
        // Continue anyway - report was analyzed successfully
      }

      setUploadProgress(100);
      setUploadStatus('success');

      // Refresh reports and navigate
      await fetchReports();
      
      setTimeout(() => {
        router.push(`/reports/${data.reportId}`);
      }, 1000);

    } catch (err) {
      setUploadStatus('error');
      setUploadError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <NavBar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <NavBar />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-[1100px] mx-auto">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-[32px] md:text-[40px] font-semibold text-white mb-2">
              {user?.firstName ? `Welcome, ${user.firstName}` : 'Dashboard'}
            </h1>
            <p className="text-white/50">
              {uploadsUsed}/{maxUploads === Infinity ? '∞' : maxUploads} analyses used · {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} plan
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-[1fr_380px] gap-8">
            
            {/* Main Area */}
            <div className="space-y-6">
              
              {/* Upload Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#1d1d1f] rounded-3xl border border-white/10 overflow-hidden"
              >
                <div className="p-6 border-b border-white/5">
                  <h2 className="text-xl font-semibold text-white">Analyze Document</h2>
                </div>

                <AnimatePresence mode="wait">
                  {uploadStatus === 'idle' && (
                    <motion.div
                      key="upload-idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-6"
                    >
                      {!canUpload ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-[#ff9500]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-[#ff9500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                          </div>
                          <p className="text-white font-medium mb-2">You&apos;ve used all {maxUploads} analyses</p>
                          <p className="text-white/50 text-sm mb-6">Get more to continue analyzing compliance documents</p>
                          
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <a 
                              href={`mailto:neville@rayze.xyz?subject=[LifeØS] Purchase Extra Analyses&body=Hi, I'd like to purchase 5 extra analyses ($10) for my account: ${user?.primaryEmailAddress?.emailAddress || ''}`}
                              className="px-6 py-3 bg-white text-[#1d1d1f] rounded-full font-medium hover:bg-white/90 transition-colors text-sm"
                            >
                              Buy 5 Analyses · $10
                            </a>
                            <Link 
                              href="/pricing" 
                              className="px-6 py-3 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors text-sm"
                            >
                              Upgrade Plan
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all ${
                            isDragging
                              ? 'border-[#0071e3] bg-[#0071e3]/10'
                              : uploadError 
                                ? 'border-[#ff3b30] bg-[#ff3b30]/5'
                                : 'border-white/20'
                          }`}
                        >
                          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors ${
                            isDragging ? 'bg-[#0071e3]' : 'bg-[#0071e3]/20'
                          }`}>
                            <svg className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-[#0071e3]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                          </div>
                          <p className="text-white font-medium mb-2">
                            {isDragging ? 'Drop your file here' : 'Upload a document to analyze'}
                          </p>
                          <p className="text-white/40 text-sm mb-6">PDF, PNG, JPG up to 10MB</p>
                          
                          {/* File input with explicit button trigger */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.webp"
                            onChange={handleFileSelect}
                            style={{ position: 'absolute', left: '-9999px' }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (fileInputRef.current) {
                                fileInputRef.current.click();
                              }
                            }}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Choose File
                          </button>
                          
                          {uploadError && (
                            <p className="mt-4 text-[#ff3b30] text-sm">{uploadError}</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {(uploadStatus === 'uploading' || uploadStatus === 'analyzing') && (
                    <motion.div
                      key="upload-progress"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-8"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-[#0071e3]/20 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#0071e3]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{currentFileName}</p>
                          <p className="text-white/50 text-sm">
                            {uploadStatus === 'uploading' ? 'Uploading...' : 'Analyzing with AI...'}
                          </p>
                        </div>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-[#0071e3] rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-center text-white/40 text-sm mt-4">{uploadProgress}% complete</p>
                    </motion.div>
                  )}

                  {uploadStatus === 'success' && (
                    <motion.div
                      key="upload-success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-8 text-center"
                    >
                      <div className="w-16 h-16 bg-[#34c759] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-white font-medium">Analysis complete!</p>
                      <p className="text-white/50 text-sm">Redirecting to report...</p>
                    </motion.div>
                  )}

                  {uploadStatus === 'error' && (
                    <motion.div
                      key="upload-error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-8 text-center"
                    >
                      <div className="w-16 h-16 bg-[#ff3b30]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-[#ff3b30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                      </div>
                      <p className="text-white font-medium mb-2">{uploadError}</p>
                      <button
                        onClick={() => { setUploadStatus('idle'); setUploadError(null); }}
                        className="text-[#0071e3] hover:underline text-sm font-medium"
                      >
                        Try again
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Recent Reports */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#1d1d1f] rounded-3xl border border-white/10 overflow-hidden"
              >
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                  <h2 className="text-xl font-semibold text-white">Recent Reports</h2>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-white/40">{reports.length} total</span>
                    {reports.length > 0 && (
                      <Link 
                        href="/reports" 
                        className="text-sm text-[#0071e3] hover:text-[#0077ed] font-medium"
                      >
                        View All →
                      </Link>
                    )}
                  </div>
                </div>

                {reports.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <p className="text-white/50">No reports yet</p>
                    <p className="text-white/30 text-sm mt-1">Upload a document above to get started</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {reports.slice(0, 5).map((report, i) => {
                      const score = report.analysis?.overallRiskScore || 0;
                      return (
                        <Link
                          key={report.id}
                          href={`/reports/${report.id}`}
                          className="flex items-center gap-4 p-5 hover:bg-white/5 transition-colors"
                        >
                          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-[#0071e3]" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{report.fileName}</p>
                            <p className="text-white/40 text-sm">
                              {new Date(report.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                            score >= 7 ? 'bg-[#ff3b30]/20 text-[#ff3b30]' :
                            score >= 5 ? 'bg-[#ff9500]/20 text-[#ff9500]' :
                            'bg-[#34c759]/20 text-[#34c759]'
                          }`}>
                            {score}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Reports', value: stats.totalReports, color: 'text-white' },
                    { label: 'Avg Score', value: stats.avgRiskScore, color: 'text-[#ff9500]' },
                    { label: 'High Risk', value: stats.highRiskCount, color: 'text-[#ff3b30]' },
                    { label: 'Risks Found', value: stats.totalRisksFound, color: 'text-white' },
                  ].map((stat, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-xl">
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-white/40">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Quick Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/insights" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#0071e3] to-[#5856d6] rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">Insights</p>
                      <p className="text-xs text-white/40">Digest & alerts</p>
                    </div>
                  </Link>

                  <Link href="/benefits" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#ff9500] to-[#ff3b30] rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">Your Benefits</p>
                      <p className="text-xs text-white/40">View & use perks</p>
                    </div>
                  </Link>

                  <Link href="/team" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 bg-[#5856d6]/20 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#5856d6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">Team</p>
                      <p className="text-xs text-white/40">Manage members</p>
                    </div>
                  </Link>

                  <Link href="/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">Settings</p>
                      <p className="text-xs text-white/40">Account & billing</p>
                    </div>
                  </Link>

                  <a href="mailto:neville@rayze.xyz?subject=[LifeØS] Help" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 bg-[#34c759]/20 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">Get Help</p>
                      <p className="text-xs text-white/40">neville@rayze.xyz</p>
                    </div>
                  </a>
                </div>
              </motion.div>

              {/* Pro Tools - Only show for Pro users */}
              {subscription.tier === 'pro' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-gradient-to-br from-[#1d1d1f] to-[#2d2d2f] rounded-3xl border border-[#ff9500]/30 p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="px-2 py-1 bg-gradient-to-r from-[#ff9500] to-[#ff3b30] text-white text-[10px] font-bold rounded">PRO</div>
                    <h3 className="text-lg font-semibold text-white">Pro Tools</h3>
                  </div>
                  <div className="space-y-2">
                    <Link href="/api-keys" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="w-10 h-10 bg-[#0071e3]/20 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">API Keys</p>
                        <p className="text-xs text-white/40">Integrate LifeØS</p>
                      </div>
                    </Link>
                    <Link href="/sla" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="w-10 h-10 bg-[#34c759]/20 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">SLA Status</p>
                        <p className="text-xs text-white/40">99.9% uptime</p>
                      </div>
                    </Link>
                    <Link href="/branding" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="w-10 h-10 bg-[#af52de]/20 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#af52de]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">Branding</p>
                        <p className="text-xs text-white/40">White-label reports</p>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* Upgrade CTA - Only show for non-Pro users */}
              {subscription.tier !== 'pro' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="p-6 bg-gradient-to-br from-[#0071e3] to-[#5856d6] rounded-3xl"
                >
                  <h3 className="text-lg font-bold text-white mb-2">Upgrade Your Plan</h3>
                  <p className="text-white/80 text-sm mb-4">Get more analyses, team access, and premium features.</p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0071e3] rounded-full text-sm font-semibold hover:bg-white/90 transition-colors"
                  >
                    View Plans
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* High Risk Alert Notification */}
      <AnimatePresence>
        {showAlertNotification && alertInfo && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 max-w-md z-50"
          >
            <div className="bg-gradient-to-r from-[#ff3b30] to-[#ff453a] rounded-2xl shadow-2xl p-5 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-bold">High Risk Alert</h3>
                    <button 
                      onClick={() => setShowAlertNotification(false)}
                      className="text-white/60 hover:text-white"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-white/90 text-sm mb-2">
                    <span className="font-semibold">{alertInfo.fileName}</span> scored <span className="font-bold">{alertInfo.riskScore}/10</span>
                  </p>
                  <p className="text-white/70 text-xs mb-3">
                    An alert email has been queued. Check Settings → Predictive Alerts to manage notifications.
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href="/settings"
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full transition-colors"
                    >
                      View Settings
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
