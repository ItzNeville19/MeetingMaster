'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '@/components/NavBar';
import { jsPDF } from 'jspdf';

interface Risk {
  id: number;
  title: string;
  description: string;
  severity: number;
  category: string;
  regulation: string;
  potentialFine: string;
  fix: string;
}

interface Analysis {
  summary: string;
  overallRiskScore: number;
  risks: Risk[];
  policyUpdates: { section: string; currentIssue: string; suggestedLanguage: string }[];
  actionPlan: { day1: string; day2_3: string; day4_5: string; day6_7: string };
  positiveFindings: string[];
}

interface Report {
  id: string;
  fileName: string;
  analysis: Analysis;
  createdAt: string;
}

function getSeverityColor(severity: number): { bg: string; text: string } {
  if (severity >= 9) return { bg: 'bg-[#ff3b30]/20', text: 'text-[#ff3b30]' };
  if (severity >= 7) return { bg: 'bg-[#ff9500]/20', text: 'text-[#ff9500]' };
  if (severity >= 5) return { bg: 'bg-[#ffcc00]/20', text: 'text-[#966a00]' };
  return { bg: 'bg-[#34c759]/20', text: 'text-[#34c759]' };
}

function getSeverityLabel(severity: number): string {
  if (severity >= 9) return 'Critical';
  if (severity >= 7) return 'High';
  if (severity >= 5) return 'Medium';
  return 'Low';
}

export default function ReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'risks' | 'fixes' | 'plan'>('risks');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const downloadPdf = async () => {
    if (!report) return;
    
    setGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let y = 20;

      // Helper function to add wrapped text
      const addWrappedText = (text: string, x: number, startY: number, maxWidth: number, lineHeight: number = 7): number => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, startY);
        return startY + (lines.length * lineHeight);
      };

      // Header
      doc.setFillColor(29, 29, 31);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('LifeØS', margin, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Compliance Analysis Report', margin, 30);
      
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, 20);

      // Risk Score
      const score = report.analysis.overallRiskScore;
      doc.setFillColor(score >= 7 ? 255 : score >= 5 ? 255 : 52, score >= 7 ? 59 : score >= 5 ? 149 : 199, score >= 7 ? 48 : score >= 5 ? 0 : 89);
      doc.rect(pageWidth - margin - 25, 25, 25, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(score.toFixed(1), pageWidth - margin - 17, 33);

      y = 55;

      // Document Name
      doc.setTextColor(29, 29, 31);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      y = addWrappedText(report.fileName, margin, y, contentWidth, 8);
      y += 5;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(134, 134, 139);
      doc.text(`Analyzed: ${new Date(report.createdAt).toLocaleDateString()}`, margin, y);
      y += 15;

      // Executive Summary
      doc.setTextColor(29, 29, 31);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', margin, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      y = addWrappedText(report.analysis.summary, margin, y, contentWidth, 6);
      y += 15;

      // Risks
      doc.setTextColor(29, 29, 31);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Identified Risks', margin, y);
      y += 10;

      for (const risk of report.analysis.risks || []) {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        // Severity indicator
        const severityColor = risk.severity >= 9 ? [255, 59, 48] : 
                             risk.severity >= 7 ? [255, 149, 0] : 
                             risk.severity >= 5 ? [255, 204, 0] : [52, 199, 89];
        doc.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
        doc.rect(margin, y - 3, 3, 20, 'F');

        doc.setTextColor(29, 29, 31);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(risk.title, margin + 8, y);
        
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`${getSeverityLabel(risk.severity)} (${risk.severity}/10)`, pageWidth - margin - 30, y);
        y += 6;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        y = addWrappedText(risk.description, margin + 8, y, contentWidth - 8, 5);
        
        doc.setFontSize(8);
        doc.setTextColor(134, 134, 139);
        doc.text(`Regulation: ${risk.regulation} | Potential Fine: ${risk.potentialFine}`, margin + 8, y);
        y += 12;
      }

      // Action Plan
      if (y > 220) {
        doc.addPage();
        y = 20;
      }
      y += 5;
      doc.setTextColor(29, 29, 31);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('7-Day Action Plan', margin, y);
      y += 10;

      const actionPlan = report.analysis.actionPlan;
      if (actionPlan) {
        const days = [
          { label: 'Day 1', value: actionPlan.day1 },
          { label: 'Days 2-3', value: actionPlan.day2_3 },
          { label: 'Days 4-5', value: actionPlan.day4_5 },
          { label: 'Days 6-7', value: actionPlan.day6_7 },
        ];

        for (const day of days) {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 113, 227);
          doc.text(day.label, margin, y);
          
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          y = addWrappedText(day.value || '', margin + 25, y, contentWidth - 25, 5);
          y += 5;
        }
      }

      // Footer
      doc.addPage();
      doc.setFontSize(8);
      doc.setTextColor(134, 134, 139);
      doc.setFont('helvetica', 'bold');
      doc.text('LEGAL DISCLAIMER', margin, 20);
      doc.setFont('helvetica', 'normal');
      const disclaimer = 'This compliance analysis report is generated by LifeØS AI for informational purposes only. This report does not constitute legal advice and should not be relied upon as such. Always consult with qualified legal counsel before making decisions related to regulatory compliance.';
      addWrappedText(disclaimer, margin, 28, contentWidth, 5);

      // Save
      const fileName = report.fileName.replace(/\.[^/.]+$/, '');
      doc.save(`${fileName}_Compliance_Report.pdf`);
      
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  useEffect(() => {
    async function fetchReport() {
      try {
        // Check if report data was passed via URL params (from recent analysis)
        const dataParam = searchParams.get('data');
        if (dataParam) {
          const data = JSON.parse(decodeURIComponent(dataParam));
          setReport({
            id: data.reportId,
            fileName: data.fileName || 'Document',
            analysis: data.analysis,
            createdAt: new Date().toISOString(),
          });
          setLoading(false);
          return;
        }

        // Otherwise fetch from Clerk metadata via API
        const response = await fetch('/api/get-reports');
        if (response.ok) {
          const data = await response.json();
          const foundReport = data.reports?.find((r: Report) => r.id === id);
          if (foundReport) {
            setReport(foundReport);
          }
        }
      } catch (err) {
        console.error('Failed to fetch report:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <NavBar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <NavBar />
        <main className="pt-24 pb-20 px-6">
          <div className="max-w-[600px] mx-auto text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-white mb-4">Report Not Found</h1>
            <p className="text-white/60 mb-8">This report may have been deleted or doesn&apos;t exist.</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { analysis } = report;
  const scoreColor = analysis.overallRiskScore >= 7 ? 'text-[#ff3b30]' : 
                     analysis.overallRiskScore >= 5 ? 'text-[#ff9500]' : 'text-[#34c759]';

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
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#0071e3] hover:text-[#0077ed] mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-[28px] md:text-[36px] font-semibold text-white mb-2">
                  {report.fileName}
                </h1>
                <p className="text-white/50">
                  Analyzed {new Date(report.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Download PDF Button */}
                <button
                  onClick={downloadPdf}
                  disabled={generatingPdf}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors disabled:opacity-50"
                >
                  {generatingPdf ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download PDF
                    </>
                  )}
                </button>

                {/* Risk Score Badge */}
                <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center ${
                  analysis.overallRiskScore >= 7 ? 'bg-[#ff3b30]/20' :
                  analysis.overallRiskScore >= 5 ? 'bg-[#ff9500]/20' : 'bg-[#34c759]/20'
                }`}>
                  <span className={`text-3xl font-bold ${scoreColor}`}>
                    {analysis.overallRiskScore}
                  </span>
                  <span className="text-white/50 text-[10px]">Risk Score</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8 mb-8"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Executive Summary</h2>
            <p className="text-white/70 leading-relaxed">{analysis.summary}</p>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { id: 'risks', label: 'Risks', count: analysis.risks?.length || 0 },
              { id: 'fixes', label: 'Fixes' },
              { id: 'plan', label: '7-Day Plan' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#0071e3] text-white'
                    : 'bg-[#1d1d1f] text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 opacity-60">({tab.count})</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'risks' && (
              <motion.div
                key="risks"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {analysis.risks?.map((risk, i) => {
                  const colors = getSeverityColor(risk.severity);
                  return (
                    <motion.div
                      key={risk.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-6"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-white/40 text-sm">{risk.category}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                              {getSeverityLabel(risk.severity)} ({risk.severity}/10)
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-white">{risk.title}</h3>
                        </div>
                      </div>
                      <p className="text-white/60 mb-4">{risk.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-white/40">Regulation: </span>
                          <span className="text-white/80">{risk.regulation}</span>
                        </div>
                        <div>
                          <span className="text-white/40">Potential Fine: </span>
                          <span className="text-[#ff3b30] font-semibold">{risk.potentialFine}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === 'fixes' && (
              <motion.div
                key="fixes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {analysis.risks?.map((risk, i) => (
                  <motion.div
                    key={risk.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-[#0071e3]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-[#0071e3] font-semibold text-sm">{i + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-2">{risk.title}</h3>
                        <p className="text-white/60">{risk.fix}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === 'plan' && (
              <motion.div
                key="plan"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {[
                  { label: 'Day 1', value: analysis.actionPlan?.day1 },
                  { label: 'Days 2-3', value: analysis.actionPlan?.day2_3 },
                  { label: 'Days 4-5', value: analysis.actionPlan?.day4_5 },
                  { label: 'Days 6-7', value: analysis.actionPlan?.day6_7 },
                ].map((day, i) => (
                  <motion.div
                    key={day.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-10 bg-[#0071e3]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-[#0071e3] font-semibold text-sm">{day.label}</span>
                      </div>
                      <p className="text-white/70 pt-2">{day.value}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Help CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 p-8 bg-gradient-to-r from-[#0071e3] to-[#5856d6] rounded-3xl text-center"
          >
            <h2 className="text-xl font-bold text-white mb-2">Need Expert Help?</h2>
            <p className="text-white/80 mb-6">Our compliance team can help you implement these fixes.</p>
            <a
              href="mailto:neville@rayze.xyz?subject=[LifeØS] Compliance Help Request"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#0071e3] rounded-full font-semibold hover:bg-white/90 transition-colors"
            >
              Contact Expert
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
