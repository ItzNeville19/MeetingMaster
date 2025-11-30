'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { useUser } from '@clerk/nextjs';
import { useOwnerUpgrade } from '@/lib/useOwnerUpgrade';

// All benefits from pricing - COMPREHENSIVE list
const allBenefits = [
  // Core Features (All plans)
  {
    id: 'analysis',
    category: 'Core',
    name: 'AI Document Analysis',
    shortDesc: 'Scan any document for compliance risks',
    fullDesc: 'Upload employee handbooks, safety manuals, permits, or policies. Our AI analyzes against 50+ federal and state regulations in under 5 minutes.',
    limit: { free: '1/month', starter: '5/month', growth: '20/month', pro: 'Unlimited' },
    tiers: ['free', 'starter', 'growth', 'pro'],
    claimAction: '/dashboard',
    claimLabel: 'Analyze Document',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    demoType: 'scanner',
  },
  {
    id: 'risk-assessment',
    category: 'Core',
    name: 'Risk Assessment',
    shortDesc: 'Prioritized risks with severity scores',
    fullDesc: 'Get a complete breakdown of compliance risks ranked by severity (1-10), with potential fines and specific regulations cited for each issue.',
    tiers: ['free', 'starter', 'growth', 'pro'],
    claimAction: '/dashboard',
    claimLabel: 'View Risks',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    demoType: 'risks',
  },
  {
    id: 'pdf-reports',
    category: 'Core',
    name: 'PDF Reports',
    shortDesc: 'Professional downloadable reports',
    fullDesc: 'Generate beautifully formatted PDF reports ready for leadership presentations, board meetings, and regulatory audits.',
    tiers: ['free', 'starter', 'growth', 'pro'],
    claimAction: '/dashboard',
    claimLabel: 'Download Reports',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    demoType: 'pdf',
  },
  {
    id: 'action-plans',
    category: 'Core',
    name: '7-Day Action Plans',
    shortDesc: 'Step-by-step remediation guide',
    fullDesc: 'Receive a structured day-by-day plan to resolve all identified compliance issues. Prioritized tasks ensure critical risks are addressed first.',
    tiers: ['starter', 'growth', 'pro'],
    claimAction: '/dashboard',
    claimLabel: 'View Action Plans',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
    demoType: 'plan',
  },
  {
    id: 'compliance-chatbot',
    category: 'Core',
    name: 'JC Compliance Chatbot',
    shortDesc: 'AI assistant for compliance questions',
    fullDesc: 'Chat with JC, our AI compliance assistant. Get instant answers about your audits, risks, regulations, account management, and more. Free users get 5 messages per day. Starter and above get unlimited messages.',
    limit: { free: '5/day', starter: 'Unlimited', growth: 'Unlimited', pro: 'Unlimited' },
    tiers: ['free', 'starter', 'growth', 'pro'],
    claimAction: '/dashboard',
    claimLabel: 'Chat with JC',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337L5 20l1.318-3.975A9.72 9.72 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    demoType: 'chat',
  },
  // Analytics Features
  {
    id: 'trend-charts',
    category: 'Analytics',
    name: 'Risk Trend Charts',
    shortDesc: 'Track compliance over time',
    fullDesc: 'Visualize how your compliance score improves over time. See which areas are getting better and which need more attention.',
    tiers: ['growth', 'pro'],
    claimAction: '/insights',
    claimLabel: 'View Trends',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    demoType: 'chart',
  },
  {
    id: 'weekly-digest',
    category: 'Analytics',
    name: 'Weekly Compliance Digest',
    shortDesc: 'Automated insights every week',
    fullDesc: 'Receive a weekly email summary of your compliance status, new risks detected, resolved issues, and recommended next steps.',
    tiers: ['growth', 'pro'],
    claimAction: '/settings',
    claimLabel: 'Configure Digest',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    demoType: null,
  },
  {
    id: 'predictive-alerts',
    category: 'Analytics',
    name: 'Predictive Risk Alerts',
    shortDesc: 'AI-powered future risk detection',
    fullDesc: 'Our AI monitors regulatory changes and predicts how they might affect your compliance. Get notified before issues become violations.',
    tiers: ['pro'],
    claimAction: '/settings',
    claimLabel: 'Configure Alerts',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
    demoType: 'alert',
  },
  // Team & Collaboration
  {
    id: 'team-members',
    category: 'Collaboration',
    name: 'Team Collaboration',
    shortDesc: 'Invite your compliance team',
    fullDesc: 'Add team members with role-based access. Assign tasks, share reports, and collaborate on remediation efforts.',
    limit: { free: '1 user', starter: '1 user', growth: '5 users', pro: 'Unlimited' },
    tiers: ['growth', 'pro'],
    claimAction: '/team',
    claimLabel: 'Manage Team',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    demoType: 'team',
  },
  {
    id: 'locations',
    category: 'Collaboration',
    name: 'Multi-Location Support',
    shortDesc: 'Manage multiple business locations',
    fullDesc: 'Track compliance separately for each business location. Compare risk levels across sites and identify patterns.',
    limit: { free: '1 location', starter: '1 location', growth: '3 locations', pro: 'Unlimited' },
    tiers: ['growth', 'pro'],
    claimAction: '/settings',
    claimLabel: 'Add Locations',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    demoType: null,
  },
  {
    id: 'audit-trail',
    category: 'Analytics',
    name: 'Compliance Audit Trail',
    shortDesc: 'Complete history of all compliance actions',
    fullDesc: 'Track every change, analysis, and action taken in your compliance journey. See who did what, when, and why. Perfect for audits and demonstrating due diligence to regulators.',
    tiers: ['growth', 'pro'],
    claimAction: '/audit-trail',
    claimLabel: 'View Audit Trail',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    demoType: null,
  },
  {
    id: 'team-dashboard',
    category: 'Collaboration',
    name: 'Team Dashboard',
    shortDesc: 'Full visibility across your team',
    fullDesc: 'See who is working on what, track task completion, and monitor team performance on compliance initiatives.',
    tiers: ['pro'],
    claimAction: '/team',
    claimLabel: 'Open Dashboard',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    demoType: null,
  },
  // Support
  {
    id: 'email-support',
    category: 'Support',
    name: 'Email Support',
    shortDesc: 'Get help when you need it',
    fullDesc: 'Our compliance experts are available via email to answer questions, help interpret reports, and provide guidance.',
    tiers: ['free', 'starter', 'growth', 'pro'],
    claimAction: 'mailto:neville@rayze.xyz?subject=[LifeØS] Support Request',
    claimLabel: 'Contact Support',
    isEmail: true,
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    demoType: null,
  },
  {
    id: 'priority-support',
    category: 'Support',
    name: 'Priority Support',
    shortDesc: 'Faster response times',
    fullDesc: 'Skip the queue with priority support. Get responses within 4 hours during business hours.',
    tiers: ['growth', 'pro'],
    claimAction: 'mailto:neville@rayze.xyz?subject=[LifeØS Priority] Support Request',
    claimLabel: 'Priority Support',
    isEmail: true,
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    demoType: null,
  },
  {
    id: '24-7-support',
    category: 'Support',
    name: '24/7 Priority Support',
    shortDesc: 'Around-the-clock assistance',
    fullDesc: 'Get help anytime, day or night. Our enterprise support team is available 24/7 for critical issues.',
    tiers: ['pro'],
    claimAction: '/support',
    claimLabel: 'Get Support',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    demoType: null,
  },
  {
    id: 'account-manager',
    category: 'Support',
    name: 'Dedicated Account Manager',
    shortDesc: 'Your personal compliance expert',
    fullDesc: 'Get a dedicated account manager who knows your business. Schedule strategy sessions and get personalized guidance.',
    tiers: ['pro'],
    claimAction: '/account-manager',
    claimLabel: 'Meet Your Manager',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    demoType: null,
  },
  // Enterprise
  {
    id: 'api-access',
    category: 'Enterprise',
    name: 'API Access',
    shortDesc: 'Integrate with your systems',
    fullDesc: 'Full REST API access to integrate LifeØS into your existing workflows. Automate compliance checks in your CI/CD pipeline.',
    tiers: ['pro'],
    claimAction: '/api-keys',
    claimLabel: 'Get API Key',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    demoType: 'api',
  },
  {
    id: 'sla',
    category: 'Enterprise',
    name: 'SLA Guarantee',
    shortDesc: '99.9% uptime commitment',
    fullDesc: 'Enterprise-grade SLA with 99.9% uptime guarantee. If we fail to meet our SLA, you get service credits.',
    tiers: ['pro'],
    claimAction: '/sla',
    claimLabel: 'View SLA Status',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    demoType: null,
  },
  {
    id: 'custom-branding',
    category: 'Enterprise',
    name: 'Custom Branding',
    shortDesc: 'White-label reports',
    fullDesc: 'Add your company logo and colors to PDF reports. Perfect for consultants and agencies serving multiple clients.',
    tiers: ['pro'],
    claimAction: '/branding',
    claimLabel: 'Setup Branding',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
    demoType: null,
  },
];

const categories = ['Core', 'Analytics', 'Collaboration', 'Support', 'Enterprise'];

// Color schemes for each category to differentiate benefits visually
const categoryColors: Record<string, { gradient: string; iconBg: string; iconColor: string; border: string; hoverGlow: string; button: string }> = {
  'Core': {
    gradient: 'from-[#0071e3]/10 to-[#0071e3]/5',
    iconBg: 'from-[#0071e3]/20 to-[#0077ed]/20',
    iconColor: 'text-[#0071e3]',
    border: 'border-[#0071e3]/20',
    hoverGlow: 'from-[#0071e3]/10',
    button: 'bg-[#0071e3] hover:bg-[#0077ed]',
  },
  'Analytics': {
    gradient: 'from-[#5856d6]/10 to-[#5856d6]/5',
    iconBg: 'from-[#5856d6]/20 to-[#af52de]/20',
    iconColor: 'text-[#5856d6]',
    border: 'border-[#5856d6]/20',
    hoverGlow: 'from-[#5856d6]/10',
    button: 'bg-[#5856d6] hover:bg-[#6b69e8]',
  },
  'Collaboration': {
    gradient: 'from-[#34c759]/10 to-[#34c759]/5',
    iconBg: 'from-[#34c759]/20 to-[#30d158]/20',
    iconColor: 'text-[#34c759]',
    border: 'border-[#34c759]/20',
    hoverGlow: 'from-[#34c759]/10',
    button: 'bg-[#34c759] hover:bg-[#30d158]',
  },
  'Support': {
    gradient: 'from-[#ff9500]/10 to-[#ff9500]/5',
    iconBg: 'from-[#ff9500]/20 to-[#ffad33]/20',
    iconColor: 'text-[#ff9500]',
    border: 'border-[#ff9500]/20',
    hoverGlow: 'from-[#ff9500]/10',
    button: 'bg-[#ff9500] hover:bg-[#ffad33]',
  },
  'Enterprise': {
    gradient: 'from-[#af52de]/10 to-[#af52de]/5',
    iconBg: 'from-[#af52de]/20 to-[#c969f0]/20',
    iconColor: 'text-[#af52de]',
    border: 'border-[#af52de]/20',
    hoverGlow: 'from-[#af52de]/10',
    button: 'bg-[#af52de] hover:bg-[#c969f0]',
  },
};

// Mini demo components
function ScannerDemo() {
  const [progress, setProgress] = useState(0);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (scanning && progress < 100) {
      const timer = setTimeout(() => setProgress(p => Math.min(p + 2, 100)), 50);
      return () => clearTimeout(timer);
    }
    if (progress >= 100) {
      setTimeout(() => { setProgress(0); setScanning(false); }, 2000);
    }
  }, [scanning, progress]);

  return (
    <div className="bg-[#0d0d12] rounded-xl p-4 border border-white/5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-[#0071e3]/20 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-[#0071e3]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-white text-sm font-medium">employee_handbook.pdf</p>
          <p className="text-white/40 text-xs">2.4 MB</p>
        </div>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
        <motion.div 
          className="h-full bg-gradient-to-r from-[#0071e3] to-[#34c759]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-white/40 text-xs">{scanning ? `Scanning... ${progress}%` : 'Ready'}</span>
        <button 
          onClick={() => { setScanning(true); setProgress(0); }}
          className="text-[#0071e3] text-xs font-medium hover:underline"
        >
          {scanning ? 'Analyzing...' : 'Try Demo'}
        </button>
      </div>
    </div>
  );
}

function RisksDemo() {
  return (
    <div className="bg-[#0d0d12] rounded-xl p-4 border border-white/5 space-y-2">
      {[
        { label: 'Critical', count: 2, color: '#ff3b30' },
        { label: 'High', count: 5, color: '#ff9500' },
        { label: 'Medium', count: 8, color: '#ffcc00' },
      ].map((risk) => (
        <div key={risk.label} className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: risk.color }} />
          <span className="text-white/60 text-sm flex-1">{risk.label}</span>
          <span className="text-white font-semibold text-sm">{risk.count}</span>
        </div>
      ))}
    </div>
  );
}

function ChartDemo() {
  return (
    <div className="bg-[#0d0d12] rounded-xl p-4 border border-white/5">
      <svg viewBox="0 0 100 40" className="w-full h-16">
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0071e3" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0071e3" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,35 L15,28 L30,32 L45,20 L60,22 L75,12 L90,15 L100,8 L100,40 L0,40 Z" fill="url(#chartGradient)" />
        <path d="M0,35 L15,28 L30,32 L45,20 L60,22 L75,12 L90,15 L100,8" fill="none" stroke="#0071e3" strokeWidth="2" />
      </svg>
      <p className="text-center text-white/40 text-xs mt-2">Risk trend over 30 days</p>
    </div>
  );
}

function TeamDemo() {
  return (
    <div className="bg-[#0d0d12] rounded-xl p-4 border border-white/5">
      <div className="flex -space-x-2 justify-center mb-2">
        {['#0071e3', '#34c759', '#ff9500', '#5856d6'].map((color, i) => (
          <div 
            key={i} 
            className="w-8 h-8 rounded-full border-2 border-[#0d0d12] flex items-center justify-center text-white text-xs font-semibold"
            style={{ backgroundColor: color }}
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}
        <div className="w-8 h-8 rounded-full border-2 border-[#0d0d12] bg-white/10 flex items-center justify-center text-white/60 text-xs">
          +3
        </div>
      </div>
      <p className="text-center text-white/40 text-xs">7 team members</p>
    </div>
  );
}

function APIDemo() {
  return (
    <div className="bg-[#0d0d12] rounded-xl p-3 border border-white/5 font-mono text-xs overflow-hidden">
      <div className="text-[#34c759]">POST /api/v1/analyze</div>
      <div className="text-white/40 mt-1">{"{"}</div>
      <div className="text-white/60 ml-2">"file": <span className="text-[#ff9500]">"doc.pdf"</span>,</div>
      <div className="text-white/60 ml-2">"regulations": <span className="text-[#0071e3]">["OSHA", "HIPAA"]</span></div>
      <div className="text-white/40">{"}"}</div>
    </div>
  );
}

export default function BenefitsPage() {
  const { user, isLoaded } = useUser();
  const [subscription, setSubscription] = useState<{
    tier: string;
    uploadsUsed: number;
    isOwner?: boolean;
    isDev?: boolean;
  }>({ tier: 'free', uploadsUsed: 0 });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedBenefit, setExpandedBenefit] = useState<string | null>(null);
  
  // Auto-upgrade owner account
  useOwnerUpgrade();

  useEffect(() => {
    if (isLoaded && user) {
      // Check user metadata directly first
      const userSub = user.publicMetadata?.subscription as any;
      const userEmail = user.emailAddresses?.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || 
                       user.emailAddresses?.[0]?.emailAddress;
      
      // Check if this is the owner email
      const isOwnerEmail = userEmail?.toLowerCase() === 'neville@rayze.xyz';
      
      // Set subscription from metadata or default
      const sub = userSub || { tier: 'free', uploadsUsed: 0 };
      
      // If owner email, force pro tier and dev access
      if (isOwnerEmail) {
        sub.isOwner = true;
        sub.isDev = true;
        sub.tier = 'pro';
        sub.uploadsLimit = -1;
        sub.teamMembersLimit = -1;
        sub.locationsLimit = -1;
      }
      
      setSubscription(sub);
      
      // Also fetch from API to get reports count, but don't wait for it
      fetch('/api/get-reports')
        .then(res => res.json())
        .then(data => {
          if (data.subscription) {
            const apiSub = data.subscription;
            // Merge API data but keep owner flags
            setSubscription({
              ...apiSub,
              isOwner: sub.isOwner || apiSub.isOwner,
              isDev: sub.isDev || apiSub.isDev,
              tier: sub.tier || apiSub.tier,
            });
          }
        })
        .catch(() => {});
    }
  }, [isLoaded, user]);

  // Check if user is owner/dev - DEV accounts get EVERYTHING
  const isOwner = subscription.isOwner || subscription.isDev;
  const tier = isOwner ? 'pro' : subscription.tier;
  
  // DEV accounts unlock ALL benefits
  const unlockedCount = isOwner ? allBenefits.length : allBenefits.filter(b => b.tiers.includes(tier)).length;
  const filteredBenefits = activeCategory 
    ? allBenefits.filter(b => b.category === activeCategory)
    : allBenefits;

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
        <div className="max-w-[1200px] mx-auto">
          
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            {/* Membership Card */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block mb-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0071e3] via-[#5856d6] to-[#af52de] blur-xl opacity-50" />
                <div className="relative bg-gradient-to-br from-[#1d1d1f] to-[#2d2d2f] rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center">
                      {user?.imageUrl ? (
                        <img src={user.imageUrl} alt="" className="w-12 h-12 rounded-full" />
                      ) : (
                        <span className="text-white text-xl font-bold">{user?.firstName?.charAt(0) || 'U'}</span>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-white font-semibold text-lg">{user?.fullName || 'Member'}</p>
                      <p className="text-[#0071e3] font-medium">
                        {isOwner ? 'DEV' : tier.charAt(0).toUpperCase() + tier.slice(1)} Member
                      </p>
                    </div>
                    <div className="ml-8 text-right">
                      <p className="text-white/40 text-sm">Benefits</p>
                      <p className="text-2xl font-bold text-white">{unlockedCount}<span className="text-white/40 text-lg">/{allBenefits.length}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <h1 className="text-[48px] md:text-[64px] font-bold text-white mb-6 leading-tight">
              Your <span className="bg-gradient-to-r from-[#0071e3] via-[#5856d6] to-[#af52de] bg-clip-text text-transparent">Membership</span>
            </h1>
            <p className="text-[20px] text-white/50 max-w-2xl mx-auto">
              Claim and use every benefit included with your {isOwner ? 'DEV' : tier.charAt(0).toUpperCase() + tier.slice(1)} membership.
              {!isOwner && tier !== 'pro' && ' Upgrade to unlock more.'}
            </p>
          </motion.div>

          {/* Category Filter */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === null
                  ? 'bg-white text-[#1d1d1f]'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              All Benefits ({allBenefits.length})
            </button>
            {categories.map((cat) => {
              const count = allBenefits.filter(b => b.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-white text-[#1d1d1f]'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </motion.div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <AnimatePresence mode="popLayout">
              {filteredBenefits.map((benefit, i) => {
                // DEV accounts unlock EVERYTHING
                const isUnlocked = isOwner || benefit.tiers.includes(tier);
                const isExpanded = expandedBenefit === benefit.id;
                
                const categoryColor = categoryColors[benefit.category] || categoryColors['Core'];
                const borderColorClass = isUnlocked 
                  ? categoryColor.border === 'border-[#0071e3]/20' ? 'border-[#0071e3]/20 hover:border-[#0071e3]/30'
                  : categoryColor.border === 'border-[#5856d6]/20' ? 'border-[#5856d6]/20 hover:border-[#5856d6]/30'
                  : categoryColor.border === 'border-[#34c759]/20' ? 'border-[#34c759]/20 hover:border-[#34c759]/30'
                  : categoryColor.border === 'border-[#ff9500]/20' ? 'border-[#ff9500]/20 hover:border-[#ff9500]/30'
                  : 'border-[#af52de]/20 hover:border-[#af52de]/30'
                  : 'border-white/5';
                const ringColorClass = isExpanded
                  ? categoryColor.border === 'border-[#0071e3]/20' ? 'ring-2 ring-[#0071e3]'
                  : categoryColor.border === 'border-[#5856d6]/20' ? 'ring-2 ring-[#5856d6]'
                  : categoryColor.border === 'border-[#34c759]/20' ? 'ring-2 ring-[#34c759]'
                  : categoryColor.border === 'border-[#ff9500]/20' ? 'ring-2 ring-[#ff9500]'
                  : 'ring-2 ring-[#af52de]'
                  : '';
                
                return (
                  <motion.div
                    key={benefit.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setExpandedBenefit(isExpanded ? null : benefit.id)}
                    className={`group relative cursor-pointer rounded-2xl border transition-all ${
                      isUnlocked
                        ? `bg-gradient-to-br from-[#1d1d1f] to-[#2a2a2f] ${borderColorClass}`
                        : 'bg-white/[0.02] border-white/5'
                    } ${ringColorClass}`}
                  >
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      isUnlocked 
                        ? 'bg-[#34c759]/20 text-[#34c759]' 
                        : 'bg-white/5 text-white/30'
                    }`}>
                      {isUnlocked ? 'Active' : benefit.tiers[0]}
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Icon & Title */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isUnlocked 
                            ? categoryColor.iconBg === 'from-[#0071e3]/20 to-[#0077ed]/20' ? 'bg-gradient-to-br from-[#0071e3]/20 to-[#0077ed]/20 text-[#0071e3]'
                            : categoryColor.iconBg === 'from-[#5856d6]/20 to-[#af52de]/20' ? 'bg-gradient-to-br from-[#5856d6]/20 to-[#af52de]/20 text-[#5856d6]'
                            : categoryColor.iconBg === 'from-[#34c759]/20 to-[#30d158]/20' ? 'bg-gradient-to-br from-[#34c759]/20 to-[#30d158]/20 text-[#34c759]'
                            : categoryColor.iconBg === 'from-[#ff9500]/20 to-[#ffad33]/20' ? 'bg-gradient-to-br from-[#ff9500]/20 to-[#ffad33]/20 text-[#ff9500]'
                            : 'bg-gradient-to-br from-[#af52de]/20 to-[#c969f0]/20 text-[#af52de]'
                            : 'bg-white/5 text-white/30'
                        }`}>
                          {benefit.icon}
                        </div>
                        <div className="pt-1">
                          <h3 className={`text-lg font-semibold mb-1 ${isUnlocked ? 'text-white' : 'text-white/40'}`}>
                            {benefit.name}
                          </h3>
                          <p className={`text-sm ${isUnlocked ? 'text-white/50' : 'text-white/30'}`}>
                            {benefit.shortDesc}
                          </p>
                        </div>
                      </div>

                      {/* Limit Badge */}
                      {benefit.limit && isUnlocked && (
                        <div className="mb-4">
                          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                            categoryColor.iconColor === 'text-[#0071e3]' ? 'bg-[#0071e3]/10 text-[#0071e3]'
                            : categoryColor.iconColor === 'text-[#5856d6]' ? 'bg-[#5856d6]/10 text-[#5856d6]'
                            : categoryColor.iconColor === 'text-[#34c759]' ? 'bg-[#34c759]/10 text-[#34c759]'
                            : categoryColor.iconColor === 'text-[#ff9500]' ? 'bg-[#ff9500]/10 text-[#ff9500]'
                            : 'bg-[#af52de]/10 text-[#af52de]'
                          }`}>
                            {benefit.limit[tier as keyof typeof benefit.limit]}
                          </span>
                        </div>
                      )}

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="text-white/60 text-sm mb-4 leading-relaxed">
                              {benefit.fullDesc}
                            </p>

                            {/* Demo */}
                            {isUnlocked && benefit.demoType && (
                              <div className="mb-4">
                                {benefit.demoType === 'scanner' && <ScannerDemo />}
                                {benefit.demoType === 'risks' && <RisksDemo />}
                                {benefit.demoType === 'chart' && <ChartDemo />}
                                {benefit.demoType === 'team' && <TeamDemo />}
                                {benefit.demoType === 'api' && <APIDemo />}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* CTA */}
                      <div className="pt-2">
                        {isUnlocked ? (
                          benefit.isEmail ? (
                            <a
                              href={benefit.claimAction}
                              onClick={(e) => e.stopPropagation()}
                              className={`inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-full transition-colors ${
                                categoryColor.button === 'bg-[#0071e3] hover:bg-[#0077ed]' ? 'bg-[#0071e3] hover:bg-[#0077ed]'
                                : categoryColor.button === 'bg-[#5856d6] hover:bg-[#6b69e8]' ? 'bg-[#5856d6] hover:bg-[#6b69e8]'
                                : categoryColor.button === 'bg-[#34c759] hover:bg-[#30d158]' ? 'bg-[#34c759] hover:bg-[#30d158]'
                                : categoryColor.button === 'bg-[#ff9500] hover:bg-[#ffad33]' ? 'bg-[#ff9500] hover:bg-[#ffad33]'
                                : 'bg-[#af52de] hover:bg-[#c969f0]'
                              }`}
                            >
                              {benefit.claimLabel}
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </a>
                          ) : (
                            <Link
                              href={benefit.claimAction}
                              onClick={(e) => e.stopPropagation()}
                              className={`inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-full transition-colors ${
                                categoryColor.button === 'bg-[#0071e3] hover:bg-[#0077ed]' ? 'bg-[#0071e3] hover:bg-[#0077ed]'
                                : categoryColor.button === 'bg-[#5856d6] hover:bg-[#6b69e8]' ? 'bg-[#5856d6] hover:bg-[#6b69e8]'
                                : categoryColor.button === 'bg-[#34c759] hover:bg-[#30d158]' ? 'bg-[#34c759] hover:bg-[#30d158]'
                                : categoryColor.button === 'bg-[#ff9500] hover:bg-[#ffad33]' ? 'bg-[#ff9500] hover:bg-[#ffad33]'
                                : 'bg-[#af52de] hover:bg-[#c969f0]'
                              }`}
                            >
                              {benefit.claimLabel}
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </Link>
                          )
                        ) : (
                          <Link
                            href="/pricing"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white/60 text-sm font-medium rounded-full hover:bg-white/15 transition-colors"
                          >
                            Unlock with {benefit.tiers[0].charAt(0).toUpperCase() + benefit.tiers[0].slice(1)}
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Hover Glow */}
                    {isUnlocked && (
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                        categoryColor.hoverGlow === 'from-[#0071e3]/10' ? 'from-[#0071e3]/10'
                        : categoryColor.hoverGlow === 'from-[#5856d6]/10' ? 'from-[#5856d6]/10'
                        : categoryColor.hoverGlow === 'from-[#34c759]/10' ? 'from-[#34c759]/10'
                        : categoryColor.hoverGlow === 'from-[#ff9500]/10' ? 'from-[#ff9500]/10'
                        : 'from-[#af52de]/10'
                      }`} />
                    )}
                    
                    {/* Category Accent Bar */}
                    {isUnlocked && (
                      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${
                        categoryColor.iconBg === 'from-[#0071e3]/20 to-[#0077ed]/20' ? 'from-[#0071e3] to-[#0077ed]'
                        : categoryColor.iconBg === 'from-[#5856d6]/20 to-[#af52de]/20' ? 'from-[#5856d6] to-[#af52de]'
                        : categoryColor.iconBg === 'from-[#34c759]/20 to-[#30d158]/20' ? 'from-[#34c759] to-[#30d158]'
                        : categoryColor.iconBg === 'from-[#ff9500]/20 to-[#ffad33]/20' ? 'from-[#ff9500] to-[#ffad33]'
                        : 'from-[#af52de] to-[#c969f0]'
                      }`} />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Upgrade CTA */}
          {!isOwner && tier !== 'pro' && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative overflow-hidden rounded-3xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#0071e3] via-[#5856d6] to-[#af52de]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
              
              <div className="relative p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                    Unlock {allBenefits.length - unlockedCount} More Benefits
                  </h2>
                  <p className="text-white/80 text-lg max-w-lg">
                    Upgrade to get unlimited analyses, team collaboration, API access, SLA guarantee, and dedicated support.
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="flex-shrink-0 inline-flex items-center gap-3 px-10 py-5 bg-white text-[#0071e3] rounded-full font-semibold text-lg hover:bg-white/90 transition-colors shadow-2xl"
                >
                  View Plans
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 text-center"
          >
            <Link href="/dashboard" className="text-[#0071e3] hover:underline inline-flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
