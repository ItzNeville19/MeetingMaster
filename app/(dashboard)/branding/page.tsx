'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { useUser } from '@clerk/nextjs';

export default function BrandingPage() {
  const { user, isLoaded } = useUser();
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0071e3');
  const [companyName, setCompanyName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const subscription = user?.publicMetadata?.subscription as { tier?: string } | undefined;
  const tier = subscription?.tier || 'free';
  const hasAccess = tier === 'pro';

  // Load existing branding settings
  useEffect(() => {
    if (isLoaded && hasAccess) {
      fetch('/api/save-branding')
        .then(res => res.json())
        .then(data => {
          if (data.branding) {
            setCompanyName(data.branding.companyName || '');
            setLogoUrl(data.branding.logoUrl || '');
            setPrimaryColor(data.branding.primaryColor || '#0071e3');
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isLoaded, hasAccess]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/save-branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, logoUrl, primaryColor }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save branding:', error);
    } finally {
      setSaving(false);
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
            <p className="text-white/60 mb-8">Custom Branding is available on the Pro plan. Upgrade to white-label your reports.</p>
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
            <h1 className="text-[36px] font-semibold text-white mb-2">Custom Branding</h1>
            <p className="text-[17px] text-white/60">
              Customize your PDF reports with your company branding. Changes are saved and applied to all future reports.
            </p>
          </motion.div>

          {/* Branding Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8 mb-6"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Brand Settings</h2>
            
            <div className="space-y-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your Company Name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
                />
                <p className="text-white/40 text-sm mt-2">This will appear in the header of your PDF reports</p>
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Logo URL</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://yourcompany.com/logo.png"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
                />
                <p className="text-white/40 text-sm mt-2">Recommended: 200x50px, PNG or SVG with transparent background</p>
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Primary Color</label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
                  />
                </div>
                <p className="text-white/40 text-sm mt-2">Used for highlights and accents in your reports</p>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-4 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : saved ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Saved!
                  </span>
                ) : (
                  'Save Branding'
                )}
              </button>
              {saved && (
                <span className="text-[#34c759] text-sm">Your branding will be applied to all future PDF reports</span>
              )}
            </div>
          </motion.div>

          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Report Preview</h2>
            
            <div className="bg-white rounded-xl p-6 text-[#1d1d1f]">
              {/* Simulated PDF Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-8 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  ) : (
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {companyName?.charAt(0) || 'L'}
                    </div>
                  )}
                  <span className="font-semibold text-lg">{companyName || 'Your Company'}</span>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>Compliance Report</p>
                  <p>Generated by LifeØS</p>
                </div>
              </div>

              {/* Simulated Content */}
              <div className="space-y-3">
                <div className="h-6 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-5/6" />
                <div className="h-4 bg-gray-100 rounded w-4/6" />
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div 
                  className="inline-block px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  Risk Score: 6.5/10
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
