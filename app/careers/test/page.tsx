'use client';

import dynamicImport from 'next/dynamic';

// Prevent prerendering - this page uses browser APIs
export const dynamic = 'force-dynamic';

// Dynamically import the actual test content with SSR disabled
const SkillsTestPageContent = dynamicImport(() => import('./test-content'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#86868b]">Loading test...</p>
      </div>
    </div>
  ),
});

export default SkillsTestPageContent;
