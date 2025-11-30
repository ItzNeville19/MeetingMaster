'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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

export default function ReportsPage() {
  const { user, isLoaded } = useUser();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  useEffect(() => {
    if (isLoaded && user) {
      fetchReports();
    }
  }, [isLoaded, user]);
  
  // Refresh reports when page becomes visible (e.g., navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLoaded && user) {
        console.log('[Reports] Page visible, refreshing reports...');
        fetchReports();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [isLoaded, user]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Load from local storage first
      let localReports: Report[] = [];
      if (user?.id) {
        try {
          const localData = localStorage.getItem(`lifeos_reports_${user.id}`);
          if (localData) {
            localReports = JSON.parse(localData);
          }
        } catch (e) {
          console.warn('Error loading local reports:', e);
        }
      }
      
      // Fetch from API (Supabase primary, Firestore backup)
      const res = await fetch('/api/get-reports');
      let firestoreReports: Report[] = [];
      if (res.ok) {
        const data = await res.json();
        firestoreReports = data.reports || [];
        
        // Save to local storage
        if (user?.id && firestoreReports.length > 0) {
          try {
            localStorage.setItem(`lifeos_reports_${user.id}`, JSON.stringify(firestoreReports));
          } catch (e) {
            console.warn('Error saving to local storage:', e);
          }
        }
      }
      
      // Merge reports (Firestore takes priority)
      const reportMap = new Map<string, Report>();
      firestoreReports.forEach(r => {
        if (r.id) reportMap.set(r.id, r);
      });
      localReports.forEach(r => {
        if (r.id && !reportMap.has(r.id)) {
          reportMap.set(r.id, r);
        }
      });
      
      const merged = Array.from(reportMap.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setReports(merged);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      // On error, try local storage
      if (user?.id) {
        try {
          const localData = localStorage.getItem(`lifeos_reports_${user.id}`);
          if (localData) {
            setReports(JSON.parse(localData));
          }
        } catch (e) {
          console.error('Failed to load from local storage:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort reports
  const filteredReports = reports
    .filter(report => {
      const score = report.analysis?.overallRiskScore || 0;
      if (filter === 'high') return score >= 7;
      if (filter === 'medium') return score >= 4 && score < 7;
      if (filter === 'low') return score < 4;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return (b.analysis?.overallRiskScore || 0) - (a.analysis?.overallRiskScore || 0);
    });

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
        <div className="max-w-[1000px] mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#0071e3] hover:text-[#0077ed] mb-6 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-[36px] font-semibold text-white mb-2">All Reports</h1>
                <p className="text-white/50">
                  {reports.length} {reports.length === 1 ? 'compliance report' : 'compliance reports'} 
                  {loading ? ' (loading...)' : ''}
                </p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Analysis
              </Link>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center gap-4 mb-8"
          >
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-sm">Filter:</span>
              {[
                { id: 'all', label: 'All' },
                { id: 'high', label: 'High Risk', color: 'text-[#ff3b30]' },
                { id: 'medium', label: 'Medium', color: 'text-[#ff9500]' },
                { id: 'low', label: 'Low Risk', color: 'text-[#34c759]' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === f.id
                      ? 'bg-white text-[#1d1d1f]'
                      : `bg-white/5 ${f.color || 'text-white/60'} hover:bg-white/10`
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-white/50 text-sm">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white text-sm"
              >
                <option value="date">Date (Newest)</option>
                <option value="score">Risk Score</option>
              </select>
            </div>
          </motion.div>

          {/* Reports List */}
          {filteredReports.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-12 text-center"
            >
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                {filter === 'all' ? 'No reports yet' : `No ${filter} risk reports`}
              </h2>
              <p className="text-white/50 mb-6">
                {filter === 'all' 
                  ? 'Upload a document to get started with compliance analysis.'
                  : 'Try a different filter to see more reports.'}
              </p>
              {filter === 'all' && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors"
                >
                  Analyze Your First Document
                </Link>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {filteredReports.map((report, i) => {
                const score = report.analysis?.overallRiskScore || 0;
                const risksCount = report.analysis?.risks?.length || 0;
                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={`/reports/${report.id}`}
                      className="flex items-center gap-6 p-6 bg-[#1d1d1f] rounded-2xl border border-white/10 hover:bg-white/5 transition-colors group"
                    >
                      {/* Icon */}
                      <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-[#0071e3]/20 transition-colors">
                        <svg className="w-7 h-7 text-[#0071e3]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                        </svg>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate group-hover:text-[#0071e3] transition-colors">
                          {report.fileName}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-white/40 text-sm">
                            {new Date(report.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-white/40 text-sm">
                            {risksCount} risk{risksCount !== 1 ? 's' : ''} found
                          </span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center font-bold ${
                        score >= 7 ? 'bg-[#ff3b30]/20 text-[#ff3b30]' :
                        score >= 4 ? 'bg-[#ff9500]/20 text-[#ff9500]' :
                        'bg-[#34c759]/20 text-[#34c759]'
                      }`}>
                        <span className="text-2xl">{score.toFixed(1)}</span>
                        <span className="text-[10px] opacity-60">Score</span>
                      </div>

                      {/* Arrow */}
                      <svg className="w-5 h-5 text-white/30 group-hover:text-[#0071e3] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

