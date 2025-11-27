'use client';

import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-[980px] mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <h1 className="text-[40px] md:text-[48px] font-semibold text-[#1d1d1f]">
              Sign in to LifeØS.
            </h1>
            <p className="text-[17px] text-[#86868b] max-w-md">
              Upload documents, see AI insights, and track compliance progress from a single dashboard.
            </p>
          </div>
          <div className="flex justify-center">
            <div className="bg-[#f5f5f7] rounded-3xl p-6 w-full max-w-md">
              <SignIn appearance={{ elements: { card: 'shadow-none bg-[#f5f5f7]' } }} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


