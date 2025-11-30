'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { useUser } from '@clerk/nextjs';

export default function SupportPage() {
  const { user, isLoaded } = useUser();

  const subscription = user?.publicMetadata?.subscription as { 
    tier?: string; 
    isOwner?: boolean; 
    isDev?: boolean;
  } | undefined;
  const tier = subscription?.tier || 'free';
  const isOwner = subscription?.isOwner || subscription?.isDev;
  const has24_7 = isOwner || tier === 'pro';

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

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <NavBar />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-[800px] mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#0071e3] hover:text-[#0077ed] mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-[36px] font-semibold text-white mb-2">Support</h1>
            <p className="text-[17px] text-white/60">Get help when you need it</p>
          </motion.div>

          {/* Support Options */}
          <div className="space-y-4">
            {/* 24/7 Support (Pro) */}
            {has24_7 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-[#1d1d1f] to-[#2d2d2f] rounded-3xl border border-[#0071e3]/30 p-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#0071e3]/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">24/7 Priority Support</h2>
                    <p className="text-white/60 text-sm">Available around the clock</p>
                  </div>
                </div>
                <p className="text-white/80 mb-6">Get immediate assistance for critical compliance issues, any time of day or night.</p>
                <a
                  href="mailto:neville@rayze.xyz?subject=[LifeØS 24/7] Urgent Support Request&body=Priority: [High/Critical]%0D%0A%0D%0AIssue Description:%0D%0A%0D%0A%0D%0AExpected Response Time: Immediate"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full font-semibold transition-colors"
                >
                  Contact 24/7 Support
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                </a>
              </motion.div>
            )}

            {/* Priority Support (Growth) */}
            {(tier === 'growth' || tier === 'pro' || isOwner) && !has24_7 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#ff9500]/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#ff9500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Priority Support</h2>
                    <p className="text-white/60 text-sm">Response within 4 hours</p>
                  </div>
                </div>
                <p className="text-white/80 mb-6">Skip the queue with priority support. Get responses within 4 hours during business hours.</p>
                <a
                  href="mailto:neville@rayze.xyz?subject=[LifeØS Priority] Support Request&body=Issue Description:%0D%0A%0D%0A%0D%0AExpected Response Time: 4 hours"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff9500] hover:bg-[#ffad33] text-white rounded-full font-semibold transition-colors"
                >
                  Contact Priority Support
                </a>
              </motion.div>
            )}

            {/* Email Support (All) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Email Support</h2>
                  <p className="text-white/60 text-sm">Available to all users</p>
                </div>
              </div>
              <p className="text-white/80 mb-6">Get help via email. Our team typically responds within 24 hours.</p>
              <a
                href="mailto:neville@rayze.xyz?subject=[LifeØS] Support Request&body=Issue Description:%0D%0A%0D%0A%0D%0AExpected Response Time: 24 hours"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold transition-colors"
              >
                Contact Email Support
              </a>
            </motion.div>

            {/* Chat Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#34c759]/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337L5 20l1.318-3.975A9.72 9.72 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Chat with JC</h2>
                  <p className="text-white/60 text-sm">AI compliance assistant</p>
                </div>
              </div>
              <p className="text-white/80 mb-6">Get instant answers from JC, our AI compliance assistant. Available 24/7 for questions about your reports, risks, and regulations.</p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#34c759] hover:bg-[#30d158] text-white rounded-full font-semibold transition-colors"
              >
                Chat with JC
              </Link>
            </motion.div>
          </div>

          {/* FAQ Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center"
          >
            <p className="text-white/60 mb-4">Have a general question?</p>
            <Link href="/pricing" className="text-[#0071e3] hover:underline">
              View our FAQ →
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
