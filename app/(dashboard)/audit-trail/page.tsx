'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { useUser } from '@clerk/nextjs';

interface AuditEvent {
  id: string;
  type: 'analysis' | 'document_upload' | 'report_download' | 'settings_change' | 'team_action' | 'api_call';
  action: string;
  userId: string;
  userName?: string;
  timestamp: string;
  details?: Record<string, any>;
  reportId?: string;
  fileName?: string;
}

export default function AuditTrailPage() {
  const { user, isLoaded } = useUser();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'analysis' | 'downloads' | 'team' | 'api'>('all');

  const subscription = user?.publicMetadata?.subscription as { 
    tier?: string; 
    isOwner?: boolean; 
    isDev?: boolean;
  } | undefined;
  const tier = subscription?.tier || 'free';
  const isOwner = subscription?.isOwner || subscription?.isDev;
  const hasAccess = isOwner || tier === 'growth' || tier === 'pro';

  useEffect(() => {
    if (isLoaded && user && hasAccess) {
      fetchAuditTrail();
    }
  }, [isLoaded, user, hasAccess]);

  const fetchAuditTrail = async () => {
    setLoading(true);
    try {
      // Fetch reports to build audit trail
      const res = await fetch('/api/get-reports');
      if (res.ok) {
        const data = await res.json();
        const reports = data.reports || [];
        
        // Build audit events from reports
        const auditEvents: AuditEvent[] = reports.map((report: any) => ({
          id: `analysis-${report.id}`,
          type: 'analysis',
          action: 'Document analyzed',
          userId: user?.id || '',
          userName: user?.fullName || 'Unknown',
          timestamp: report.createdAt,
          reportId: report.id,
          fileName: report.fileName,
          details: {
            riskScore: report.analysis?.overallRiskScore,
            risksFound: report.analysis?.risks?.length || 0,
          },
        }));
        
        // Sort by timestamp (newest first)
        auditEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setEvents(auditEvents);
      }
    } catch (err) {
      console.error('Failed to fetch audit trail:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => {
        if (filter === 'analysis') return e.type === 'analysis';
        if (filter === 'downloads') return e.type === 'report_download';
        if (filter === 'team') return e.type === 'team_action';
        if (filter === 'api') return e.type === 'api_call';
        return true;
      });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'analysis':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'report_download':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        );
      case 'team_action':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'api_call':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <NavBar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <NavBar />
        <main className="pt-24 pb-20 px-6">
          <div className="max-w-[600px] mx-auto text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Growth/Pro Feature</h1>
            <p className="text-white/60 mb-8">Compliance Audit Trail is available on Growth and Pro plans. Track every compliance action for regulatory audits.</p>
            <Link href="/pricing" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors">
              Upgrade to Unlock
            </Link>
          </div>
        </main>
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
            <h1 className="text-[36px] font-semibold text-white mb-2">Compliance Audit Trail</h1>
            <p className="text-[17px] text-white/60">Complete history of all compliance actions for regulatory audits and due diligence</p>
          </motion.div>

          {/* Filters */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-2 mb-8">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'analysis', label: 'Analyses' },
              { id: 'downloads', label: 'Downloads' },
              { id: 'team', label: 'Team Actions' },
              { id: 'api', label: 'API Calls' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  filter === f.id
                    ? 'bg-white text-[#1d1d1f]'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </motion.div>

          {/* Events List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-12 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-white/60">No audit events found</p>
              <p className="text-white/40 text-sm mt-2">Events will appear here as you use LifeØS</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      event.type === 'analysis' ? 'bg-[#0071e3]/20' :
                      event.type === 'report_download' ? 'bg-[#34c759]/20' :
                      event.type === 'team_action' ? 'bg-[#ff9500]/20' :
                      'bg-white/10'
                    }`}>
                      <div className={`${
                        event.type === 'analysis' ? 'text-[#0071e3]' :
                        event.type === 'report_download' ? 'text-[#34c759]' :
                        event.type === 'team_action' ? 'text-[#ff9500]' :
                        'text-white/60'
                      }`}>
                        {getEventIcon(event.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-semibold">{event.action}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          event.type === 'analysis' ? 'bg-[#0071e3]/20 text-[#0071e3]' :
                          event.type === 'report_download' ? 'bg-[#34c759]/20 text-[#34c759]' :
                          event.type === 'team_action' ? 'bg-[#ff9500]/20 text-[#ff9500]' :
                          'bg-white/10 text-white/60'
                        }`}>
                          {event.type.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                      {event.fileName && (
                        <p className="text-white/80 mb-1">{event.fileName}</p>
                      )}
                      {event.details && (
                        <div className="flex gap-4 text-sm text-white/50 mt-2">
                          {event.details.riskScore !== undefined && (
                            <span>Risk Score: {event.details.riskScore.toFixed(1)}</span>
                          )}
                          {event.details.risksFound !== undefined && (
                            <span>{event.details.risksFound} risks found</span>
                          )}
                        </div>
                      )}
                      <p className="text-white/40 text-xs mt-2">
                        {new Date(event.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {event.reportId && (
                      <Link
                        href={`/reports/${event.reportId}`}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full transition-colors"
                      >
                        View Report
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Export Option */}
          {filteredEvents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 text-center"
            >
              <button
                onClick={() => {
                  const csv = [
                    ['Type', 'Action', 'User', 'Timestamp', 'File Name', 'Details'].join(','),
                    ...filteredEvents.map(e => [
                      e.type,
                      e.action,
                      e.userName || 'Unknown',
                      e.timestamp,
                      e.fileName || '',
                      JSON.stringify(e.details || {}),
                    ].join(',')),
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-colors"
              >
                Export to CSV
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
