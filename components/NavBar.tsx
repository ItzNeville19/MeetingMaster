'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs';

const tierBadges: Record<string, { label: string; color: string }> = {
  free: { label: '', color: '' }, // No badge for free
  starter: { label: 'STARTER', color: 'bg-[#0071e3] text-white' },
  growth: { label: 'GROWTH', color: 'bg-[#5856d6] text-white' },
  pro: { label: 'PRO', color: 'bg-gradient-to-r from-[#ff9500] to-[#ff3b30] text-white' },
};

export default function NavBar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Get subscription tier
  const subscription = user?.publicMetadata?.subscription as { tier?: string } | undefined;
  const tier = subscription?.tier || 'free';
  const badge = tierBadges[tier];

  // Determine if we're on a dark page
  const isDarkPage = ['/dashboard', '/upload', '/settings', '/team', '/benefits', '/reports', '/api-keys', '/sla', '/branding', '/insights'].some(
    path => pathname.startsWith(path)
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const textColor = isDarkPage ? 'text-white' : 'text-[#1d1d1f]';
  const textMuted = isDarkPage ? 'text-white/60' : 'text-[#1d1d1f]/60';
  const bgScrolled = isDarkPage 
    ? 'bg-[#1d1d1f]/90 backdrop-blur-xl border-b border-white/10' 
    : 'bg-white/80 backdrop-blur-xl border-b border-black/5';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? bgScrolled : 'bg-transparent'
    }`}>
      <div className="max-w-[980px] mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className={`text-xl font-semibold ${textColor}`}>
              LifeØS
            </Link>
            <a 
              href="https://rayze.xyz" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`hidden sm:inline-flex items-center gap-1 text-[10px] ${textMuted} hover:${textColor} transition-colors border border-current/20 px-2 py-0.5 rounded-full`}
            >
              rayze.xyz
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </a>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/pricing"
              className={`text-sm transition-colors ${
                pathname === '/pricing' ? textColor : `${textMuted} hover:${textColor}`
              }`}
            >
              Pricing
            </Link>
            <SignedIn>
              <Link
                href="/dashboard"
                className={`text-sm transition-colors ${
                  pathname === '/dashboard' ? textColor : `${textMuted} hover:${textColor}`
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/benefits"
                className={`text-sm transition-colors ${
                  pathname === '/benefits' ? textColor : `${textMuted} hover:${textColor}`
                }`}
              >
                Benefits
              </Link>
            </SignedIn>
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className={`text-sm ${textColor}`}>
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-sm px-5 py-2 bg-[#0071e3] text-white rounded-full hover:bg-[#0077ed] transition-colors">
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-2">
                {/* Subscription Badge */}
                {badge.label && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${badge.color}`}>
                    {badge.label}
                  </span>
                )}
                <UserButton 
                  afterSignOutUrl="/" 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                />
              </div>
            </SignedIn>
          </div>

          {/* Mobile Toggle */}
          <button
            className={`md:hidden p-2 ${textColor}`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={`md:hidden px-6 py-6 space-y-4 ${
          isDarkPage 
            ? 'bg-[#1d1d1f] border-t border-white/10' 
            : 'bg-white border-t border-black/5'
        }`}>
          <Link href="/pricing" className={`block ${textColor}`}>Pricing</Link>
          <SignedIn>
            {/* Mobile Badge */}
            {badge.label && (
              <div className="flex items-center gap-2 py-2">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${badge.color}`}>
                  {badge.label}
                </span>
                <span className={`text-sm ${textMuted}`}>Plan</span>
              </div>
            )}
            <Link href="/dashboard" className={`block ${textColor}`}>Dashboard</Link>
            <Link href="/benefits" className={`block ${textColor}`}>Benefits</Link>
            <Link href="/team" className={`block ${textColor}`}>Team</Link>
            <Link href="/settings" className={`block ${textColor}`}>Settings</Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className={`block ${textColor}`}>Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="block w-full py-3 bg-[#0071e3] text-white rounded-xl text-center">
                Get Started
              </button>
            </SignUpButton>
          </SignedOut>
        </div>
      )}
    </nav>
  );
}
