'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

interface PrivacyAgreementModalProps {
  onAgree: () => void;
  onCancel: () => void;
  isBlocking?: boolean; // If true, user cannot proceed without agreeing
}

export default function PrivacyAgreementModal({ onAgree, onCancel, isBlocking = true }: PrivacyAgreementModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { user } = useUser();

  const handleAgree = async () => {
    const agreementDate = new Date().toISOString();
    const agreementVersion = '2.0'; // Version for tracking changes
    
    // Store in localStorage immediately for UI (non-blocking)
    if (dontShowAgain) {
      localStorage.setItem('privacyPolicyAgreed', 'true');
      localStorage.setItem('privacyPolicyAgreedDate', agreementDate);
      localStorage.setItem('privacyPolicyAgreedVersion', agreementVersion);
    }
    
    // Always store the agreement date (even if not "don't show again")
    localStorage.setItem('privacyPolicyLastAgreed', agreementDate);
    
    // Save to database first, then close modal
    if (user) {
      try {
        // Get IP address and user agent for legal records
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        const ipAddress = ipData.ip || 'unknown';
        const userAgent = navigator.userAgent || 'unknown';
        
        // Save agreement and wait for response
        const saveRes = await fetch('/api/save-privacy-agreement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agreed: true,
              date: agreementDate,
              dontShowAgain: dontShowAgain,
              userEmail: user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddressId,
              userId: user.id,
              agreementVersion: agreementVersion,
              ipAddress: ipAddress,
              userAgent: userAgent,
            }),
          });
          
        if (!saveRes.ok) {
          console.error('Failed to save privacy agreement:', await saveRes.text());
        } else {
          console.log('✅ Privacy agreement saved successfully');
        }
        
        // Close modal after successful save
        onAgree();
      } catch (error) {
        // If IP fetch fails, still save agreement without IP
        try {
          const saveRes = await fetch('/api/save-privacy-agreement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agreed: true,
              date: agreementDate,
              dontShowAgain: dontShowAgain,
              userEmail: user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddressId,
              userId: user.id,
              agreementVersion: agreementVersion,
              ipAddress: 'unknown',
              userAgent: navigator.userAgent || 'unknown',
            }),
          });
          
          if (!saveRes.ok) {
            console.error('Failed to save privacy agreement:', await saveRes.text());
          } else {
            console.log('✅ Privacy agreement saved successfully');
          }
        } catch (saveError) {
          console.error('Failed to save privacy agreement:', saveError);
        }
        
        // Close modal after save attempt (even if it failed)
        onAgree();
      }
    } else {
      // No user - just close modal
      onAgree();
    }
  };

  const handleCancel = () => {
    if (isBlocking) {
      // If blocking, don't allow cancel - they must agree
      alert('You must agree to the Privacy Policy and Terms of Service to use LifeØS. If you do not agree, please close this browser window.');
      return;
    }
    onCancel();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={isBlocking ? undefined : handleCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <h2 className="text-2xl font-semibold text-white mb-6">Privacy Policy & Terms of Service Agreement</h2>
          
          <div className="space-y-6 text-white/90 mb-8">
            <div className="border border-white/10 rounded-2xl p-6 bg-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">CRITICAL LEGAL DISCLAIMERS & LIMITATIONS OF LIABILITY</h3>
              <div className="space-y-4 text-[15px] leading-relaxed text-white/80">
                <div>
                  <p className="font-semibold text-white mb-2">1. NOT LEGAL ADVICE - INFORMATIONAL ONLY</p>
                  <p>LifeØS is NOT a law firm, legal service provider, or substitute for professional legal counsel. Our AI-powered analysis, document generation, and compliance tools are provided for INFORMATIONAL AND EDUCATIONAL PURPOSES ONLY. You MUST consult with qualified, licensed legal professionals before making any compliance decisions, implementing policies, or taking any actions based on our analysis or generated documents. LifeØS does not provide legal advice, legal opinions, or legal representation.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-white mb-2">2. NO WARRANTIES - USE AT YOUR OWN RISK</p>
                  <p>LIFEØS MAKES NO WARRANTIES, EXPRESS OR IMPLIED, REGARDING THE ACCURACY, COMPLETENESS, RELIABILITY, TIMELINESS, OR USEFULNESS OF OUR SERVICES, ANALYSIS, GENERATED DOCUMENTS, OR ANY INFORMATION PROVIDED. Information may be incomplete, outdated, incorrect, or contain errors. Our AI systems may generate inaccurate, incomplete, or misleading information. Documents may not comply with all applicable laws, regulations, or requirements. We do not warrant that our services will meet your requirements, be uninterrupted, secure, or error-free.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-white mb-2">3. ABSOLUTE LIMITATION OF LIABILITY - NO LIABILITY FOR ANY DAMAGES</p>
                  <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, LIFEØS, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND CONTRACTORS SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO:</p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>Fines, penalties, citations, or sanctions from regulatory agencies (OSHA, EEOC, DOL, state agencies, etc.)</li>
                    <li>Legal fees, attorney costs, or litigation expenses</li>
                    <li>Business losses, lost profits, lost revenue, or lost opportunities</li>
                    <li>Damages resulting from non-compliance with laws or regulations</li>
                    <li>Damages from inaccurate, incomplete, or incorrect analysis or documents</li>
                    <li>Damages from missing information, policies, or procedures</li>
                    <li>Damages from changes in laws, regulations, or requirements</li>
                    <li>Damages from reliance on our services, analysis, or generated documents</li>
                    <li>Damages from misinformation, errors, omissions, or inaccuracies</li>
                    <li>Damages from product failures, service interruptions, or technical issues</li>
                    <li>Damages from data loss, security breaches, or privacy violations</li>
                    <li>Any other damages, losses, or costs of any kind</li>
                  </ul>
                  <p className="mt-2">OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO LIFEØS IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER IS LESS.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-white mb-2">4. YOUR SOLE RESPONSIBILITY - YOU ASSUME ALL RISKS</p>
                  <p>YOU ARE SOLELY AND EXCLUSIVELY RESPONSIBLE FOR:</p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>Ensuring compliance with ALL applicable laws, regulations, and requirements</li>
                    <li>Verifying ALL information independently with qualified legal professionals</li>
                    <li>Reviewing, editing, and customizing ALL generated documents before use</li>
                    <li>Consulting with licensed attorneys, compliance professionals, and regulatory experts</li>
                    <li>Making all compliance decisions and implementing all policies</li>
                    <li>All consequences, damages, fines, penalties, and legal issues resulting from use of our services</li>
                    <li>All actions taken or not taken based on our analysis or documents</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-semibold text-white mb-2">5. NO GUARANTEES - NO PROMISES OF RESULTS</p>
                  <p>LIFEØS DOES NOT GUARANTEE, WARRANT, OR PROMISE THAT:</p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>Using our services will prevent fines, penalties, citations, or legal issues</li>
                    <li>Our analysis is accurate, complete, or correct</li>
                    <li>Generated documents will comply with all applicable laws or regulations</li>
                    <li>Our services will identify all compliance risks or issues</li>
                    <li>Our services will meet your specific needs or requirements</li>
                    <li>Our AI systems will generate accurate or useful information</li>
                    <li>Our services will be available, uninterrupted, or error-free</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-semibold text-white mb-2">6. AI-GENERATED CONTENT DISCLAIMER</p>
                  <p>Our services use artificial intelligence (AI) and machine learning technologies. AI-generated content, analysis, and documents:</p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>May contain errors, inaccuracies, or misinformation</li>
                    <li>May be incomplete, outdated, or incorrect</li>
                    <li>May not reflect current laws, regulations, or best practices</li>
                    <li>May not be suitable for your specific situation or jurisdiction</li>
                    <li>Must be reviewed, verified, and edited by qualified professionals before use</li>
                    <li>Should not be relied upon without independent verification</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-semibold text-white mb-2">7. THIRD-PARTY SERVICES & OUTSOURCING</p>
                  <p>LifeØS may use third-party services, contractors, vendors, or outsourcing partners to provide our services, including but not limited to AI providers, cloud services, data processors, and technical support. We are not responsible for the actions, errors, or failures of third parties. You acknowledge that our services may involve third-party processing and storage of your data.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-white mb-2">8. SERVICE QUALITY & AVAILABILITY</p>
                  <p>LifeØS does not guarantee the quality, accuracy, completeness, or availability of our services. Services may be unavailable, interrupted, or experience technical issues. Analysis may be delayed, incomplete, or inaccurate. Generated documents may be of poor quality, incomplete, or contain errors. You acknowledge and accept these limitations.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-white mb-2">9. NO REFUNDS FOR SERVICE QUALITY ISSUES</p>
                  <p>You acknowledge that dissatisfaction with service quality, accuracy, completeness, or results does not entitle you to refunds, credits, or compensation. LifeØS provides services "AS IS" without warranties or guarantees of quality or results.</p>
                </div>
                
                <div>
                  <p className="font-semibold text-white mb-2">10. INDEMNIFICATION</p>
                  <p>YOU AGREE TO INDEMNIFY, DEFEND, AND HOLD HARMLESS LifeØS, its affiliates, officers, directors, employees, agents, and contractors from and against ANY AND ALL claims, demands, losses, damages, liabilities, costs, and expenses (including reasonable attorney fees) arising from or related to:</p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>Your use of our services, analysis, or generated documents</li>
                    <li>Your failure to comply with laws, regulations, or requirements</li>
                    <li>Your reliance on our services without independent verification</li>
                    <li>Any actions taken or not taken based on our services</li>
                    <li>Any fines, penalties, or legal issues resulting from use of our services</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-semibold text-white mb-2">11. DISPUTE RESOLUTION & GOVERNING LAW</p>
                  <p>Any disputes arising from or related to these terms or our services shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You waive your right to a jury trial and to participate in class actions. These terms are governed by the laws of the State of Delaware, without regard to conflict of law principles.</p>
                </div>
              </div>
            </div>
            
            <div className="border border-white/10 rounded-2xl p-6 bg-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Privacy Policy</h3>
              <p className="text-[15px] leading-relaxed text-white/80 mb-3">
                By using LifeØS, you agree to our{' '}
                <Link href="/privacy" target="_blank" className="text-[#0071e3] hover:text-[#0077ed] underline">
                  Privacy Policy
                </Link>
                {' '}which describes how we collect, use, store, and protect your information. We may use third-party services, AI providers, and cloud storage. Your data may be processed and stored by third parties.
              </p>
            </div>

            <div className="border border-red-500/30 rounded-2xl p-6 bg-red-500/10">
              <p className="text-[15px] leading-relaxed text-white font-semibold mb-3">
                ⚠️ BY CLICKING "I AGREE", YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY ALL OF THE ABOVE TERMS, INCLUDING:
              </p>
              <ul className="list-disc list-outside ml-5 space-y-2 text-white/90">
                <li>LifeØS is NOT legal advice and you MUST consult with qualified legal professionals</li>
                <li>LifeØS makes NO warranties and provides services "AS IS"</li>
                <li>LifeØS is NOT liable for ANY damages, fines, penalties, or legal issues</li>
                <li>YOU are solely responsible for compliance and all consequences</li>
                <li>AI-generated content may contain errors, inaccuracies, or misinformation</li>
                <li>Services may involve third-party outsourcing and processing</li>
                <li>Service quality is not guaranteed and dissatisfaction does not entitle you to refunds</li>
                <li>You agree to indemnify and hold LifeØS harmless from all claims</li>
                <li>This agreement will be recorded for legal purposes with your IP address and user agent</li>
                <li>You cannot use LifeØS services without agreeing to these terms</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-3 mb-8 p-5 border border-white/10 rounded-2xl bg-white/5">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-5 h-5 mt-0.5 text-[#0071e3] rounded border-white/20 focus:ring-[#0071e3] focus:ring-2 cursor-pointer"
            />
            <label htmlFor="dontShowAgain" className="text-white/90 text-[15px] leading-relaxed cursor-pointer flex-1">
              Don't show this again (you may be prompted again in approximately one year for updated terms). I understand and agree to the Privacy Policy and Terms of Service.
            </label>
          </div>

          <div className="flex gap-4">
            {!isBlocking && (
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-3 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-colors text-[17px]"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleAgree}
              className={`${isBlocking ? 'w-full' : 'flex-1'} px-6 py-3 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors text-[17px]`}
            >
              I Agree - Continue to LifeØS
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
