'use client';

import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-[#f5f5f7]">
        <div className="container-apple text-center">
          <h1 className="display-medium text-[#1d1d1f] mb-6">
            We&apos;re building the future<br />of compliance.
          </h1>
          <p className="body-large text-[#86868b] max-w-[600px] mx-auto">
            LifeØS was founded to make enterprise compliance accessible to every business, 
            regardless of size or budget.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="section-padding">
        <div className="container-apple">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="headline text-[#1d1d1f] mb-6">Our mission</h2>
              <p className="body-large text-[#86868b] mb-6">
                Every year, businesses pay billions in preventable compliance fines. 
                Not because they don&apos;t care about compliance, but because traditional 
                audits are slow, expensive, and outdated.
              </p>
              <p className="body text-[#1d1d1f]">
                We built LifeØS to change that. By combining GPT-4o with our proprietary 
                Pal Nexus AI—trained specifically on regulatory compliance—we can analyze 
                any document against 50+ regulations in minutes, not weeks.
              </p>
            </div>
            <div className="bg-[#f5f5f7] rounded-3xl p-12">
              <div className="space-y-8">
                {[
                  { value: '50+', label: 'Regulations covered' },
                  { value: '3 min', label: 'Average analysis time' },
                  { value: '$0', label: 'To start' },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-4xl font-bold text-[#0071e3]">{stat.value}</div>
                    <div className="text-[#86868b]">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-[#f5f5f7]">
        <div className="container-apple">
          <h2 className="headline text-[#1d1d1f] text-center mb-16">What we believe</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Compliance should be accessible',
                desc: 'Every business deserves to understand their compliance risks, not just those who can afford expensive consultants.'
              },
              {
                title: 'AI should augment, not replace',
                desc: 'Our AI identifies risks and provides specific fixes, but humans make the final decisions.'
              },
              {
                title: 'Prevention beats reaction',
                desc: 'Finding a compliance gap before the inspector does saves money, stress, and reputation.'
              },
            ].map((value, i) => (
              <div key={i} className="bg-white rounded-2xl p-8">
                <h3 className="title-1 text-[#1d1d1f] mb-4">{value.title}</h3>
                <p className="body text-[#86868b]">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding">
        <div className="container-apple text-center">
          <h2 className="headline text-[#1d1d1f] mb-6">Founded by compliance experts</h2>
          <p className="body-large text-[#86868b] max-w-[600px] mx-auto mb-16">
            Our team combines decades of experience in compliance, AI, and enterprise software.
          </p>

          <div className="inline-block bg-[#f5f5f7] rounded-2xl p-8">
            <div className="w-24 h-24 bg-[#0071e3] rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl text-white font-bold">N</span>
            </div>
            <h3 className="title-1 text-[#1d1d1f]">Neville</h3>
            <p className="text-[#86868b]">Founder & CEO</p>
            <a 
              href="mailto:neville@rayze.xyz" 
              className="inline-block mt-4 text-[#0071e3] hover:underline"
            >
              neville@rayze.xyz
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding gradient-dark">
        <div className="container-apple text-center">
          <h2 className="headline text-white mb-6">Ready to find compliance gaps?</h2>
          <p className="body-large text-white/60 mb-10">
            Start with a free analysis. No credit card required.
          </p>
          <Link href="/upload" className="btn-apple btn-apple-primary px-10 py-4 text-lg">
            Get Started Free
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

