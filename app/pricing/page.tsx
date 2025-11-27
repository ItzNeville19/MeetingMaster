'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For small businesses getting started with compliance',
    priceMonthly: 99,
    priceAnnual: 79,
    features: [
      '5 document analyses per month',
      'Full risk assessment',
      'PDF report downloads',
      '7-day action plans',
      'Email support',
    ],
    highlighted: false,
    cta: 'Get Started',
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'For growing teams with multiple locations',
    priceMonthly: 299,
    priceAnnual: 249,
    features: [
      '20 document analyses per month',
      'Everything in Starter, plus:',
      'Risk trend charts & insights',
      'Weekly compliance digest',
      'Up to 5 team members',
      'Up to 3 locations',
      'Priority support',
    ],
    highlighted: true,
    cta: 'Get Started',
    badge: 'Most Popular',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For enterprises with complex compliance needs',
    priceMonthly: 799,
    priceAnnual: 649,
    features: [
      'Unlimited document analyses',
      'Everything in Growth, plus:',
      'Predictive risk alerts',
      'Unlimited team members',
      'Unlimited locations',
      'Full team dashboard',
      'Custom integrations (API)',
      'Dedicated account manager',
      'SLA guarantee',
      '24/7 priority support',
    ],
    highlighted: false,
    cta: 'Contact Sales',
  },
];

const faqs = [
  {
    question: 'Can I try LifeØS before subscribing?',
    answer: 'Yes! You can analyze one document for free, no credit card required. This gives you a full report so you can see exactly what you\'ll get.',
  },
  {
    question: 'What types of documents can I upload?',
    answer: 'LifeØS analyzes PDFs, images (PNG, JPG, WEBP), and scanned documents. Common use cases include employee handbooks, safety manuals, HIPAA policies, permits, and training records.',
  },
  {
    question: 'How accurate is the AI analysis?',
    answer: 'Our AI cross-references documents against 50+ federal and state regulations using GPT-4o and our proprietary Pal Nexus model. While highly accurate, we recommend reviewing findings with legal counsel before implementing changes.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use AES-256 encryption for all uploads, and documents are automatically deleted within 24 hours of analysis. We\'re SOC 2 compliant and never share your data.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, all plans are month-to-month with no long-term contracts. Cancel anytime from your dashboard, and you\'ll retain access until the end of your billing period.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 14-day money-back guarantee. If you\'re not satisfied with LifeØS, contact us within 14 days for a full refund.',
  },
];

const comparisonFeatures = [
  { name: 'Document analyses', starter: '5/month', growth: '20/month', pro: 'Unlimited' },
  { name: 'Risk assessment', starter: true, growth: true, pro: true },
  { name: 'PDF reports', starter: true, growth: true, pro: true },
  { name: '7-day action plans', starter: true, growth: true, pro: true },
  { name: 'Risk trend charts', starter: false, growth: true, pro: true },
  { name: 'Weekly digest', starter: false, growth: true, pro: true },
  { name: 'Team members', starter: '1', growth: '5', pro: 'Unlimited' },
  { name: 'Locations', starter: '1', growth: '3', pro: 'Unlimited' },
  { name: 'Predictive alerts', starter: false, growth: false, pro: true },
  { name: 'API access', starter: false, growth: false, pro: true },
  { name: 'Dedicated manager', starter: false, growth: false, pro: true },
  { name: 'SLA guarantee', starter: false, growth: false, pro: true },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = (planId: string) => {
    setLoading(planId);
    
    const plan = plans.find(p => p.id === planId);
    const price = annual ? plan?.priceAnnual : plan?.priceMonthly;
    const billing = annual ? 'annual' : 'monthly';
    
    // Open email to purchase
    const subject = encodeURIComponent(`[LifeØS] Subscribe to ${plan?.name} Plan`);
    const body = encodeURIComponent(
`Hi LifeØS Team,

I would like to subscribe to the ${plan?.name} plan.

Plan: ${plan?.name}
Price: $${price}/month (${billing} billing)
${annual ? `Annual total: $${(price || 0) * 12}/year` : ''}

Please send me the payment link.

Thanks!`
    );
    
    window.location.href = `mailto:neville@rayze.xyz?subject=${subject}&body=${body}`;
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <main className="pt-24">
        {/* Hero */}
        <section className="py-16 px-6">
          <motion.div 
            className="max-w-[800px] mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-[48px] md:text-[56px] font-semibold text-[#1d1d1f] mb-6">
              Simple, transparent pricing
            </h1>
            <p className="text-[20px] text-[#86868b] mb-10">
              Choose the plan that fits your compliance needs. All plans include a 14-day money-back guarantee.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 p-1.5 bg-[#f5f5f7] rounded-full">
              <button
                onClick={() => setAnnual(false)}
                className={`px-6 py-2.5 rounded-full text-[15px] font-medium transition-all ${
                  !annual ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b]'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-6 py-2.5 rounded-full text-[15px] font-medium transition-all ${
                  annual ? 'bg-white text-[#1d1d1f] shadow-sm' : 'text-[#86868b]'
                }`}
              >
                Annual
                <span className="ml-2 text-[12px] text-[#34c759] font-semibold">Save 20%</span>
              </button>
            </div>
          </motion.div>
        </section>

        {/* Pricing Cards */}
        <section className="py-8 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8 }}
                  className={`relative p-8 rounded-3xl transition-shadow ${
                    plan.highlighted
                      ? 'bg-[#1d1d1f] text-white ring-4 ring-[#0071e3]'
                      : 'bg-white border border-[#e5e5ea]'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#0071e3] text-white text-[12px] font-semibold rounded-full">
                      {plan.badge}
                    </span>
                  )}

                  <div className="mb-6">
                    <h3 className={`text-[24px] font-semibold mb-2 ${plan.highlighted ? 'text-white' : 'text-[#1d1d1f]'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-[14px] ${plan.highlighted ? 'text-white/60' : 'text-[#86868b]'}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-[48px] font-bold ${plan.highlighted ? 'text-white' : 'text-[#1d1d1f]'}`}>
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={annual ? 'annual' : 'monthly'}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            ${annual ? plan.priceAnnual : plan.priceMonthly}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                      <span className={plan.highlighted ? 'text-white/60' : 'text-[#86868b]'}>/month</span>
                    </div>
                    {annual && (
                      <p className={`text-[13px] mt-1 ${plan.highlighted ? 'text-white/40' : 'text-[#86868b]'}`}>
                        Billed annually (${(plan.priceAnnual * 12).toLocaleString()}/year)
                      </p>
                    )}
                  </div>

                  <motion.button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading === plan.id}
                    className={`w-full py-4 rounded-full font-semibold text-[15px] transition-all mb-8 ${
                      plan.highlighted
                        ? 'bg-[#0071e3] text-white hover:bg-[#0077ed]'
                        : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#eee]'
                    } disabled:opacity-50`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      plan.cta
                    )}
                  </motion.button>

                  <ul className="space-y-3">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <svg className={`w-5 h-5 flex-shrink-0 ${
                          plan.highlighted ? 'text-[#0071e3]' : 'text-[#34c759]'
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={`text-[14px] ${plan.highlighted ? 'text-white/80' : 'text-[#1d1d1f]'}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="py-20 px-6 bg-[#f5f5f7]">
          <div className="max-w-[1000px] mx-auto">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-[36px] font-semibold text-[#1d1d1f] mb-4">
                Compare plans
              </h2>
              <p className="text-[18px] text-[#86868b]">
                Every feature you need to stay compliant
              </p>
            </motion.div>

            <div className="bg-white rounded-3xl overflow-hidden border border-[#e5e5ea]">
              {/* Header */}
              <div className="grid grid-cols-4 gap-4 p-6 bg-[#fafafa] border-b border-[#e5e5ea]">
                <div className="font-semibold text-[#1d1d1f]">Feature</div>
                <div className="text-center font-semibold text-[#1d1d1f]">Starter</div>
                <div className="text-center font-semibold text-[#0071e3]">Growth</div>
                <div className="text-center font-semibold text-[#1d1d1f]">Pro</div>
              </div>

              {/* Rows */}
              {comparisonFeatures.map((feature, i) => (
                <div key={i} className="grid grid-cols-4 gap-4 p-5 border-b border-[#e5e5ea] last:border-0">
                  <div className="text-[14px] text-[#1d1d1f]">{feature.name}</div>
                  <div className="text-center">
                    {typeof feature.starter === 'boolean' ? (
                      feature.starter ? (
                        <svg className="w-5 h-5 text-[#34c759] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-[#e5e5ea] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )
                    ) : (
                      <span className="text-[14px] text-[#86868b]">{feature.starter}</span>
                    )}
                  </div>
                  <div className="text-center">
                    {typeof feature.growth === 'boolean' ? (
                      feature.growth ? (
                        <svg className="w-5 h-5 text-[#0071e3] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-[#e5e5ea] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )
                    ) : (
                      <span className="text-[14px] font-medium text-[#0071e3]">{feature.growth}</span>
                    )}
                  </div>
                  <div className="text-center">
                    {typeof feature.pro === 'boolean' ? (
                      feature.pro ? (
                        <svg className="w-5 h-5 text-[#34c759] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-[#e5e5ea] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )
                    ) : (
                      <span className="text-[14px] text-[#86868b]">{feature.pro}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-20 px-6">
          <div className="max-w-[700px] mx-auto">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-[36px] font-semibold text-[#1d1d1f] mb-4">
                Frequently asked questions
              </h2>
            </motion.div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="border border-[#e5e5ea] rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-[#fafafa] transition-colors"
                  >
                    <span className="font-medium text-[#1d1d1f]">{faq.question}</span>
                    <motion.svg 
                      className="w-5 h-5 text-[#86868b] flex-shrink-0"
                      animate={{ rotate: expandedFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </button>
                  <AnimatePresence>
                    {expandedFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-[15px] text-[#86868b] leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-16 px-6 bg-[#f5f5f7]">
          <div className="max-w-[800px] mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { icon: '🔒', label: 'SOC 2 Compliant' },
                { icon: '💳', label: 'Secure Payments' },
                { icon: '📅', label: '14-Day Guarantee' },
                { icon: '🚫', label: 'Cancel Anytime' },
              ].map((badge, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <span className="text-3xl mb-2 block">{badge.icon}</span>
                  <span className="text-[14px] font-medium text-[#1d1d1f]">{badge.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6">
          <motion.div 
            className="max-w-[600px] mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-[36px] font-semibold text-[#1d1d1f] mb-4">
              Ready to get compliant?
            </h2>
            <p className="text-[18px] text-[#86868b] mb-8">
              Start with a free analysis. No credit card required.
            </p>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/upload"
                className="inline-flex items-center justify-center px-10 py-5 bg-[#0071e3] text-white text-[17px] font-medium rounded-full shadow-lg shadow-[#0071e3]/25 hover:shadow-xl hover:shadow-[#0071e3]/30 transition-all"
              >
                Start Free Analysis
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
