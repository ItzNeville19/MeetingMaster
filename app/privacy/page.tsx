import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <main className="pt-32 pb-20">
        <div className="container-apple">
          <div className="max-w-3xl mx-auto">
            <h1 className="display-medium text-[#1d1d1f] mb-4">Privacy Policy</h1>
            <p className="body-large text-[#86868b] mb-12">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <div className="prose prose-lg max-w-none">
              <section className="mb-12">
                <h2 className="title-1 text-[#1d1d1f] mb-4">Overview</h2>
                <p className="body text-[#86868b] leading-relaxed">
                  At LifeØS ("we", "our", or "us"), we take your privacy seriously. This Privacy Policy 
                  explains how we collect, use, disclose, and safeguard your information when you use our 
                  AI-powered compliance analysis service.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="title-1 text-[#1d1d1f] mb-4">Information We Collect</h2>
                <div className="space-y-4 text-[#86868b]">
                  <p className="body leading-relaxed">
                    <strong className="text-[#1d1d1f]">Account Information:</strong> When you create an account, we collect your 
                    name, email address, and company information.
                  </p>
                  <p className="body leading-relaxed">
                    <strong className="text-[#1d1d1f]">Documents:</strong> When you upload documents for analysis, we temporarily 
                    process the content to provide our service. We do not permanently store document contents 
                    after analysis unless you explicitly save them to your account.
                  </p>
                  <p className="body leading-relaxed">
                    <strong className="text-[#1d1d1f]">Usage Data:</strong> We collect information about how you interact with our 
                    service, including features used, analysis results, and time spent on the platform.
                  </p>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="title-1 text-[#1d1d1f] mb-4">How We Use Your Information</h2>
                <ul className="list-disc list-inside space-y-2 text-[#86868b]">
                  <li>To provide and improve our compliance analysis service</li>
                  <li>To communicate with you about your account and our services</li>
                  <li>To detect and prevent fraud and abuse</li>
                  <li>To comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="title-1 text-[#1d1d1f] mb-4">Data Security</h2>
                <p className="body text-[#86868b] leading-relaxed">
                  We implement industry-standard security measures to protect your data, including 
                  encryption in transit and at rest, access controls, and regular security audits. 
                  However, no method of transmission over the Internet is 100% secure.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="title-1 text-[#1d1d1f] mb-4">Data Retention</h2>
                <p className="body text-[#86868b] leading-relaxed">
                  We retain your account information for as long as your account is active. Analysis 
                  results are retained according to your subscription plan. You can request deletion 
                  of your data at any time by contacting us.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="title-1 text-[#1d1d1f] mb-4">Your Rights</h2>
                <p className="body text-[#86868b] leading-relaxed">
                  Depending on your location, you may have rights to access, correct, delete, or port 
                  your personal data. To exercise these rights, please contact us at{' '}
                  <a href="mailto:neville@rayze.xyz" className="text-[#0071e3] hover:underline">
                    neville@rayze.xyz
                  </a>.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="title-1 text-[#1d1d1f] mb-4">Contact Us</h2>
                <p className="body text-[#86868b] leading-relaxed">
                  If you have questions about this Privacy Policy, please contact us at{' '}
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

