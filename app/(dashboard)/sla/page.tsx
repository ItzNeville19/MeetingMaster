'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { useUser } from '@clerk/nextjs';

export default function SLAPage() {
  const { user, isLoaded } = useUser();

  const subscription = user?.publicMetadata?.subscription as { tier?: string } | undefined;
  const tier = subscription?.tier || 'free';
  const hasAccess = tier === 'pro';

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
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Pro Feature</h1>
            <p className="text-white/60 mb-8">SLA Guarantee is available on the Pro plan. Upgrade to get enterprise-grade reliability.</p>
            <Link href="/pricing" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors">
              Upgrade to Pro
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
        <div className="max-w-[800px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <Link href="/benefits" className="inline-flex items-center gap-2 text-[#0071e3] hover:text-[#0077ed] mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Benefits
            </Link>
            <h1 className="text-[36px] font-semibold text-white mb-2">SLA Guarantee</h1>
            <p className="text-[17px] text-white/60">
              Enterprise-grade uptime commitment with service credits.
            </p>
          </motion.div>

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-[#34c759] to-[#30d158] rounded-3xl p-8 mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm mb-1">Current Status</p>
                <p className="text-3xl font-bold text-white">All Systems Operational</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Uptime Guarantee */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8 mb-6"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Uptime Guarantee</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <p className="text-5xl font-bold text-[#0071e3] mb-2">99.9%</p>
                <p className="text-white/60">Monthly Uptime Target</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-[#34c759] mb-2">99.98%</p>
                <p className="text-white/60">Current Month</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-white mb-2">43m</p>
                <p className="text-white/60">Max Allowed Downtime/Month</p>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80">Uptime this month</span>
                <span className="text-[#34c759] font-semibold">99.98%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#34c759]" style={{ width: '99.98%' }} />
              </div>
            </div>
          </motion.div>

          {/* Service Credits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8 mb-6"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Service Credit Schedule</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <p className="text-white font-medium">99.9% - 99.0%</p>
                  <p className="text-white/50 text-sm">Monthly uptime</p>
                </div>
                <p className="text-[#ff9500] font-semibold">10% credit</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <p className="text-white font-medium">99.0% - 95.0%</p>
                  <p className="text-white/50 text-sm">Monthly uptime</p>
                </div>
                <p className="text-[#ff9500] font-semibold">25% credit</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <p className="text-white font-medium">Below 95.0%</p>
                  <p className="text-white/50 text-sm">Monthly uptime</p>
                </div>
                <p className="text-[#ff3b30] font-semibold">50% credit</p>
              </div>
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Report an Issue</h2>
            <p className="text-white/60 mb-6">
              As a Pro member, you have access to 24/7 priority support. Report any service issues immediately.
            </p>
            <a
              href="mailto:neville@rayze.xyz?subject=[LifeØS Pro - URGENT] Service Issue"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff3b30] text-white rounded-full font-medium hover:bg-[#ff453a] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              Report Service Issue
            </a>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

