'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { useUser } from '@clerk/nextjs';

export default function APIKeysPage() {
  const { user, isLoaded } = useUser();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const subscription = user?.publicMetadata?.subscription as { tier?: string } | undefined;
  const tier = subscription?.tier || 'free';
  const hasAccess = tier === 'pro';

  // Load existing API key
  useEffect(() => {
    if (isLoaded && hasAccess) {
      fetch('/api/api-keys')
        .then(res => res.json())
        .then(data => {
          if (data.apiKey?.key) {
            setApiKey(data.apiKey.key);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isLoaded, hasAccess]);

  const generateApiKey = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/api-keys', { method: 'POST' });
      const data = await res.json();
      if (data.apiKey) {
        setApiKey(data.apiKey);
        setShowKey(true);
      }
    } catch (error) {
      console.error('Failed to generate API key:', error);
    } finally {
      setGenerating(false);
    }
  };

  const revokeApiKey = async () => {
    try {
      await fetch('/api/api-keys', { method: 'DELETE' });
      setApiKey(null);
      setShowKey(false);
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  };

  const copyToClipboard = async () => {
    if (apiKey) {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
            <p className="text-white/60 mb-8">API Access is available on the Pro plan. Upgrade to integrate LifeØS into your workflows.</p>
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
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#0071e3] hover:text-[#0077ed] mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-[36px] font-semibold text-white mb-2">API Access</h1>
            <p className="text-[17px] text-white/60">
              Integrate LifeØS compliance analysis directly into your applications.
            </p>
          </motion.div>

          {/* API Key Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8 mb-6"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Your API Key</h2>
            
            {!apiKey ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#0071e3]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                </div>
                <p className="text-white/60 mb-6">Generate an API key to start making requests to the LifeØS API.</p>
                <button
                  onClick={generateApiKey}
                  disabled={generating}
                  className="px-8 py-4 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors disabled:opacity-50"
                >
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    'Generate API Key'
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 p-4 bg-[#0d0d12] rounded-xl mb-4 font-mono">
                  <span className="flex-1 text-white/80 overflow-x-auto text-sm">
                    {showKey ? apiKey : '•'.repeat(40)}
                  </span>
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      {showKey ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      )}
                    </svg>
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <svg className="w-5 h-5 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white/40 text-sm">Keep this key secret. Don&apos;t commit it to public repositories.</p>
                  <button
                    onClick={revokeApiKey}
                    className="text-[#ff3b30] text-sm hover:underline"
                  >
                    Revoke Key
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Quick Start */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8 mb-6"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Quick Start</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-[#0d0d12] rounded-xl font-mono text-sm overflow-x-auto">
                <div className="text-[#34c759]"># Analyze a document</div>
                <div className="text-white/80">curl -X POST https://api.lifeos.app/v1/analyze \</div>
                <div className="text-white/80 ml-4">-H &quot;Authorization: Bearer YOUR_API_KEY&quot; \</div>
                <div className="text-white/80 ml-4">-F &quot;file=@document.pdf&quot;</div>
              </div>

              <div className="p-4 bg-[#0d0d12] rounded-xl font-mono text-sm overflow-x-auto">
                <div className="text-[#34c759]"># Response</div>
                <div className="text-white/60">{'{'}</div>
                <div className="text-white/80 ml-4">&quot;status&quot;: <span className="text-[#ff9500]">&quot;complete&quot;</span>,</div>
                <div className="text-white/80 ml-4">&quot;overallRiskScore&quot;: <span className="text-[#0071e3]">7.2</span>,</div>
                <div className="text-white/80 ml-4">&quot;risks&quot;: {'[...]'},</div>
                <div className="text-white/80 ml-4">&quot;actionPlan&quot;: {'{...}'}</div>
                <div className="text-white/60">{'}'}</div>
              </div>
            </div>
          </motion.div>

          {/* Rate Limits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Rate Limits</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-3xl font-bold text-white">1000</p>
                <p className="text-white/60 text-sm">Requests/hour</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-3xl font-bold text-white">50 MB</p>
                <p className="text-white/60 text-sm">Max file size</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-3xl font-bold text-white">∞</p>
                <p className="text-white/60 text-sm">Analyses/month</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
