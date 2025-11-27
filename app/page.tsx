'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

// Animated counter
function Counter({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) {
  return <span>{prefix}{end.toLocaleString()}{suffix}</span>;
}

// PDF Preview Modal
function PdfPreviewModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#e5e5ea] bg-[#f5f5f7]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#ff3b30] rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[#1d1d1f]">Compliance Report</p>
                <p className="text-xs text-[#86868b]">Employee_Handbook_2024.pdf</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#e5e5ea] hover:bg-[#d1d1d6] flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-[#1d1d1f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* PDF Preview */}
          <div className="p-8 max-h-[60vh] overflow-y-auto">
            {/* Report Header */}
            <div className="flex items-start justify-between mb-8 pb-6 border-b border-[#e5e5ea]">
              <div>
                <h1 className="text-2xl font-bold text-[#1d1d1f] mb-1">LifeØS Compliance Report</h1>
                <p className="text-sm text-[#86868b]">Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 bg-[#ff3b30] rounded-2xl flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-white">7.8</span>
                </div>
                <p className="text-xs text-[#86868b]">Risk Score</p>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-[#1d1d1f] mb-3">Executive Summary</h2>
              <p className="text-[15px] text-[#86868b] leading-relaxed">
                Analysis of your Employee Handbook identified 3 high-priority compliance risks with a combined potential exposure of $125,625. 
                Immediate attention is recommended for workplace safety and HR compliance areas.
              </p>
            </div>

            {/* Risks */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-[#1d1d1f] mb-4">Identified Risks</h2>
              <div className="space-y-4">
                {[
                  { title: 'Missing PPE Policy', severity: 9, regulation: 'OSHA 1910.132', fine: '$15,625', category: 'Workplace Safety' },
                  { title: 'Incomplete Harassment Training', severity: 8, regulation: 'EEOC Guidelines', fine: '$50,000', category: 'HR Compliance' },
                  { title: 'Overtime Classification Error', severity: 7, regulation: 'FLSA 29 USC § 213', fine: '$10,000', category: 'Labor Law' },
                ].map((risk, i) => (
                  <div key={i} className="p-4 bg-[#f5f5f7] rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#86868b] px-2 py-1 bg-white rounded">{risk.category}</span>
                        <span className="font-medium text-[#1d1d1f]">{risk.title}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        risk.severity >= 8 ? 'bg-[#ff3b30]/10 text-[#ff3b30]' : 'bg-[#ff9500]/10 text-[#ff9500]'
                      }`}>
                        {risk.severity}/10
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#86868b]">
                      <span>{risk.regulation}</span>
                      <span className="text-[#ff3b30]">Fine: {risk.fine}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 7-Day Action Plan */}
            <div>
              <h2 className="text-lg font-semibold text-[#1d1d1f] mb-4">7-Day Action Plan</h2>
              <div className="space-y-3">
                {[
                  { day: 'Day 1', action: 'Review findings with management team and prioritize risks' },
                  { day: 'Days 2-3', action: 'Draft updated PPE policy and harassment training schedule' },
                  { day: 'Days 4-5', action: 'Reclassify exempt positions and update payroll systems' },
                  { day: 'Days 6-7', action: 'Implement changes and document compliance updates' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-3 bg-[#f5f5f7] rounded-xl">
                    <span className="text-sm font-semibold text-[#0071e3] min-w-[70px]">{item.day}</span>
                    <span className="text-sm text-[#1d1d1f]">{item.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-5 border-t border-[#e5e5ea] bg-[#f5f5f7]">
            <p className="text-xs text-[#86868b]">This is a demo preview. Sign up to analyze your documents.</p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-[#1d1d1f] bg-white border border-[#e5e5ea] rounded-full hover:bg-[#f5f5f7] transition-colors"
              >
                Close
              </button>
              <Link
                href="/upload"
                className="px-5 py-2.5 text-sm font-medium text-white bg-[#0071e3] rounded-full hover:bg-[#0077ed] transition-colors"
              >
                Try with your document
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Full Analysis Modal
function FullAnalysisModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('risks');

  if (!isOpen) return null;

  const tabs = [
    { id: 'risks', label: 'Risks' },
    { id: 'fixes', label: 'Fixes' },
    { id: 'plan', label: 'Action Plan' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl bg-[#1d1d1f] rounded-3xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0071e3] rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white">Full Compliance Analysis</p>
                <p className="text-xs text-white/50">Employee_Handbook_2024.pdf</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Score Banner */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-[#ff3b30]/20 to-transparent border-b border-white/5">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-[#ff3b30]">7.8</p>
                <p className="text-xs text-white/50 uppercase tracking-wide">Risk Score</p>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-4xl font-bold text-white">$125,625</p>
                <p className="text-xs text-white/50 uppercase tracking-wide">Potential Exposure</p>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-4xl font-bold text-white">3</p>
                <p className="text-xs text-white/50 uppercase tracking-wide">High Risks</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-4 border-b border-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#0071e3] text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[50vh] overflow-y-auto">
            {activeTab === 'risks' && (
              <div className="space-y-4">
                {[
                  { title: 'Missing PPE Policy', severity: 9, regulation: 'OSHA 1910.132', fine: '$15,625', desc: 'Your employee handbook lacks comprehensive Personal Protective Equipment (PPE) requirements as mandated by OSHA standards.', category: 'Workplace Safety' },
                  { title: 'Incomplete Harassment Training', severity: 8, regulation: 'EEOC Guidelines', fine: '$50,000', desc: 'Documentation shows inconsistent harassment prevention training. EEOC requires documented quarterly training for all employees.', category: 'HR Compliance' },
                  { title: 'Overtime Classification Error', severity: 7, regulation: 'FLSA 29 USC § 213', fine: '$10,000', desc: '3 positions are incorrectly classified as exempt. This could result in back-pay claims and FLSA penalties.', category: 'Labor Law' },
                ].map((risk, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 bg-white/5 rounded-2xl border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs text-white/40 px-2 py-1 bg-white/5 rounded mr-2">{risk.category}</span>
                        <span className="font-semibold text-white">{risk.title}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        risk.severity >= 8 ? 'bg-[#ff3b30]/20 text-[#ff6961]' : 'bg-[#ff9500]/20 text-[#ffb340]'
                      }`}>
                        {risk.severity}/10
                      </span>
                    </div>
                    <p className="text-sm text-white/60 mb-3">{risk.desc}</p>
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      <span>{risk.regulation}</span>
                      <span className="text-[#ff3b30]">Potential Fine: {risk.fine}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'fixes' && (
              <div className="space-y-4">
                {[
                  { title: 'Update PPE Policy', steps: ['Review OSHA 1910.132 requirements', 'Draft comprehensive PPE section', 'Add to Section 4.2 of safety manual', 'Train supervisors on enforcement'] },
                  { title: 'Implement Harassment Training', steps: ['Schedule quarterly training sessions', 'Document attendance for all employees', 'Create sign-off acknowledgment forms', 'Assign HR point of contact'] },
                  { title: 'Reclassify Exempt Positions', steps: ['Audit all exempt classifications', 'Identify the 3 misclassified positions', 'Update payroll system', 'Calculate any back-pay owed'] },
                ].map((fix, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 bg-white/5 rounded-2xl border border-white/10"
                  >
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 bg-[#0071e3] rounded-full text-xs flex items-center justify-center">{i + 1}</span>
                      {fix.title}
                    </h3>
                    <div className="space-y-2">
                      {fix.steps.map((step, j) => (
                        <div key={j} className="flex items-center gap-3 text-sm text-white/60">
                          <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-xs">{j + 1}</span>
                          {step}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'plan' && (
              <div className="space-y-4">
                {[
                  { day: 'Day 1', title: 'Executive Review', tasks: ['Present findings to leadership', 'Assign responsibility for each risk', 'Allocate budget for compliance updates'] },
                  { day: 'Days 2-3', title: 'Documentation', tasks: ['Draft updated policies', 'Create training schedule', 'Prepare payroll reclassification'] },
                  { day: 'Days 4-5', title: 'Implementation', tasks: ['Update employee handbook', 'Configure training system', 'Process payroll changes'] },
                  { day: 'Days 6-7', title: 'Verification', tasks: ['Audit all changes', 'Document compliance updates', 'Schedule follow-up review'] },
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 bg-white/5 rounded-2xl border border-white/10"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span className="px-3 py-1 bg-[#0071e3]/20 text-[#0071e3] rounded-full text-sm font-semibold">{item.day}</span>
                      <h3 className="font-semibold text-white">{item.title}</h3>
                    </div>
                    <div className="space-y-2">
                      {item.tasks.map((task, j) => (
                        <div key={j} className="flex items-center gap-3 text-sm text-white/60">
                          <svg className="w-4 h-4 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {task}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-5 border-t border-white/10">
            <p className="text-xs text-white/40">This is a demo preview. Sign up to analyze your documents.</p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-white bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                Close
              </button>
              <Link
                href="/upload"
                className="px-5 py-2.5 text-sm font-medium text-white bg-[#0071e3] rounded-full hover:bg-[#0077ed] transition-colors"
              >
                Analyze your document
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Live analysis demo with continuous scanning
function LiveAnalysisDemo() {
  const [activeRisk, setActiveRisk] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const risks = [
    { title: 'Missing PPE Policy', severity: 9, regulation: 'OSHA 1910.132', fine: '$15,625', fix: 'Add comprehensive PPE requirements to safety manual Section 4.2', category: 'Workplace Safety' },
    { title: 'Incomplete Harassment Training', severity: 8, regulation: 'EEOC Guidelines', fine: '$50,000', fix: 'Implement quarterly harassment prevention training with documentation', category: 'HR Compliance' },
    { title: 'Overtime Classification Error', severity: 7, regulation: 'FLSA 29 USC § 213', fine: '$10,000', fix: 'Reclassify 3 positions from exempt to non-exempt status', category: 'Labor Law' },
  ];

  // Continuous scanning animation
  useEffect(() => {
    const scanInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          setAnalysisComplete(true);
          return 0;
        }
        return prev + 1;
      });
    }, 80);

    const riskInterval = setInterval(() => {
      setActiveRisk(prev => (prev + 1) % risks.length);
    }, 4000);

    return () => {
      clearInterval(scanInterval);
      clearInterval(riskInterval);
    };
  }, [risks.length]);

  return (
    <>
      <PdfPreviewModal isOpen={showPdfModal} onClose={() => setShowPdfModal(false)} />
      <FullAnalysisModal isOpen={showAnalysisModal} onClose={() => setShowAnalysisModal(false)} />

      <div className="relative">
        <div className="bg-[#1d1d1f] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
          {/* Window chrome */}
          <div className="flex items-center justify-between px-5 py-4 bg-[#2d2d2f] border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="ml-4 text-[13px] text-white/40 font-medium">LifeØS — Live Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${analysisComplete ? 'bg-[#34c759]' : 'bg-[#0071e3] animate-pulse'}`} />
              <span className="text-[11px] text-white/40">{analysisComplete ? 'Analysis Complete' : 'Analyzing...'}</span>
            </div>
          </div>
          
          {/* App content */}
          <div className="p-6 md:p-8">
            <div className="grid md:grid-cols-[1fr_1.5fr] gap-6 md:gap-8">
              {/* Left: Document with scanning effect */}
              <div className="space-y-4">
                <div className="relative aspect-[3/4] bg-white/[0.03] rounded-2xl p-5 border border-white/5 overflow-hidden">
                  {/* Continuous scanning effect */}
                  <motion.div
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#0071e3] to-transparent"
                    style={{ top: `${scanProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                  
                  {/* Document content simulation */}
                  <div className="space-y-3">
                    <div className="h-4 bg-white/20 rounded w-2/3" />
                    <div className="h-2.5 bg-white/10 rounded w-full" />
                    <div className="h-2.5 bg-white/10 rounded w-5/6" />
                    <div className="h-2.5 bg-white/10 rounded w-4/5" />
                    <div className="h-px bg-white/5 my-4" />
                    <div className="h-2.5 bg-white/10 rounded w-full" />
                    <div className="h-2.5 bg-white/10 rounded w-3/4" />
                    <div className="h-2.5 bg-white/10 rounded w-5/6" />
                    <div className="mt-6 h-2.5 bg-white/10 rounded w-2/3" />
                    <div className="h-2.5 bg-white/10 rounded w-full" />
                    <div className="h-2.5 bg-white/10 rounded w-4/5" />
                  </div>

                  {/* Highlight effect on scanned lines */}
                  <motion.div
                    className="absolute left-5 right-5 h-8 bg-[#0071e3]/10 rounded"
                    style={{ top: `${Math.max(0, scanProgress - 10)}%` }}
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white/40" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 font-medium truncate">Employee_Handbook_2024.pdf</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">2.4 MB</span>
                      <span className="text-xs text-white/40">•</span>
                      <span className="text-xs text-white/40">47 pages</span>
                      <span className="text-xs text-[#0071e3]">• {scanProgress}% scanned</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right: Analysis results */}
              <div className="space-y-5">
                {/* Score header */}
                <div className="flex items-start justify-between p-5 bg-white/[0.03] rounded-2xl border border-white/5">
                  <div>
                    <p className="text-[11px] text-white/50 uppercase tracking-wide font-medium mb-1">Overall Risk Score</p>
                    <div className="flex items-baseline gap-2">
                      <motion.span 
                        className="text-5xl font-bold text-[#ff3b30]"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        7.8
                      </motion.span>
                      <span className="text-lg text-white/40">/10</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-white/50 uppercase tracking-wide font-medium mb-1">Potential Exposure</p>
                    <p className="text-3xl font-bold text-[#ff3b30]">$125,625</p>
                  </div>
                </div>
                
                {/* Risk list */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] text-white/50 uppercase tracking-wide font-medium">Identified Risks</p>
                    <span className="text-[11px] text-white/30">{risks.length} found</span>
                  </div>
                  <div className="space-y-2">
                    {risks.map((risk, i) => (
                      <motion.div 
                        key={i}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                          i === activeRisk 
                            ? 'bg-white/10 ring-1 ring-[#0071e3]/50' 
                            : 'bg-white/[0.03] hover:bg-white/[0.06]'
                        }`}
                        onClick={() => setActiveRisk(i)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/40 px-2 py-0.5 bg-white/5 rounded">{risk.category}</span>
                            <p className="font-medium text-white text-sm">{risk.title}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            risk.severity >= 8 ? 'bg-[#ff3b30]/20 text-[#ff6961]' : 'bg-[#ff9500]/20 text-[#ffb340]'
                          }`}>
                            {risk.severity}/10
                          </span>
                        </div>
                        <AnimatePresence>
                          {i === activeRisk && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-2 border-t border-white/5 mt-2">
                                <div className="flex items-center gap-4 text-xs text-white/50 mb-2">
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {risk.regulation}
                                  </span>
                                  <span className="text-[#ff3b30]">Fine: {risk.fine}</span>
                                </div>
                                <p className="text-sm text-white/70 bg-white/5 p-3 rounded-lg">{risk.fix}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Action buttons - NOW WORK */}
                <div className="flex gap-3">
                  <motion.button 
                    onClick={() => setShowPdfModal(true)}
                    className="flex-1 py-3.5 bg-[#0071e3] text-white rounded-xl font-medium text-sm hover:bg-[#0077ed] transition-colors flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </motion.button>
                  <motion.button 
                    onClick={() => setShowAnalysisModal(true)}
                    className="flex-1 py-3.5 bg-white/10 text-white rounded-xl font-medium text-sm hover:bg-white/15 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View Full Analysis
                  </motion.button>
                </div>

                {/* Security badge */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <svg className="w-4 h-4 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-[11px] text-white/40">Your documents are encrypted and deleted after analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Hero dashboard mockup
function HeroDashboardMockup() {
  return (
    <motion.div
      className="w-full max-w-[500px] mx-auto lg:mx-0"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      <div className="rounded-3xl bg-white shadow-2xl border border-[#e5e5ea]/50 p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0071e3]/5 via-transparent to-[#5856d6]/5 pointer-events-none" />
        
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-[11px] text-[#86868b] font-medium">Dashboard — LifeØS</span>
        </div>
        
        <div className="grid grid-cols-[2fr_1fr] gap-4">
          <div className="space-y-4">
            <div className="h-28 bg-gradient-to-br from-[#f5f5f7] to-[#e8e8ed] rounded-2xl p-4 relative overflow-hidden">
              <p className="text-[10px] text-[#86868b] font-medium uppercase tracking-wide mb-2">Risk Trend</p>
              <svg className="w-full h-12" viewBox="0 0 200 50">
                <defs>
                  <linearGradient id="heroGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0071e3" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0071e3" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.path
                  d="M0,35 Q25,40 50,30 T100,25 T150,15 T200,8"
                  fill="none"
                  stroke="#0071e3"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 0.5 }}
                />
                <path d="M0,35 Q25,40 50,30 T100,25 T150,15 T200,8 L200,50 L0,50 Z" fill="url(#heroGradient)" />
              </svg>
              <motion.div 
                className="absolute bottom-3 right-3 px-2 py-1 bg-[#34c759]/10 rounded-full"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5 }}
              >
                <span className="text-[10px] font-semibold text-[#34c759]">-23% this month</span>
              </motion.div>
            </div>
            
            <div className="space-y-2">
              {['Employee Handbook', 'Safety Manual', 'HIPAA Policy'].map((name, i) => (
                <motion.div 
                  key={i} 
                  className="flex items-center gap-3 p-2.5 bg-[#f5f5f7] rounded-xl"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.15 }}
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-[#0071e3]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-[#1d1d1f] truncate">{name}</p>
                    <p className="text-[10px] text-[#86868b]">Analyzed 2d ago</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-[#ff3b30]' : i === 1 ? 'bg-[#ff9500]' : 'bg-[#34c759]'}`} />
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <motion.div 
              className="p-4 bg-[#ff3b30]/5 rounded-2xl text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-[10px] text-[#86868b] font-medium uppercase tracking-wide mb-1">Risk Score</p>
              <motion.p 
                className="text-3xl font-bold text-[#ff3b30]"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                6.2
              </motion.p>
            </motion.div>
            
            <div className="space-y-2">
              {[
                { label: 'High risks', value: '3', color: 'text-[#ff3b30]' },
                { label: 'Reports', value: '12', color: 'text-[#1d1d1f]' },
                { label: 'Fixed', value: '8', color: 'text-[#34c759]' },
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  className="flex items-center justify-between p-2.5 bg-[#f5f5f7] rounded-xl"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + i * 0.1 }}
                >
                  <span className="text-[10px] text-[#86868b]">{stat.label}</span>
                  <span className={`text-[11px] font-semibold ${stat.color}`}>{stat.value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-[#f5f5f7] via-white to-white" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full bg-[#0071e3]/[0.07] blur-[100px]"
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-[#5856d6]/[0.05] blur-[100px]"
            animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        
        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 py-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0071e3]/10 rounded-full mb-6"
              >
                <span className="w-2 h-2 bg-[#34c759] rounded-full animate-pulse" />
                <span className="text-[13px] font-medium text-[#0071e3]">Now analyzing 50+ regulations</span>
              </motion.div>

              <h1 className="text-[44px] md:text-[56px] lg:text-[64px] font-semibold text-[#1d1d1f] leading-[1.05] tracking-[-0.02em] mb-6">
                <span className="block">Compliance risks</span>
                <span className="block">found.</span>
                <span className="block bg-gradient-to-r from-[#0071e3] to-[#00c7be] bg-clip-text text-transparent">
                  Before the fines.
                </span>
              </h1>
              
              <p className="text-[18px] md:text-[20px] text-[#86868b] max-w-[480px] mb-8 leading-[1.5]">
                Upload any compliance document. Our AI analyzes it against 50+ regulations 
                and tells you exactly what to fix.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start mb-6">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Link 
                    href="/upload" 
                    className="inline-flex items-center justify-center px-7 py-4 bg-[#0071e3] text-white text-[16px] font-medium rounded-full transition-all duration-300 shadow-lg shadow-[#0071e3]/25 hover:shadow-xl hover:shadow-[#0071e3]/30"
                  >
                    Start Free Analysis
                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </motion.div>
                <Link 
                  href="#demo" 
                  className="inline-flex items-center justify-center px-5 py-4 text-[16px] text-[#0071e3] font-medium hover:text-[#0077ed] transition-colors"
                >
                  See how it works
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
              </div>
              
              <p className="text-[13px] text-[#86868b]">
                No credit card required · Results in under 5 minutes
              </p>
            </motion.div>

            <HeroDashboardMockup />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-20 bg-[#fafafa] border-y border-[#e5e5ea]">
        <div className="max-w-[1000px] mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center">
            {[
              { value: 156259, prefix: '$', suffix: '', label: 'Average OSHA fine' },
              { value: 73, prefix: '', suffix: '%', label: 'Have compliance gaps' },
              { value: 5, prefix: '', suffix: ' min', label: 'To get full results' },
              { value: 50, prefix: '', suffix: '+', label: 'Regulations covered' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <p className="text-[32px] md:text-[40px] font-semibold text-[#1d1d1f] tabular-nums mb-1">
                  <Counter end={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
                <p className="text-[14px] text-[#86868b]">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section id="demo" className="py-24 md:py-32 px-6">
        <div className="max-w-[1000px] mx-auto">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[13px] text-[#0071e3] font-semibold uppercase tracking-wide mb-3">Live Demo</p>
            <h2 className="text-[36px] md:text-[48px] font-semibold text-[#1d1d1f] mb-4">
              See what you get.
            </h2>
            <p className="text-[18px] text-[#86868b] max-w-[550px] mx-auto">
              Watch our AI analyze a real document. Click the buttons to explore the full report.
            </p>
          </motion.div>
          
          <LiveAnalysisDemo />
          
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Link 
              href="/upload" 
              className="inline-flex items-center justify-center px-8 py-4 bg-[#1d1d1f] text-white text-[16px] font-medium rounded-full hover:bg-[#333] transition-all"
            >
              Try it with your document
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="features" className="py-24 md:py-32 px-6 bg-[#f5f5f7]">
        <div className="max-w-[1000px] mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[13px] text-[#0071e3] font-semibold uppercase tracking-wide mb-3">Simple Process</p>
            <h2 className="text-[36px] md:text-[48px] font-semibold text-[#1d1d1f]">
              How it works.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload',
                desc: 'Drop any PDF, image, or scan. Employee handbooks, safety policies, permits, training records.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Analyze',
                desc: 'GPT-4o and Pal Nexus extract text and cross-reference against 50+ federal and state regulations.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Fix',
                desc: 'Get prioritized risks, potential fines, specific fixes, and a 7-day action plan to achieve compliance.',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative p-8 bg-white rounded-3xl"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-[#0071e3]/10 rounded-2xl flex items-center justify-center text-[#0071e3]">
                    {item.icon}
                  </div>
                  <span className="text-[13px] text-[#86868b] font-semibold">{item.step}</span>
                </div>
                <h3 className="text-[22px] font-semibold text-[#1d1d1f] mb-3">{item.title}</h3>
                <p className="text-[15px] text-[#86868b] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-[1000px] mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[13px] text-[#0071e3] font-semibold uppercase tracking-wide mb-3">Features</p>
            <h2 className="text-[36px] md:text-[48px] font-semibold text-[#1d1d1f] mb-4">
              Everything you need.
            </h2>
            <p className="text-[18px] text-[#86868b]">
              Complete compliance analysis in one report.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: 'Risk Assessment', desc: 'Every gap identified and ranked by severity with clear explanations.' },
              { title: 'Potential Fines', desc: 'See exactly how much each violation could cost your business.' },
              { title: 'Specific Fixes', desc: 'Step-by-step instructions to resolve each compliance issue.' },
              { title: '7-Day Action Plan', desc: 'Structured timeline to achieve full compliance fast.' },
              { title: 'PDF Reports', desc: 'Professional reports ready to share with leadership and auditors.' },
              { title: 'Policy Language', desc: 'AI-suggested wording updates for your handbook and policies.' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="p-6 bg-[#f5f5f7] rounded-2xl hover:bg-[#eee] transition-colors cursor-default"
              >
                <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-2">{item.title}</h3>
                <p className="text-[15px] text-[#86868b] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24 md:py-32 px-6 bg-[#1d1d1f] text-white">
        <div className="max-w-[800px] mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[13px] text-[#0071e3] font-semibold uppercase tracking-wide mb-3">Compare</p>
            <h2 className="text-[36px] md:text-[48px] font-semibold mb-4">
              Why LifeØS.
            </h2>
            <p className="text-[18px] text-white/60">
              Traditional audits are expensive, slow, and outdated.
            </p>
          </motion.div>

          <div className="rounded-3xl overflow-hidden border border-white/10">
            <div className="grid grid-cols-3 gap-4 p-5 bg-white/5 border-b border-white/10">
              <div />
              <p className="text-center text-[13px] font-semibold text-white/40 uppercase tracking-wide">Traditional</p>
              <p className="text-center text-[13px] font-semibold text-[#0071e3] uppercase tracking-wide">LifeØS</p>
            </div>
            
            {[
              ['Time to results', '2-4 weeks', '5 minutes'],
              ['Cost', '$5,000-25,000', 'From $99/mo'],
              ['Regulations', '1-2 focus areas', '50+'],
              ['Actionable fixes', 'General guidance', 'Specific steps'],
              ['Updates', 'Annual', 'Anytime'],
            ].map(([label, old, lifeos], i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="grid grid-cols-3 gap-4 p-5 border-b border-white/5 last:border-0"
              >
                <p className="text-white/80 font-medium">{label}</p>
                <p className="text-white/40 text-center">{old}</p>
                <p className="text-[#0071e3] text-center font-medium">{lifeos}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-6 bg-[#1d1d1f] text-white">
        <div className="max-w-[900px] mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 bg-[#34c759]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h2 className="text-[32px] md:text-[40px] font-semibold mb-4">
              Bank-level security.
            </h2>
            <p className="text-[18px] text-white/60 max-w-[500px] mx-auto">
              Your documents are encrypted in transit and at rest. We never store them after analysis.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🔐', title: 'End-to-end encryption', desc: 'AES-256 encryption for all uploads' },
              { icon: '🗑️', title: 'Auto-delete', desc: 'Documents deleted within 24 hours' },
              { icon: '🏢', title: 'SOC 2 compliant', desc: 'Enterprise-grade infrastructure' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="p-6 bg-white/5 rounded-2xl border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="text-3xl mb-4 block">{item.icon}</span>
                <h3 className="text-[17px] font-semibold mb-2">{item.title}</h3>
                <p className="text-[14px] text-white/60">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32 px-6">
        <motion.div 
          className="max-w-[700px] mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-[40px] md:text-[52px] font-semibold text-[#1d1d1f] mb-6 leading-tight">
            Find compliance gaps.<br />Before they find you.
          </h2>
          <p className="text-[18px] text-[#86868b] mb-10">
            Upload your first document free. No credit card required.
          </p>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link 
              href="/upload" 
              className="inline-flex items-center justify-center px-10 py-5 bg-[#0071e3] text-white text-[17px] font-medium rounded-full transition-all shadow-lg shadow-[#0071e3]/25 hover:shadow-xl hover:shadow-[#0071e3]/30"
            >
              Start Free Analysis
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
