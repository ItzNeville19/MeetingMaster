'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
  });

  const subjects = [
    'General Inquiry',
    'Sales Question',
    'Technical Support',
    'Enterprise Demo',
    'Billing Issue',
    'Cancel Subscription',
    'Partnership',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct mailto link and open email client immediately
    const mailtoSubject = encodeURIComponent(`[LifeØS] ${formData.subject} - ${formData.name}`);
    const mailtoBody = encodeURIComponent(
`From: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message:
${formData.message}

---
Sent from LifeØS Contact Form`
    );
    
    // Open email client directly
    window.location.href = `mailto:neville@rayze.xyz?subject=${mailtoSubject}&body=${mailtoBody}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-[600px] mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-[40px] md:text-[48px] font-semibold text-[#1d1d1f] mb-4">
              Get in touch
            </h1>
            <p className="text-[18px] text-[#86868b]">
              Fill out the form and click send to open your email client, or email us directly.
            </p>
          </motion.div>

          {/* Direct Email CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 p-6 bg-[#0071e3]/5 rounded-2xl border border-[#0071e3]/10 text-center"
          >
            <p className="text-[15px] text-[#1d1d1f] mb-3">Email us directly at:</p>
            <a
              href="mailto:neville@rayze.xyz"
              className="inline-flex items-center gap-2 text-xl font-semibold text-[#0071e3] hover:underline"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              neville@rayze.xyz
            </a>
          </motion.div>

          {/* Contact Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[14px] font-medium text-[#1d1d1f] mb-2">
                  Your name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3.5 border border-[#e5e5ea] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-[#1d1d1f] mb-2">
                  Your email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3.5 border border-[#e5e5ea] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all"
                  placeholder="john@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[14px] font-medium text-[#1d1d1f] mb-2">
                Subject
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-3.5 border border-[#e5e5ea] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all bg-white"
              >
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[14px] font-medium text-[#1d1d1f] mb-2">
                Message *
              </label>
              <textarea
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3.5 border border-[#e5e5ea] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all resize-none"
                placeholder="How can we help you?"
              />
            </div>

            <motion.button
              type="submit"
              className="w-full py-4 bg-[#0071e3] text-white rounded-full font-semibold text-[17px] hover:bg-[#0077ed] transition-colors flex items-center justify-center gap-2"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Message (Opens Email)
            </motion.button>

            <p className="text-center text-[13px] text-[#86868b]">
              Clicking send will open your default email client with the message pre-filled.
            </p>
          </motion.form>

          {/* FAQ Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-center p-6 bg-[#f5f5f7] rounded-2xl"
          >
            <p className="text-[#86868b] mb-2">
              Looking for quick answers?
            </p>
            <a href="/pricing#faq" className="text-[#0071e3] hover:underline font-medium">
              Check our FAQ →
            </a>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
