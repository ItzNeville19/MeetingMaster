'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { useUser, useClerk } from '@clerk/nextjs';

// Owner email - gets lifetime Pro and DEV access
const OWNER_EMAIL = 'neville@rayze.xyz';

interface Location {
  id: string;
  name: string;
  address: string;
  createdAt: string;
}

interface DigestSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  email: string;
  lastSent?: string;
}

interface AlertSettings {
  enabled: boolean;
  email: boolean;
  riskThreshold: number;
  regulatoryChanges: boolean;
}

interface AlertHistoryItem {
  type: string;
  sentAt: string;
  subject: string;
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [activeTab, setActiveTab] = useState<'account' | 'digest' | 'alerts' | 'locations'>('account');
  const [changingTier, setChangingTier] = useState<string | null>(null);
  const [tierChanged, setTierChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sendingDigest, setSendingDigest] = useState(false);
  const [digestSent, setDigestSent] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  
  // Settings state
  const [locations, setLocations] = useState<Location[]>([]);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  
  const [digestSettings, setDigestSettings] = useState<DigestSettings>({
    enabled: false,
    frequency: 'weekly',
    email: '',
  });
  
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    enabled: false,
    email: true,
    riskThreshold: 7,
    regulatoryChanges: true,
  });

  // Check if current user is owner
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isOwner = userEmail === OWNER_EMAIL;

  // Get subscription from Clerk user metadata
  const subscription = user?.publicMetadata?.subscription as { tier?: string } | undefined;
  const tier = subscription?.tier || 'free';
  
  const hasDigest = tier === 'growth' || tier === 'pro';
  const hasAlerts = tier === 'pro';
  const hasLocations = tier === 'growth' || tier === 'pro';
  const locationLimit = tier === 'growth' ? 3 : tier === 'pro' ? Infinity : 1;

  const tierConfig: Record<string, { name: string; price: string; color: string }> = {
    free: { name: 'Free', price: '$0/month', color: 'from-[#86868b] to-[#636366]' },
    starter: { name: 'Starter', price: '$99/month', color: 'from-[#0071e3] to-[#5856d6]' },
    growth: { name: 'Growth', price: '$299/month', color: 'from-[#5856d6] to-[#af52de]' },
    pro: { name: 'Pro', price: '$799/month', color: 'from-[#ff9500] to-[#ff3b30]' },
  };

  // Load settings from Clerk metadata
  useEffect(() => {
    if (isLoaded && user) {
      const metadata = user.publicMetadata as Record<string, any>;
      const settings = metadata?.settings || {};
      if (settings.digest) setDigestSettings(settings.digest);
      if (settings.alerts) setAlertSettings(settings.alerts);
      if (settings.locations) setLocations(settings.locations);
      if (metadata.alertHistory) setAlertHistory(metadata.alertHistory);
      if (!digestSettings.email && userEmail) {
        setDigestSettings(prev => ({ ...prev, email: userEmail }));
      }
    }
  }, [isLoaded, user, userEmail]);

  const handleSetTier = useCallback(async (newTier: string) => {
    setChangingTier(newTier);
    try {
      const res = await fetch('/api/set-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier }),
      });
      if (res.ok) {
        setTierChanged(true);
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error('Failed to set tier:', error);
    } finally {
      setChangingTier(null);
    }
  }, []);

  // Auto-assign Pro to owner if not already Pro
  useEffect(() => {
    if (isLoaded && isOwner && tier !== 'pro') {
      handleSetTier('pro');
    }
  }, [isLoaded, isOwner, tier, handleSetTier]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch('/api/save-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          digest: digestSettings,
          alerts: alertSettings,
          locations,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const sendTestDigest = async () => {
    setSendingDigest(true);
    try {
      const res = await fetch('/api/send-digest', { method: 'POST' });
      const data = await res.json();
      
      if (data.email) {
        // Open email client with the digest content
        const subject = encodeURIComponent(data.email.subject);
        const body = encodeURIComponent(data.email.body);
        window.open(`mailto:${data.email.to}?subject=${subject}&body=${body}`, '_blank');
        setDigestSent(true);
        setTimeout(() => setDigestSent(false), 5000);
      }
    } catch (error) {
      console.error('Failed to send digest:', error);
      alert('Failed to send digest. Please try again.');
    } finally {
      setSendingDigest(false);
    }
  };

  const sendTestAlert = async () => {
    setSendingAlert(true);
    try {
      // Simulate a high-risk alert
      const res = await fetch('/api/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertType: 'high_risk',
          riskData: {
            fileName: 'Test Document.pdf',
            score: 8.5,
            reportId: 'test-report',
            potentialFines: 'Up to $50,000',
            risks: [
              { title: 'Missing Privacy Policy', severity: 9, description: 'Document lacks required GDPR disclosures' },
              { title: 'Outdated Compliance Terms', severity: 7, description: 'References to deprecated regulations' },
            ],
          },
        }),
      });
      const data = await res.json();
      
      if (data.email) {
        // Open email client with the alert content
        const subject = encodeURIComponent(data.email.subject);
        const body = encodeURIComponent(data.email.body);
        window.open(`mailto:${data.email.to}?subject=${subject}&body=${body}`, '_blank');
        setAlertSent(true);
        setTimeout(() => setAlertSent(false), 5000);
      }
    } catch (error) {
      console.error('Failed to send alert:', error);
      alert('Failed to send alert. Please try again.');
    } finally {
      setSendingAlert(false);
    }
  };

  const addLocation = () => {
    if (!newLocationName || !newLocationAddress) return;
    const newLocation: Location = {
      id: `loc-${Date.now()}`,
      name: newLocationName,
      address: newLocationAddress,
      createdAt: new Date().toISOString(),
    };
    setLocations([...locations, newLocation]);
    setNewLocationName('');
    setNewLocationAddress('');
    setShowAddLocation(false);
  };

  const removeLocation = (id: string) => {
    setLocations(locations.filter(l => l.id !== id));
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

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <NavBar />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-[900px] mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#0071e3] hover:text-[#0077ed] mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-[36px] font-semibold text-white mb-2">Settings</h1>
            <p className="text-[17px] text-white/60">Manage your account, notifications, and preferences</p>
          </motion.div>

          {/* Tabs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-2 mb-8">
            {[
              { id: 'account', label: 'Account' },
              { id: 'digest', label: 'Weekly Digest', locked: !hasDigest },
              { id: 'alerts', label: 'Predictive Alerts', locked: !hasAlerts },
              { id: 'locations', label: 'Locations', locked: !hasLocations },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-white text-[#1d1d1f]'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {tab.label}
                {tab.locked && (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </button>
            ))}
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <motion.div key="account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                {/* Profile */}
                <div className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8">
                  <h2 className="text-xl font-semibold text-white mb-6">Profile</h2>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#0071e3] to-[#5856d6] rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                      {user?.imageUrl ? (
                        <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user?.firstName?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-white">{user?.fullName || 'User'}</p>
                      <p className="text-white/60">{userEmail}</p>
                      <p className="text-[13px] text-white/40 mt-1">
                        Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Today'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openUserProfile()}
                    className="px-6 py-3 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>

                {/* Subscription */}
                <div className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8">
                  <h2 className="text-xl font-semibold text-white mb-6">Subscription</h2>
                  <div className={`flex items-center justify-between p-5 bg-gradient-to-r ${tierConfig[tier].color} rounded-2xl mb-6`}>
                    <div>
                      <p className="text-2xl font-bold text-white">{tierConfig[tier].name}</p>
                      <p className="text-white/70">{isOwner ? 'Lifetime Access' : tierConfig[tier].price}</p>
                    </div>
                    <span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium">
                      {isOwner ? 'Owner' : 'Active'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {tier !== 'pro' && !isOwner && (
                      <Link href="/pricing" className="px-6 py-3 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors">
                        Upgrade Plan
                      </Link>
                    )}
                  </div>
                </div>

                {/* Owner DEV Testing */}
                {isOwner && (
                  <div className="bg-gradient-to-br from-[#1d1d1f] to-[#2d2d2f] rounded-3xl border border-[#ff9500]/30 p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="px-2 py-1 bg-[#ff9500]/20 text-[#ff9500] text-xs font-bold rounded">OWNER</div>
                      <h2 className="text-xl font-semibold text-white">Test Subscription Tiers</h2>
                    </div>
                    {tierChanged && (
                      <div className="p-4 bg-[#34c759]/20 rounded-xl mb-4 flex items-center gap-3">
                        <svg className="w-5 h-5 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[#34c759]">Tier updated! Refreshing...</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {['free', 'starter', 'growth', 'pro'].map((t) => (
                        <button
                          key={t}
                          onClick={() => handleSetTier(t)}
                          disabled={tier === t || changingTier !== null}
                          className={`p-4 rounded-xl text-left transition-all ${
                            tier === t ? `bg-gradient-to-r ${tierConfig[t].color} text-white` : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                          } ${changingTier === t ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{tierConfig[t].name}</p>
                              <p className="text-sm opacity-70">{tierConfig[t].price}</p>
                            </div>
                            {tier === t && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sign Out */}
                <div className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8">
                  <h2 className="text-xl font-semibold text-white mb-4">Session</h2>
                  <button
                    onClick={() => signOut({ redirectUrl: '/' })}
                    className="px-6 py-3 bg-[#ff3b30]/20 text-[#ff3b30] rounded-full font-medium hover:bg-[#ff3b30]/30 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}

            {/* Weekly Digest Tab */}
            {activeTab === 'digest' && (
              <motion.div key="digest" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {!hasDigest ? (
                  <div className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-12 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Weekly Compliance Digest</h2>
                    <p className="text-white/60 mb-8">Get automated weekly summaries of your compliance status. Upgrade to Growth or Pro to unlock.</p>
                    <Link href="/pricing" className="px-8 py-4 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors inline-block">
                      Upgrade to Unlock
                    </Link>
                  </div>
                ) : (
                  <div className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-white">Weekly Compliance Digest</h2>
                        <p className="text-white/50 text-sm mt-1">
                          {digestSettings.lastSent 
                            ? `Last sent: ${new Date(digestSettings.lastSent).toLocaleDateString()}`
                            : 'Never sent'}
                        </p>
                      </div>
                      <button
                        onClick={sendTestDigest}
                        disabled={sendingDigest || !digestSettings.enabled}
                        className="px-5 py-2.5 bg-[#34c759] text-white rounded-full font-medium hover:bg-[#30d158] transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {sendingDigest ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Sending...
                          </>
                        ) : digestSent ? (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Sent!
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Send Now
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-white/60 mb-8">Receive automated summaries of your compliance status, new risks, and recommended actions.</p>
                    
                    <div className="space-y-6">
                      <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div>
                          <p className="text-white font-medium">Enable Digest</p>
                          <p className="text-white/50 text-sm">Receive regular compliance summaries</p>
                        </div>
                        <button
                          onClick={() => setDigestSettings({ ...digestSettings, enabled: !digestSettings.enabled })}
                          className={`w-14 h-8 rounded-full transition-colors ${digestSettings.enabled ? 'bg-[#34c759]' : 'bg-white/20'}`}
                        >
                          <div className={`w-6 h-6 bg-white rounded-full transition-transform ${digestSettings.enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                      </label>

                      <div className="p-4 bg-white/5 rounded-xl">
                        <label className="block text-white font-medium mb-2">Frequency</label>
                        <select
                          value={digestSettings.frequency}
                          onChange={(e) => setDigestSettings({ ...digestSettings, frequency: e.target.value as any })}
                          disabled={!digestSettings.enabled}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white disabled:opacity-50"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly (Recommended)</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <div className="p-4 bg-white/5 rounded-xl">
                        <label className="block text-white font-medium mb-2">Send To</label>
                        <input
                          type="email"
                          value={digestSettings.email}
                          onChange={(e) => setDigestSettings({ ...digestSettings, email: e.target.value })}
                          disabled={!digestSettings.enabled}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white disabled:opacity-50"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <button
                      onClick={saveSettings}
                      disabled={saving}
                      className="mt-8 px-8 py-4 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Predictive Alerts Tab */}
            {activeTab === 'alerts' && (
              <motion.div key="alerts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {!hasAlerts ? (
                  <div className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-12 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Predictive Risk Alerts</h2>
                    <p className="text-white/60 mb-8">Get AI-powered alerts about potential risks before they become violations. Available on the Pro plan.</p>
                    <Link href="/pricing" className="px-8 py-4 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors inline-block">
                      Upgrade to Pro
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-semibold text-white">Predictive Risk Alerts</h2>
                          <p className="text-white/50 text-sm mt-1">AI-powered compliance monitoring</p>
                        </div>
                        <button
                          onClick={sendTestAlert}
                          disabled={sendingAlert || !alertSettings.enabled}
                          className="px-5 py-2.5 bg-[#ff9500] text-white rounded-full font-medium hover:bg-[#ff9f0a] transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {sendingAlert ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Sending...
                            </>
                          ) : alertSent ? (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              Sent!
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                              Test Alert
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-white/60 mb-8">Our AI monitors regulatory changes and alerts you when documents need attention.</p>
                      
                      <div className="space-y-6">
                        <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                          <div>
                            <p className="text-white font-medium">Enable Alerts</p>
                            <p className="text-white/50 text-sm">Receive predictive compliance alerts</p>
                          </div>
                          <button
                            onClick={() => setAlertSettings({ ...alertSettings, enabled: !alertSettings.enabled })}
                            className={`w-14 h-8 rounded-full transition-colors ${alertSettings.enabled ? 'bg-[#34c759]' : 'bg-white/20'}`}
                          >
                            <div className={`w-6 h-6 bg-white rounded-full transition-transform ${alertSettings.enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                          </button>
                        </label>

                        <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                          <div>
                            <p className="text-white font-medium">Email Notifications</p>
                            <p className="text-white/50 text-sm">Receive alerts via email</p>
                          </div>
                          <button
                            onClick={() => setAlertSettings({ ...alertSettings, email: !alertSettings.email })}
                            disabled={!alertSettings.enabled}
                            className={`w-14 h-8 rounded-full transition-colors ${alertSettings.email && alertSettings.enabled ? 'bg-[#34c759]' : 'bg-white/20'} disabled:opacity-50`}
                          >
                            <div className={`w-6 h-6 bg-white rounded-full transition-transform ${alertSettings.email && alertSettings.enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                          </button>
                        </label>

                        <div className="p-4 bg-white/5 rounded-xl">
                          <label className="block text-white font-medium mb-2">Risk Threshold</label>
                          <p className="text-white/50 text-sm mb-4">Alert me when risks are rated at or above:</p>
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={alertSettings.riskThreshold}
                              onChange={(e) => setAlertSettings({ ...alertSettings, riskThreshold: parseInt(e.target.value) })}
                              disabled={!alertSettings.enabled}
                              className="flex-1 accent-[#0071e3]"
                            />
                            <span className={`w-16 text-center font-bold px-3 py-1 rounded-lg ${
                              alertSettings.riskThreshold >= 8 ? 'bg-[#ff3b30]/20 text-[#ff3b30]' :
                              alertSettings.riskThreshold >= 6 ? 'bg-[#ff9500]/20 text-[#ff9500]' :
                              'bg-[#34c759]/20 text-[#34c759]'
                            }`}>
                              {alertSettings.riskThreshold}/10
                            </span>
                          </div>
                        </div>

                        <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                          <div>
                            <p className="text-white font-medium">Regulatory Changes</p>
                            <p className="text-white/50 text-sm">Alert on new or updated regulations</p>
                          </div>
                          <button
                            onClick={() => setAlertSettings({ ...alertSettings, regulatoryChanges: !alertSettings.regulatoryChanges })}
                            disabled={!alertSettings.enabled}
                            className={`w-14 h-8 rounded-full transition-colors ${alertSettings.regulatoryChanges && alertSettings.enabled ? 'bg-[#34c759]' : 'bg-white/20'} disabled:opacity-50`}
                          >
                            <div className={`w-6 h-6 bg-white rounded-full transition-transform ${alertSettings.regulatoryChanges && alertSettings.enabled ? 'translate-x-7' : 'translate-x-1'}`} />
                          </button>
                        </label>
                      </div>

                      <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="mt-8 px-8 py-4 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
                      </button>
                    </div>

                    {/* Alert History */}
                    {alertHistory.length > 0 && (
                      <div className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8">
                        <h3 className="text-lg font-semibold text-white mb-4">Recent Alerts</h3>
                        <div className="space-y-3">
                          {alertHistory.slice(0, 5).map((alert, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                alert.type === 'high_risk' ? 'bg-[#ff3b30]/20' : 'bg-[#0071e3]/20'
                              }`}>
                                <svg className={`w-5 h-5 ${alert.type === 'high_risk' ? 'text-[#ff3b30]' : 'text-[#0071e3]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm truncate">{alert.subject}</p>
                                <p className="text-white/40 text-xs">{new Date(alert.sentAt).toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Locations Tab */}
            {activeTab === 'locations' && (
              <motion.div key="locations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {!hasLocations ? (
                  <div className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-12 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Multi-Location Support</h2>
                    <p className="text-white/60 mb-4">
                      Track compliance separately for each business location. Perfect for businesses with multiple offices, stores, or facilities.
                    </p>
                    <p className="text-white/50 text-sm mb-8">
                      Each location can have its own compliance reports, risk assessments, and action plans. Compare compliance across locations and identify patterns.
                    </p>
                    <Link href="/pricing" className="px-8 py-4 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors inline-block">
                      Upgrade to Unlock
                    </Link>
                  </div>
                ) : (
                  <div className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-semibold text-white">Business Locations</h2>
                        <p className="text-white/50 text-sm">
                          {locations.length}/{locationLimit === Infinity ? '∞' : locationLimit} locations
                        </p>
                      </div>
                      <p className="text-white/50 text-sm">
                        Manage multiple business locations. Each location can have separate compliance tracking and reports.
                      </p>
                    </div>
                    <div className="flex items-center justify-between mb-6">
                      <div></div>
                      {(locationLimit === Infinity || locations.length < locationLimit) && (
                        <button
                          onClick={() => setShowAddLocation(true)}
                          className="px-5 py-2.5 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Add Location
                        </button>
                      )}
                    </div>

                    {locations.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <p className="text-white/50">No locations added yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {locations.map((location) => (
                          <div key={location.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-[#0071e3]/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-white font-medium">{location.name}</p>
                                <p className="text-white/50 text-sm">{location.address}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeLocation(location.id)}
                              className="p-2 text-white/40 hover:text-[#ff3b30] transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={saveSettings}
                      disabled={saving}
                      className="mt-8 px-8 py-4 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Locations'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Add Location Modal */}
      <AnimatePresence>
        {showAddLocation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddLocation(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#1d1d1f] rounded-3xl p-8 w-full max-w-md border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-semibold text-white mb-6">Add Location</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Location Name</label>
                  <input
                    type="text"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder="e.g., Headquarters"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Address</label>
                  <input
                    type="text"
                    value={newLocationAddress}
                    onChange={(e) => setNewLocationAddress(e.target.value)}
                    placeholder="e.g., 123 Main St, City, State"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddLocation(false)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-full font-medium hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={addLocation}
                  disabled={!newLocationName || !newLocationAddress}
                  className="flex-1 py-3 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] disabled:opacity-50"
                >
                  Add Location
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
