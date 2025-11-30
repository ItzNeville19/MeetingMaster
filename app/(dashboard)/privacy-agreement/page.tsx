'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import NavBar from '@/components/NavBar';
import { useUser } from '@clerk/nextjs';
import PrivacyAgreementModal from '@/components/PrivacyAgreementModal';

interface PrivacyAgreement {
  id: string;
  userId: string;
  userEmail: string;
  agreed: boolean;
  agreementDate: string;
  dontShowAgain: boolean;
  ipAddress?: string;
  userAgent?: string;
  agreementText: string;
  agreementVersion: string;
  createdAt: string;
}

export default function PrivacyAgreementPage() {
  const { user, isLoaded } = useUser();
  const [agreements, setAgreements] = useState<PrivacyAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      fetchAgreements();
    }
  }, [isLoaded, user]);

  const fetchAgreements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/get-privacy-agreements');
      if (res.ok) {
        const data = await res.json();
        setAgreements(data.agreements || []);
      }
    } catch (err) {
      console.error('Failed to fetch privacy agreements:', err);
    } finally {
      setLoading(false);
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
                <h1 className="text-[36px] font-semibold text-white mb-2">Privacy Policy & Terms</h1>
                <p className="text-white/50">
                  View your privacy policy agreements and legal records
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Agreement
              </button>
            </div>
          </motion.div>

          {/* Agreements List */}
          {agreements.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-12 text-center"
            >
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No agreements found</h2>
              <p className="text-white/50 mb-6">
                You haven't agreed to the privacy policy yet. You'll be prompted when you upload your first document.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors"
              >
                View Privacy Policy
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {agreements.map((agreement, i) => (
                <motion.div
                  key={agreement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-6"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full ${agreement.agreed ? 'bg-[#34c759]' : 'bg-[#ff3b30]'}`} />
                        <h3 className="text-lg font-semibold text-white">
                          {agreement.agreed ? 'Agreed' : 'Declined'}
                        </h3>
                        {agreement.dontShowAgain && (
                          <span className="px-2 py-1 bg-white/5 text-white/60 text-xs rounded-full">
                            Don't show again
                          </span>
                        )}
                      </div>
                      <p className="text-white/50 text-sm">
                        Version {agreement.agreementVersion} • {agreement.agreementText}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/90 text-sm font-medium">
                        {new Date(agreement.agreementDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-white/40 text-xs mb-1">Email</p>
                      <p className="text-white/70 text-sm">{agreement.userEmail}</p>
                    </div>
                    {/* IP Address hidden from UI for privacy, but stored in database for legal records */}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      {/* Privacy Agreement Modal */}
      {showModal && (
        <PrivacyAgreementModal
          isBlocking={false}
          onAgree={async () => {
            setShowModal(false);
            // Wait a moment for the save to complete, then refresh
            await new Promise(resolve => setTimeout(resolve, 500));
            await fetchAgreements(); // Refresh list to show new agreement
          }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

