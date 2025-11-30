'use client';

import { motion } from 'framer-motion';
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
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="display-medium text-[#1d1d1f] mb-6"
          >
            We&apos;re building the future<br />of compliance.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="body-large text-[#86868b] max-w-[600px] mx-auto"
          >
            LifeØS was founded to make enterprise compliance accessible to every business, 
            regardless of size or budget.
          </motion.p>
        </div>
      </section>

      {/* Mission */}
      <section className="section-padding">
        <div className="container-apple">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
          >
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
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-[#f5f5f7] rounded-3xl p-12"
            >
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-[#f5f5f7]">
        <div className="container-apple">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="headline text-[#1d1d1f] text-center mb-16"
          >
            What we believe
          </motion.h2>
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
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-8"
              >
                <h3 className="title-1 text-[#1d1d1f] mb-4">{value.title}</h3>
                <p className="body text-[#86868b]">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="section-padding">
        <div className="container-apple">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="headline text-[#1d1d1f] text-center mb-6"
          >
            Meet the Founder
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="body-large text-[#86868b] max-w-[600px] mx-auto text-center mb-16"
          >
            Building the future of compliance, one line of code at a time.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="max-w-[800px] mx-auto"
          >
            <div className="bg-[#f5f5f7] rounded-3xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Profile */}
                <div className="flex-shrink-0 text-center md:text-left">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#0071e3] to-[#00c7be] rounded-full mx-auto md:mx-0 mb-4 flex items-center justify-center">
                    <span className="text-3xl text-white font-bold">N</span>
                  </div>
                  <h3 className="title-1 text-[#1d1d1f]">Neville Engineer</h3>
                  <p className="text-[#86868b] mb-3">Founder & CEO</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <a href="https://x.com/Neville_xyz" target="_blank" rel="noopener noreferrer" className="text-sm text-[#0071e3] hover:underline">@Neville_xyz</a>
                    <span className="text-[#86868b]">·</span>
                    <a href="https://x.com/lifeos_app" target="_blank" rel="noopener noreferrer" className="text-sm text-[#0071e3] hover:underline">@lifeos_app</a>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                    <a href="https://www.linkedin.com/company/life%C3%B8s/" target="_blank" rel="noopener noreferrer" className="text-sm text-[#0071e3] hover:underline">LinkedIn</a>
                    <span className="text-[#86868b]">·</span>
                    <a href="https://thecoopertimes.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[#0071e3] hover:underline">Portfolio</a>
                  </div>
                </div>

                {/* Bio */}
                <div className="flex-1 space-y-4">
                  <p className="text-[#1d1d1f] leading-relaxed">
                    I&apos;m 15. I haven&apos;t changed the world yet. I haven&apos;t built the company that matters. I haven&apos;t proven everything I&apos;m capable of. <strong className="text-[#0071e3]">But I&apos;m moving.</strong>
                  </p>
                  <p className="text-[#1d1d1f] leading-relaxed">
                    Most people my age are passengers in their own lives. I decided early on that wasn&apos;t going to be me. So I started building—apps on the App Store, a trading portfolio that&apos;s grown to $30K+, a vision for what&apos;s possible.
            </p>
                  <p className="text-[#1d1d1f] leading-relaxed">
                    I&apos;m obsessed with excellence—whether that&apos;s in code, in markets, or in myself. Every app I launch teaches me something. Every trade teaches me discipline. Every failure teaches me resilience.
            </p>
                  <p className="text-[#1d1d1f] leading-relaxed bg-white rounded-xl p-4 border-l-4 border-[#0071e3]">
                    <strong>LifeØS</strong> is the beginning of something bigger. Not because it&apos;s perfect—it&apos;s not. But because it represents my commitment: I&apos;m building tools that work. Tools that matter.
            </p>
                  <p className="text-[#0071e3] font-semibold text-lg">
                    I&apos;m 15 and I&apos;m just getting started. The best part? I&apos;m only going to get better.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding gradient-dark">
        <div className="container-apple text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="headline text-white mb-6"
          >
            Ready to find compliance gaps?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="body-large text-white/60 mb-10"
          >
            Start with a free analysis. No credit card required.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/upload" className="btn-apple btn-apple-primary px-10 py-4 text-lg">
              Get Started Free
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
