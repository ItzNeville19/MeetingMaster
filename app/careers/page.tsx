'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export default function CareersPage() {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  const positions = [
    {
      title: 'Senior Compliance AI Engineer',
      location: 'Remote',
      type: 'Part-time',
      description: 'Build and improve our AI compliance analysis engine. Work with GPT-4, OCR, and regulatory databases.',
      salary: '$45 - $75/hour (varies based on experience and project)',
      hours: '15-25 hours/week (flexible schedule)',
      requirements: '5+ years AI/ML experience, Python, TensorFlow/PyTorch, compliance domain knowledge'
    },
    {
      title: 'Compliance Analyst',
      location: 'Remote',
      type: 'Part-time',
      description: 'Help train our AI models and validate compliance assessments. Deep knowledge of OSHA, HIPAA, ADA required.',
      salary: '$30 - $50/hour (varies based on experience and project)',
      hours: '10-20 hours/week (flexible schedule)',
      requirements: '3+ years compliance experience, regulatory knowledge, attention to detail'
    },
    {
      title: 'Full-Stack Engineer',
      location: 'Remote',
      type: 'Part-time',
      description: 'Build beautiful, fast user experiences. Next.js, TypeScript, Firebase. Help scale our platform.',
      salary: '$40 - $70/hour (varies based on experience and project)',
      hours: '15-25 hours/week (flexible schedule)',
      requirements: '5+ years full-stack experience, React, Node.js, system design'
    },
    {
      title: 'Customer Success Manager',
      location: 'Remote',
      type: 'Part-time',
      description: 'Help customers succeed with LifeØS. Onboard new users, provide guidance, gather feedback.',
      salary: '$25 - $45/hour (varies based on experience and project)',
      hours: '10-20 hours/week (flexible schedule)',
      requirements: '3+ years customer success, SaaS experience, excellent communication'
    },
    {
      title: 'Senior Software Engineer',
      location: 'Remote',
      type: 'Part-time',
      description: 'Lead technical initiatives, architect scalable systems, mentor engineers. Drive innovation in our compliance platform.',
      salary: '$50 - $85/hour (varies based on experience and project)',
      hours: '20-30 hours/week (flexible schedule)',
      requirements: '7+ years software engineering, leadership experience, distributed systems, cloud architecture'
    },
    {
      title: 'Musician Performer & Content Creator',
      location: 'Remote/Hybrid',
      type: 'Part-time',
      description: 'Create original music content, perform live sessions, edit and post engaging videos. Build our brand through creative excellence.',
      salary: '$35 - $65/hour (varies based on experience, project scope, and performance quality)',
      hours: '15-25 hours/week (flexible schedule, performance-based)',
      requirements: 'Professional music performance ability, video editing skills (Premiere/Final Cut), social media expertise, original composition skills',
      special: true // Mark as special for extra treatment
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <main className="pt-24 pb-20">
        <div className="max-w-[980px] mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-[48px] md:text-[64px] font-bold text-[#1d1d1f] mb-6">
              Join the <span className="bg-gradient-to-r from-[#0071e3] to-[#5856d6] bg-clip-text text-transparent">Team</span>
            </h1>
            <p className="text-[20px] text-[#86868b] max-w-2xl mx-auto">
              We're building the future of compliance. Help us make enterprise-grade compliance accessible to every business.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-8">Open Positions</h2>
            <div className="space-y-4">
              {positions.map((position, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className={`rounded-2xl p-6 transition-all ${
                    position.special 
                      ? 'bg-gradient-to-br from-[#ff9500] to-[#ff3b30] text-white' 
                      : 'bg-[#f5f5f7] hover:bg-[#e8e8ed]'
                  } ${selectedPosition === position.title ? 'ring-2 ring-[#0071e3]' : ''}`}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`text-xl font-semibold ${position.special ? 'text-white' : 'text-[#1d1d1f]'}`}>
                            {position.title}
                          </h3>
                          {position.special && (
                            <span className="px-2 py-1 bg-white/20 text-white text-xs font-bold rounded">PREMIUM</span>
                          )}
                        </div>
                        <div className={`flex flex-wrap gap-3 text-sm mb-3 ${position.special ? 'text-white/80' : 'text-[#86868b]'}`}>
                          <span>{position.location}</span>
                          <span>·</span>
                          <span>{position.type}</span>
                        </div>
                        <p className={position.special ? 'text-white/90' : 'text-[#1d1d1f]'}>{position.description}</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSelectedPosition(selectedPosition === position.title ? null : position.title)}
                          className={`px-4 py-2 rounded-full font-medium transition-colors ${
                            position.special
                              ? 'bg-white/20 text-white hover:bg-white/30'
                              : 'bg-white text-[#0071e3] hover:bg-[#f5f5f7]'
                          }`}
                        >
                          {selectedPosition === position.title ? 'Hide Details' : 'View Details'}
                        </button>
                        <Link
                          href={`/careers/test?position=${encodeURIComponent(position.title)}`}
                          className={`px-6 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${
                            position.special
                              ? 'bg-white text-[#ff3b30] hover:bg-white/90'
                              : 'bg-[#0071e3] text-white hover:bg-[#0077ed]'
                          }`}
                        >
                          Apply Now
                        </Link>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {selectedPosition === position.title && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`overflow-hidden rounded-xl p-4 ${
                            position.special ? 'bg-white/10' : 'bg-white'
                          }`}
                        >
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className={`font-semibold mb-2 ${position.special ? 'text-white' : 'text-[#1d1d1f]'}`}>
                                Compensation
                              </h4>
                              <p className={position.special ? 'text-white/90' : 'text-[#86868b]'}>{position.salary}</p>
                              <p className={`text-xs mt-1 italic ${position.special ? 'text-white/70' : 'text-[#86868b]'}`}>
                                *Pay rates vary based on project scope, experience, and performance
                              </p>
                            </div>
                            <div>
                              <h4 className={`font-semibold mb-2 ${position.special ? 'text-white' : 'text-[#1d1d1f]'}`}>
                                Hours
                              </h4>
                              <p className={position.special ? 'text-white/90' : 'text-[#86868b]'}>{position.hours}</p>
                            </div>
                            <div className="md:col-span-2">
                              <h4 className={`font-semibold mb-2 ${position.special ? 'text-white' : 'text-[#1d1d1f]'}`}>
                                Requirements
                              </h4>
                              <p className={position.special ? 'text-white/90' : 'text-[#86868b]'}>{position.requirements}</p>
                            </div>
                            {position.special && (
                              <div className="md:col-span-2">
                                <p className="text-white/80 text-sm italic">
                                  🎵 This position requires exceptional musical talent and content creation skills. 
                                  The assessment is comprehensive (30 questions) and designed to evaluate both technical proficiency and creative ability.
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-[#0071e3] to-[#5856d6] rounded-3xl p-12 text-center text-white"
          >
            <h2 className="text-3xl font-bold mb-4">Don't see a role that fits?</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              We're always looking for talented people. Send us your resume and tell us how you'd like to contribute.
            </p>
            <a
              href="mailto:neville@rayze.xyz?subject=General Application"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#0071e3] rounded-full font-semibold hover:bg-white/90 transition-colors"
            >
              Send General Application
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

