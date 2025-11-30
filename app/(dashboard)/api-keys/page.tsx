'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { useUser } from '@clerk/nextjs';

export default function APIKeysPage() {
  const { user, isLoaded } = useUser();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const subscription = user?.publicMetadata?.subscription as { 
    tier?: string; 
    isOwner?: boolean; 
    isDev?: boolean;
  } | undefined;
  const tier = subscription?.tier || 'free';
  const isOwner = subscription?.isOwner || subscription?.isDev;
  const hasAccess = isOwner || tier === 'pro';

  useEffect(() => {
    if (isLoaded && user && hasAccess) {
      fetchAPIKey();
    }
  }, [isLoaded, user, hasAccess]);

  const fetchAPIKey = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/api-keys');
      if (res.ok) {
        const data = await res.json();
        setApiKey(data.apiKey);
          }
    } catch (err) {
      console.error('Failed to fetch API key:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAPIKey = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
      });
      if (res.ok) {
      const data = await res.json();
        setApiKey(data.apiKey);
      } else {
        alert('Failed to generate API key. Please try again.');
      }
    } catch (err) {
      console.error('Failed to generate API key:', err);
      alert('Failed to generate API key. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const deleteAPIKey = async () => {
    if (!confirm('Are you sure you want to delete your API key? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch('/api/api-keys', {
        method: 'DELETE',
      });
      if (res.ok) {
      setApiKey(null);
      } else {
        alert('Failed to delete API key. Please try again.');
      }
    } catch (err) {
      console.error('Failed to delete API key:', err);
      alert('Failed to delete API key. Please try again.');
    }
  };

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Pro Feature</h1>
            <p className="text-white/60 mb-8">API Access is available on the Pro plan. Integrate LifeØS into your existing workflows and automate compliance checks.</p>
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
            <h1 className="text-[36px] font-semibold text-white mb-2">API Access</h1>
            <p className="text-[17px] text-white/60">Integrate LifeØS into your existing workflows with our REST API</p>
          </motion.div>

          {/* API Key Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Your API Key</h2>
              {apiKey ? (
                <button
                  onClick={deleteAPIKey}
                  className="px-4 py-2 bg-[#ff3b30]/20 hover:bg-[#ff3b30]/30 text-[#ff3b30] rounded-full text-sm font-medium transition-colors"
                >
                  Delete Key
                </button>
              ) : (
                <button
                  onClick={generateAPIKey}
                  disabled={generating}
                  className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full font-medium transition-colors disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate API Key'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : apiKey ? (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <code className="flex-1 text-white font-mono text-sm break-all">{apiKey}</code>
                  <button
                    onClick={copyToClipboard}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-colors flex-shrink-0"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                  </button>
                  </div>
                </div>
                <div className="bg-[#ff9500]/10 border border-[#ff9500]/20 rounded-xl p-4">
                  <p className="text-[#ff9500] text-sm font-medium mb-1">⚠️ Keep your API key secure</p>
                  <p className="text-white/60 text-xs">Never share your API key publicly. If compromised, delete it immediately and generate a new one.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                </div>
                <p className="text-white/60 mb-6">Generate an API key to start integrating LifeØS into your systems</p>
                <button
                  onClick={generateAPIKey}
                  disabled={generating}
                  className="px-8 py-4 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full font-semibold transition-colors disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate API Key'}
                </button>
              </div>
            )}
          </motion.div>

          {/* API Documentation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8"
          >
            <h2 className="text-xl font-semibold text-white mb-6">API Documentation</h2>
            
            <div className="space-y-6">
              {/* Analyze Document */}
              <div>
                <h3 className="text-white font-semibold mb-2">Analyze Document</h3>
                <div className="bg-white/5 rounded-xl p-4 font-mono text-sm">
                  <div className="text-white/60 mb-2">POST /api/analyze</div>
                  <div className="text-white/40 text-xs mb-3">Upload and analyze a compliance document</div>
                  <div className="text-white/80">
                    <div className="mb-1">Headers:</div>
                    <div className="ml-4 text-white/60">Authorization: Bearer {'{your-api-key}'}</div>
                    <div className="ml-4 text-white/60">Content-Type: application/json</div>
                    <div className="mt-3 mb-1">Body:</div>
                    <div className="ml-4 text-white/60">{'{'}</div>
                    <div className="ml-8 text-white/60">"fileUrl": "https://...",</div>
                    <div className="ml-8 text-white/60">"fileName": "document.pdf"</div>
                    <div className="ml-4 text-white/60">{'}'}</div>
                  </div>
                </div>
              </div>

              {/* Get Reports */}
              <div>
                <h3 className="text-white font-semibold mb-2">Get Reports</h3>
                <div className="bg-white/5 rounded-xl p-4 font-mono text-sm">
                  <div className="text-white/60 mb-2">GET /api/get-reports</div>
                  <div className="text-white/40 text-xs mb-3">Retrieve all compliance reports</div>
                  <div className="text-white/80">
                    <div className="mb-1">Headers:</div>
                    <div className="ml-4 text-white/60">Authorization: Bearer {'{your-api-key}'}</div>
              </div>
            </div>
              </div>

              {/* Get Report */}
              <div>
                <h3 className="text-white font-semibold mb-2">Get Single Report</h3>
                <div className="bg-white/5 rounded-xl p-4 font-mono text-sm">
                  <div className="text-white/60 mb-2">GET /api/report/{'{reportId}'}</div>
                  <div className="text-white/40 text-xs mb-3">Retrieve a specific compliance report</div>
                  <div className="text-white/80">
                    <div className="mb-1">Headers:</div>
                    <div className="ml-4 text-white/60">Authorization: Bearer {'{your-api-key}'}</div>
                  </div>
              </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-[#0071e3]/10 border border-[#0071e3]/20 rounded-xl">
              <p className="text-[#0071e3] text-sm font-medium mb-1">📚 Full API Documentation</p>
              <p className="text-white/60 text-xs">For complete API documentation, rate limits, and examples, contact support at neville@rayze.xyz</p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
