'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { useUser } from '@clerk/nextjs';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending';
  avatar?: string;
  joinedAt?: string;
  lastActive?: string;
  reportsCount?: number;
}

export default function TeamPage() {
  const { user, isLoaded } = useUser();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [activeTab, setActiveTab] = useState<'members' | 'activity' | 'settings'>('members');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Get subscription from Clerk user metadata
  const subscription = user?.publicMetadata?.subscription as {
    tier?: string;
    isOwner?: boolean; 
    isDev?: boolean;
  } | undefined;
  const teamData = user?.publicMetadata?.team as {
    members?: TeamMember[];
    pendingInvites?: string[];
  } | undefined;

  const tier = subscription?.tier || 'free';
  const isOwner = subscription?.isOwner || subscription?.isDev;

  const teamLimits: Record<string, number> = {
    free: 1,
    starter: 1,
    growth: 5,
    pro: Infinity,
  };

  const maxMembers = isOwner ? Infinity : (teamLimits[tier] || 1);
  const canInvite = isOwner || tier === 'growth' || tier === 'pro';

  // Load team data
  useEffect(() => {
    if (isLoaded && user) {
      // Initialize with current user as admin
      const currentUser: TeamMember = {
        id: user.id,
        name: user.fullName || 'You',
        email: user.primaryEmailAddress?.emailAddress || '',
        role: 'admin',
        status: 'active',
        avatar: user.imageUrl,
        joinedAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
        lastActive: new Date().toISOString(),
        reportsCount: 0,
      };
      
      // Get stored team members
      const storedMembers = teamData?.members || [];
      setTeamMembers([currentUser, ...storedMembers.filter(m => m.id !== user.id)]);
      setLoading(false);
    }
  }, [isLoaded, user, teamData]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail) return;

    // Add pending member to team
    const newMember: TeamMember = {
      id: `pending-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'pending',
      joinedAt: new Date().toISOString(),
    };

    // Save to Clerk metadata
    try {
      await fetch('/api/save-team-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member: newMember }),
      });
      
      setTeamMembers(prev => [...prev, newMember]);
    } catch (error) {
      console.error('Failed to save team member:', error);
    }

    // Open email client to send actual invite
    const subject = encodeURIComponent(`You're invited to join ${user?.firstName || 'the team'}'s LifeØS workspace`);
    const body = encodeURIComponent(
`Hi there,

${user?.firstName || 'Your colleague'} has invited you to join their team on LifeØS - the AI compliance platform.

Your role: ${inviteRole.charAt(0).toUpperCase() + inviteRole.slice(1)}

Click here to get started: ${window.location.origin}

LifeØS helps teams stay compliant with AI-powered document analysis. Upload any compliance document and get instant risk assessments, actionable fixes, and downloadable reports.

Looking forward to collaborating with you!

Best,
The LifeØS Team`
    );

    window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
    
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteRole('editor');
  };

  const handleRemoveMember = async (memberId: string) => {
    if (memberId === user?.id) return; // Can't remove yourself
    
    try {
      await fetch('/api/remove-team-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });
      
      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (error) {
      console.error('Failed to remove team member:', error);
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

  const activeMembers = teamMembers.filter(m => m.status === 'active');
  const pendingMembers = teamMembers.filter(m => m.status === 'pending');

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
                <h1 className="text-[36px] font-semibold text-white mb-2">Team Dashboard</h1>
                <p className="text-[17px] text-white/60">
                  Manage your team and collaborate on compliance
                </p>
              </div>
              {canInvite && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Invite Member
                </button>
              )}
            </div>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {[
              { label: 'Team Members', value: activeMembers.length, color: 'text-white' },
              { label: 'Pending Invites', value: pendingMembers.length, color: 'text-[#ff9500]' },
              { label: 'Plan Limit', value: maxMembers === Infinity ? '∞' : maxMembers, color: 'text-[#0071e3]' },
              { label: 'Total Reports', value: activeMembers.reduce((sum, m) => sum + (m.reportsCount || 0), 0), color: 'text-[#34c759]' },
            ].map((stat, i) => (
              <div key={i} className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-5">
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-white/50 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex gap-2 mb-6"
          >
            {(['members', 'activity', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-[#1d1d1f]'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'members' && (
              <motion.div
                key="members"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#1d1d1f] rounded-3xl border border-white/10 overflow-hidden"
              >
                <div className="p-6 border-b border-white/5">
                  <h2 className="text-xl font-semibold text-white">Team Members</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {teamMembers.map((member, i) => (
                    <div key={member.id} className="flex items-center gap-4 p-5 hover:bg-white/5 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center text-white font-semibold overflow-hidden">
                        {member.avatar ? (
                          <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          member.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium truncate">{member.name}</p>
                          {member.status === 'pending' && (
                            <span className="px-2 py-0.5 bg-[#ff9500]/20 text-[#ff9500] rounded-full text-[10px] font-medium">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-white/50 text-sm truncate">{member.email}</p>
                      </div>
                      <div className="hidden sm:block">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          member.role === 'admin' ? 'bg-[#ff9500]/20 text-[#ff9500]' :
                          member.role === 'editor' ? 'bg-[#0071e3]/20 text-[#0071e3]' :
                          'bg-white/10 text-white/60'
                        }`}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </span>
                      </div>
                      {member.id !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-white/40 hover:text-[#ff3b30] transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {!canInvite && (
                  <div className="p-6 bg-white/5">
                    <p className="text-white/60 text-center">
                      <Link href="/pricing" className="text-[#0071e3] hover:underline">
                        Upgrade to Growth or Pro
                      </Link>
                      {' '}to invite team members
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-6"
              >
                <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
                
                <div className="space-y-4">
                  {/* Sample activity items */}
                  <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-[#0071e3]/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-white">
                        <span className="font-medium">{user?.firstName || 'You'}</span>
                        {' '}uploaded a document for analysis
                      </p>
                      <p className="text-white/40 text-sm mt-1">Just now</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-[#34c759]/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-white">
                        Workspace created
                      </p>
                      <p className="text-white/40 text-sm mt-1">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-6"
              >
                <h2 className="text-xl font-semibold text-white mb-6">Team Settings</h2>
                
                <div className="space-y-6">
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h3 className="text-white font-medium mb-2">Default Role for New Members</h3>
                    <p className="text-white/50 text-sm mb-4">
                      Choose the default permissions for new team invites
                    </p>
                    <select 
                      defaultValue="editor"
                      className="w-full md:w-auto px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#0071e3] focus:border-transparent outline-none"
                    >
                      <option value="editor">Editor - Can upload and view reports</option>
                      <option value="viewer">Viewer - Can only view reports</option>
                    </select>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h3 className="text-white font-medium mb-2">Notification Preferences</h3>
                    <p className="text-white/50 text-sm mb-4">
                      Get notified when team members upload documents or generate reports
                    </p>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                      <span className="text-white">Email notifications for team activity</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#1d1d1f] rounded-3xl p-8 w-full max-w-md border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-semibold text-white mb-2">Invite Team Member</h2>
              <p className="text-white/60 mb-6">
                They'll receive an email invitation to join your workspace.
              </p>
              
              <form onSubmit={handleSendInvite}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:ring-2 focus:ring-[#0071e3]/50 focus:border-[#0071e3] outline-none"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-[#0071e3]/50 focus:border-[#0071e3] outline-none"
                  >
                    <option value="editor">Editor - Can upload and view reports</option>
                    <option value="viewer">Viewer - Can only view reports</option>
                  </select>
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-3 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors"
                  >
                    Send Invite
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
