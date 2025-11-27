import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <main className="pt-32 pb-20">
        <div className="container-apple">
          <div className="max-w-3xl mx-auto">
            <h1 className="display-medium text-[#1d1d1f] mb-4">Terms of Service</h1>
            <p className="body-large text-[#86868b] mb-12">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <div className="prose prose-lg max-w-none">
              <section className="mb-12">
                <h2 className="title-1 text-[#1d1d1f] mb-4">1. Acceptance of Terms</h2>
                <p className="body text-[#86868b] leading-relaxed">
                  By accessing or using LifeØS ("Service"), you agree to be bound by these Terms of 
                  Service. If you do not agree to these terms, do not use the Service.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="title-1 text-[#1d1d1f] mb-4">2. Description of Service</h2>
                <p className="body text-[#86868b] leading-relaxed">
                  LifeØS provides AI-powered compliance analysis for documents including employee 
                  handbooks, safety policies, and other business documents. Our analysis identifies 
                  potential compliance gaps and provides recommendations for remediation.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="title-1 text-[#1d1d1f] mb-4">3. Important Disclaimer</h2>
                <div className="p-6 bg-[#ff9500]/10 rounded-2xl border border-[#ff9500]/20">
                  <p className="body text-[#1d1d1f] leading-relaxed">
                    <strong>LifeØS is not a law firm and does not provide legal advice.</strong> Our 
                    analysis is for informational purposes only. You should always consult with 
                    qualified legal counsel before making compliance decisions. We are not responsible 
                    for any fines, penalties, or other consequences resulting from actions taken or 
                    not taken based on our analysis.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="title-1 text-[#1d1d1f] mb-4">4. User Responsibilities</h2>
                <ul className="list-disc list-inside space-y-2 text-[#86868b]">
                  <li>You must be at least 18 years old to use the Service</li>
                  <li>You are responsible for maintaining the confidentiality of your account</li>
                  <li>You must not upload documents containing illegal content</li>
                  <li>You must not attempt to reverse engineer or exploit the Service</li>
                  <li>You must have the right to upload any documents you submit for analysis</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="title-1 text-[#1d1d1f] mb-4">5. Payment Terms</h2>
                <p className="body text-[#86868b] leading-relaxed">
                  Subscription fees are billed in advance on a monthly or annual basis. You can cancel 
                  your subscription at any time, but refunds are only provided as specified in our 
                  refund policy. We reserve the right to change our pricing with 30 days notice.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="title-1 text-[#1d1d1f] mb-4">6. Intellectual Property</h2>
                <p className="body text-[#86868b] leading-relaxed">
                  You retain ownership of all documents you upload. We retain ownership of our Service, 
                  including all AI models, algorithms, and software. Analysis results generated for 
                  you are licensed to you for your business use.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="title-1 text-[#1d1d1f] mb-4">7. Limitation of Liability</h2>
                <p className="body text-[#86868b] leading-relaxed">
                  To the maximum extent permitted by law, LifeØS shall not be liable for any indirect, 
                  incidental, special, consequential, or punitive damages, including but not limited 
                  to fines, penalties, or legal fees arising from your use of or reliance on the Service.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="title-1 text-[#1d1d1f] mb-4">8. Changes to Terms</h2>
                <p className="body text-[#86868b] leading-relaxed">
                  We may modify these Terms at any time. We will notify you of material changes via 
                  email or through the Service. Your continued use of the Service after changes 
                  constitutes acceptance of the new Terms.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="title-1 text-[#1d1d1f] mb-4">9. Contact</h2>
                <p className="body text-[#86868b] leading-relaxed">
                  For questions about these Terms, please contact us at{' '}
                  <a href="mailto:neville@rayze.xyz" className="text-[#0071e3] hover:underline">
                    neville@rayze.xyz
                  </a>.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

