'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { useUser } from '@clerk/nextjs';

interface Report {
  id: string;
  fileName: string;
  analysis: {
    overallRiskScore: number;
    risks: any[];
  };
  createdAt: string;
}

interface AlertHistoryItem {
  type: string;
  sentAt: string;
  subject: string;
  fileName?: string;
  riskScore?: number;
  reportId?: string;
}

export default function InsightsPage() {
  const { user, isLoaded } = useUser();
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<AlertHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'digest' | 'alerts'>('digest');

  const subscription = user?.publicMetadata?.subscription as { tier?: string } | undefined;
  const tier = subscription?.tier || 'free';
  const hasDigest = tier === 'growth' || tier === 'pro';
  const hasAlerts = tier === 'pro';

  useEffect(() => {
    if (isLoaded && user) {
      fetchData();
    }
  }, [isLoaded, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/get-reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }

      // Get alerts from user metadata
      const metadata = user?.publicMetadata as Record<string, any>;
      setAlerts(metadata?.alertHistory || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate digest stats
  const thisWeekReports = reports.filter(r => {
    const date = new Date(r.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  });

  const avgRiskScore = reports.length > 0
    ? (reports.reduce((sum, r) => sum + (r.analysis?.overallRiskScore || 0), 0) / reports.length)
    : 0;

  const highRiskCount = reports.filter(r => (r.analysis?.overallRiskScore || 0) >= 7).length;
  const totalRisks = reports.reduce((sum, r) => sum + (r.analysis?.risks?.length || 0), 0);

  const riskTrend = thisWeekReports.length > 0
    ? ((thisWeekReports.reduce((sum, r) => sum + (r.analysis?.overallRiskScore || 0), 0) / thisWeekReports.length) - avgRiskScore)
    : 0;

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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#0071e3] hover:text-[#0077ed] mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-[36px] font-semibold text-white mb-2">Compliance Insights</h1>
            <p className="text-[17px] text-white/60">Your compliance digest and risk alerts in one place</p>
          </motion.div>

          {/* Tabs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab('digest')}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                activeTab === 'digest' ? 'bg-white text-[#1d1d1f]' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Weekly Digest
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2 ${
                activeTab === 'alerts' ? 'bg-white text-[#1d1d1f]' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Risk Alerts
              {alerts.length > 0 && (
                <span className="w-5 h-5 bg-[#ff3b30] text-white text-xs rounded-full flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>
          </motion.div>

          {/* Digest Tab */}
          {activeTab === 'digest' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {!hasDigest ? (
                <div className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-12 text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">Weekly Digest</h2>
                  <p className="text-white/60 mb-8">Get comprehensive compliance insights. Upgrade to Growth or Pro.</p>
                  <Link href="/pricing" className="px-8 py-4 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors inline-block">
                    Upgrade to Unlock
                  </Link>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-6">
                      <p className="text-white/50 text-sm mb-2">Total Reports</p>
                      <p className="text-4xl font-bold text-white">{reports.length}</p>
                      <p className="text-[#0071e3] text-sm mt-1">+{thisWeekReports.length} this week</p>
                    </div>
                    <div className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-6">
                      <p className="text-white/50 text-sm mb-2">Avg Risk Score</p>
                      <p className={`text-4xl font-bold ${avgRiskScore >= 7 ? 'text-[#ff3b30]' : avgRiskScore >= 5 ? 'text-[#ff9500]' : 'text-[#34c759]'}`}>
                        {avgRiskScore.toFixed(1)}
                      </p>
                      <p className={`text-sm mt-1 ${riskTrend > 0 ? 'text-[#ff3b30]' : riskTrend < 0 ? 'text-[#34c759]' : 'text-white/50'}`}>
                        {riskTrend > 0 ? '↑' : riskTrend < 0 ? '↓' : '→'} {Math.abs(riskTrend).toFixed(1)} this week
                      </p>
                    </div>
                    <div className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-6">
                      <p className="text-white/50 text-sm mb-2">High Risk Items</p>
                      <p className="text-4xl font-bold text-[#ff3b30]">{highRiskCount}</p>
                      <p className="text-white/50 text-sm mt-1">score ≥ 7</p>
                    </div>
                    <div className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-6">
                      <p className="text-white/50 text-sm mb-2">Total Risks Found</p>
                      <p className="text-4xl font-bold text-white">{totalRisks}</p>
                      <p className="text-white/50 text-sm mt-1">across all reports</p>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8">
                    <h2 className="text-xl font-semibold text-white mb-6">This Week&apos;s Activity</h2>
                    {thisWeekReports.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-white/50">No reports analyzed this week</p>
                        <Link href="/dashboard" className="text-[#0071e3] hover:underline text-sm mt-2 inline-block">
                          Analyze a document →
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {thisWeekReports.slice(0, 5).map((report) => {
                          const score = report.analysis?.overallRiskScore || 0;
                          return (
                            <Link
                              key={report.id}
                              href={`/reports/${report.id}`}
                              className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                            >
                              <div className="w-12 h-12 bg-[#0071e3]/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#0071e3]" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{report.fileName}</p>
                                <p className="text-white/40 text-sm">
                                  {new Date(report.createdAt).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </p>
                              </div>
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                                score >= 7 ? 'bg-[#ff3b30]/20 text-[#ff3b30]' :
                                score >= 5 ? 'bg-[#ff9500]/20 text-[#ff9500]' :
                                'bg-[#34c759]/20 text-[#34c759]'
                              }`}>
                                {score.toFixed(1)}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  <div className="bg-gradient-to-br from-[#0071e3]/20 to-[#5856d6]/20 rounded-3xl border border-[#0071e3]/30 p-8">
                    <h2 className="text-xl font-semibold text-white mb-4">Weekly Recommendations</h2>
                    <ul className="space-y-3">
                      {highRiskCount > 0 && (
                        <li className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-[#ff3b30]/20 rounded-full flex items-center justify-center mt-0.5">
                            <svg className="w-4 h-4 text-[#ff3b30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <p className="text-white/80">Address {highRiskCount} high-risk items immediately to avoid potential fines</p>
                        </li>
                      )}
                      {thisWeekReports.length < 3 && (
                        <li className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-[#0071e3]/20 rounded-full flex items-center justify-center mt-0.5">
                            <svg className="w-4 h-4 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="text-white/80">Upload more documents this week for comprehensive coverage</p>
                        </li>
                      )}
                      <li className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-[#34c759]/20 rounded-full flex items-center justify-center mt-0.5">
                          <svg className="w-4 h-4 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-white/80">Schedule a monthly compliance review with your team</p>
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {!hasAlerts ? (
                <div className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-12 text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">Predictive Risk Alerts</h2>
                  <p className="text-white/60 mb-8">Get real-time alerts when high-risk documents are detected. Pro feature.</p>
                  <Link href="/pricing" className="px-8 py-4 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors inline-block">
                    Upgrade to Pro
                  </Link>
                </div>
              ) : (
                <>
                  {/* Alert Stats */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-6">
                      <p className="text-white/50 text-sm mb-2">Total Alerts</p>
                      <p className="text-4xl font-bold text-white">{alerts.length}</p>
                    </div>
                    <div className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-6">
                      <p className="text-white/50 text-sm mb-2">High Risk Alerts</p>
                      <p className="text-4xl font-bold text-[#ff3b30]">
                        {alerts.filter(a => a.type === 'high_risk').length}
                      </p>
                    </div>
                    <div className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-6">
                      <p className="text-white/50 text-sm mb-2">Regulatory Updates</p>
                      <p className="text-4xl font-bold text-[#0071e3]">
                        {alerts.filter(a => a.type === 'regulatory_change').length}
                      </p>
                    </div>
                  </div>

                  {/* Alert List */}
                  <div className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8">
                    <h2 className="text-xl font-semibold text-white mb-6">Recent Alerts</h2>
                    {alerts.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-[#34c759]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-white font-medium mb-2">No alerts yet</p>
                        <p className="text-white/50 text-sm">Alerts will appear here when high-risk documents are detected</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {alerts.map((alert, i) => (
                          <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              alert.type === 'high_risk' ? 'bg-[#ff3b30]/20' : 'bg-[#0071e3]/20'
                            }`}>
                              <svg className={`w-6 h-6 ${alert.type === 'high_risk' ? 'text-[#ff3b30]' : 'text-[#0071e3]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                {alert.type === 'high_risk' ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                )}
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  alert.type === 'high_risk' ? 'bg-[#ff3b30]/20 text-[#ff3b30]' : 'bg-[#0071e3]/20 text-[#0071e3]'
                                }`}>
                                  {alert.type === 'high_risk' ? 'High Risk' : 'Regulatory Update'}
                                </span>
                                {alert.riskScore && (
                                  <span className="text-white/50 text-sm">Score: {alert.riskScore}/10</span>
                                )}
                              </div>
                              {alert.fileName && (
                                <p className="text-white font-medium">{alert.fileName}</p>
                              )}
                              <p className="text-white/40 text-sm">
                                {new Date(alert.sentAt).toLocaleString()}
                              </p>
                            </div>
                            {alert.reportId && (
                              <Link
                                href={`/reports/${alert.reportId}`}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full transition-colors"
                              >
                                View Report
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Alert Settings Link */}
                  <div className="text-center">
                    <Link href="/settings" className="text-[#0071e3] hover:underline">
                      Configure alert settings →
                    </Link>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

