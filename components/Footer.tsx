import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-[#d2d2d7] bg-gradient-to-b from-[#f5f5f7] to-white">
      <div className="max-w-[980px] mx-auto px-6 py-12">
        {/* Top links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link href="/upload" className="text-sm text-[#424245] hover:text-[#1d1d1f]">Analyze Document</Link></li>
              <li><Link href="/dashboard" className="text-sm text-[#424245] hover:text-[#1d1d1f]">Dashboard</Link></li>
              <li><Link href="/pricing" className="text-sm text-[#424245] hover:text-[#1d1d1f]">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-[#424245] hover:text-[#1d1d1f]">About</Link></li>
              <li><Link href="/contact" className="text-sm text-[#424245] hover:text-[#1d1d1f]">Contact</Link></li>
              <li><a href="mailto:neville@rayze.xyz" className="text-sm text-[#424245] hover:text-[#1d1d1f]">neville@rayze.xyz</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-sm text-[#424245] hover:text-[#1d1d1f]">Privacy</Link></li>
              <li><Link href="/terms" className="text-sm text-[#424245] hover:text-[#1d1d1f]">Terms</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider mb-4">Connect</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://x.com/lifeos_app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-[#424245] hover:text-[#1d1d1f]"
                >
                  X (Twitter)
                </a>
              </li>
              <li>
                <a 
                  href="https://www.linkedin.com/company/life%C3%B8s/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-[#424245] hover:text-[#1d1d1f]"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-[#d2d2d7]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm font-semibold text-[#1d1d1f]">
                LifeØS
              </Link>
              <p className="text-xs text-[#86868b]">
                © {new Date().getFullYear()} LifeØS Inc. All rights reserved.
              </p>
            </div>
            <p className="text-xs text-[#86868b] text-center md:text-right max-w-md">
              AI-generated analysis for informational purposes only. Consult legal counsel before making compliance decisions.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
