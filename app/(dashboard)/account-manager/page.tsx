'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { useUser } from '@clerk/nextjs';

export default function AccountManagerPage() {
  const { user, isLoaded } = useUser();

  const subscription = user?.publicMetadata?.subscription as { 
    tier?: string; 
    isOwner?: boolean; 
    isDev?: boolean;
  } | undefined;
  const tier = subscription?.tier || 'free';
  const isOwner = subscription?.isOwner || subscription?.isDev;
  const hasAccess = isOwner || tier === 'pro';

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
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Pro Feature</h1>
            <p className="text-white/60 mb-8">Dedicated Account Manager is available on the Pro plan. Get personalized guidance and strategic compliance support.</p>
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
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#0071e3] hover:text-[#0077ed] mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-[36px] font-semibold text-white mb-2">Your Account Manager</h1>
            <p className="text-[17px] text-white/60">Personalized compliance guidance and strategic support</p>
          </motion.div>

          {/* Account Manager Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-[#1d1d1f] to-[#2d2d2f] rounded-3xl border border-white/10 p-8 mb-8"
          >
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#0071e3] to-[#5856d6] rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                JC
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-white mb-2">Jamshed Cooper</h2>
                <p className="text-white/60 mb-4">Your Dedicated Account Manager</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#34c759] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-white/80">Strategic compliance planning and roadmap development</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#34c759] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-white/80">Quarterly compliance reviews and risk assessments</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#34c759] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-white/80">Priority support for complex compliance questions</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#34c759] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-white/80">Custom integration support and workflow optimization</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 gap-4"
          >
            <a
              href="mailto:neville@rayze.xyz?subject=[LifeØS Pro] Account Manager Request&body=Hi JC,%0D%0A%0D%0AI'd like to schedule a call to discuss my compliance strategy.%0D%0A%0D%0AThanks!"
              className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-colors"
            >
              <div className="w-12 h-12 bg-[#0071e3]/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Schedule a Call</h3>
              <p className="text-white/60 text-sm">Book a strategy session to discuss your compliance roadmap</p>
            </a>

            <a
              href="mailto:neville@rayze.xyz?subject=[LifeØS Pro] Quick Question&body=Hi JC,%0D%0A%0D%0AI have a quick question about...%0D%0A%0D%0AThanks!"
              className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-colors"
            >
              <div className="w-12 h-12 bg-[#34c759]/20 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337L5 20l1.318-3.975A9.72 9.72 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Quick Question</h3>
              <p className="text-white/60 text-sm">Send a message for quick answers and guidance</p>
            </a>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-gradient-to-br from-[#0071e3]/20 to-[#5856d6]/20 rounded-3xl border border-[#0071e3]/30 p-8"
          >
            <h3 className="text-white font-semibold mb-4">What to Expect</h3>
            <ul className="space-y-2 text-white/80 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#0071e3]">•</span>
                <span>Response within 4 hours during business hours</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0071e3]">•</span>
                <span>Quarterly strategy sessions to review your compliance posture</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0071e3]">•</span>
                <span>Proactive recommendations based on your industry and risk profile</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0071e3]">•</span>
                <span>Custom integration support for your existing workflows</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
