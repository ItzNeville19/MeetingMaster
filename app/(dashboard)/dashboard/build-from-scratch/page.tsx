'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '@/components/NavBar';
import { useUser } from '@clerk/nextjs';
import PrivacyAgreementModal from '@/components/PrivacyAgreementModal';

interface BusinessInfo {
  // Basic Info
  businessName: string;
  industry: string;
  employeeCount: string;
  locations: string;
  state: string;
  businessStructure: string;
  yearEstablished: string;
  websiteUrl: string; // NEW: Website URL to gather business information
  
  // Work Environment
  workEnvironment: string[];
  hasRemoteWorkers: boolean;
  hasWarehouse: boolean;
  hasOffice: boolean;
  hasRetailSpace: boolean;
  hasConstructionSites: boolean;
  
  // Job Roles
  jobRoles: string[];
  hasHourlyEmployees: boolean;
  hasSalariedEmployees: boolean;
  hasContractors: boolean;
  hasExemptEmployees: boolean;
  
  // Pay & Benefits
  payFrequency: string;
  offersHealthInsurance: boolean;
  offersRetirementPlan: boolean;
  offersPaidTimeOff: boolean;
  offersSickLeave: boolean;
  
  // Policies
  hasEmployeeHandbook: boolean;
  hasSafetyManual: boolean;
  hasPolicies: boolean;
  
  // Compliance
  complianceConcerns: string[];
  hasOSHARequirements: boolean;
  hasHIPAARequirements: boolean;
  hasDataPrivacyConcerns: boolean;
  
  // Specific Details
  specificSafetyConcerns: string;
  specificPoliciesNeeded: string;
  industrySpecificRequirements: string;
  stateSpecificNeeds: string;
}

const TOTAL_STEPS = 7;

export default function BuildFromScratchPage() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [needsMoreInfo, setNeedsMoreInfo] = useState(false);
  const [showJCChat, setShowJCChat] = useState(false);
  const [partialDocuments, setPartialDocuments] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string; content: string}>>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessName: '',
    industry: '',
    employeeCount: '',
    locations: '',
    state: '',
    businessStructure: '',
    yearEstablished: '',
    websiteUrl: '',
    workEnvironment: [],
    hasRemoteWorkers: false,
    hasWarehouse: false,
    hasOffice: false,
    hasRetailSpace: false,
    hasConstructionSites: false,
    jobRoles: [],
    hasHourlyEmployees: false,
    hasSalariedEmployees: false,
    hasContractors: false,
    hasExemptEmployees: false,
    payFrequency: '',
    offersHealthInsurance: false,
    offersRetirementPlan: false,
    offersPaidTimeOff: false,
    offersSickLeave: false,
    hasEmployeeHandbook: false,
    hasSafetyManual: false,
    hasPolicies: false,
    complianceConcerns: [],
    hasOSHARequirements: false,
    hasHIPAARequirements: false,
    hasDataPrivacyConcerns: false,
    specificSafetyConcerns: '',
    specificPoliciesNeeded: '',
    industrySpecificRequirements: '',
    stateSpecificNeeds: '',
  });

  const industries = [
    'Retail',
    'Restaurant/Food Service',
    'Healthcare',
    'Construction',
    'Manufacturing',
    'Professional Services',
    'Technology',
    'Hospitality',
    'Education',
    'Transportation/Logistics',
    'Real Estate',
    'Financial Services',
    'Other',
  ];

  const employeeCounts = [
    '1-5 employees',
    '6-10 employees',
    '11-25 employees',
    '26-50 employees',
    '51-100 employees',
    '100+ employees',
  ];

  const businessStructures = [
    'Sole Proprietorship',
    'LLC',
    'Corporation (C-Corp)',
    'S-Corporation',
    'Partnership',
    'Other',
  ];

  const workEnvironments = [
    'Office',
    'Warehouse',
    'Retail Store',
    'Restaurant',
    'Construction Site',
    'Manufacturing Facility',
    'Healthcare Facility',
    'Remote/Home Office',
    'Field Work',
    'Other',
  ];

  const jobRoles = [
    'Management/Executive',
    'Administrative',
    'Sales',
    'Customer Service',
    'Warehouse/Logistics',
    'Manufacturing/Production',
    'Construction',
    'Healthcare Workers',
    'Food Service',
    'IT/Technology',
    'HR',
    'Accounting/Finance',
    'Other',
  ];

  const payFrequencies = [
    'Weekly',
    'Bi-weekly',
    'Semi-monthly',
    'Monthly',
  ];

  const complianceAreas = [
    'OSHA Workplace Safety',
    'HIPAA Privacy & Security',
    'ADA Accommodations',
    'FLSA Wage & Hour',
    'FMLA Leave',
    'EEOC Anti-Discrimination',
    'State-Specific Requirements',
    'Industry Regulations',
    'Data Privacy',
    'Workers Compensation',
  ];

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    // CRITICAL: Check privacy agreement FIRST before allowing generation
    try {
      const agreementRes = await fetch('/api/get-privacy-agreements');
      if (agreementRes.ok) {
        const agreementData = await agreementRes.json();
        const hasAgreed = agreementData.agreements && agreementData.agreements.length > 0 && 
          agreementData.agreements.some((a: any) => a.agreed === true);
        
        if (!hasAgreed) {
          // User has NOT agreed - BLOCK generation and show modal
          console.log('[BuildFromScratch] User has not agreed to privacy policy, blocking generation...');
          setPendingSubmit(true);
          setShowPrivacyModal(true);
          return;
        }
      }
    } catch (e) {
      console.warn('[BuildFromScratch] Error checking Supabase privacy agreement, checking fallbacks...', e);
    }
    
    // Fallback: Check localStorage and Clerk metadata
    const privacyAgreed = localStorage.getItem('privacyPolicyAgreed') === 'true';
    const userMetadata = user?.publicMetadata as any;
    const metadataAgreed = userMetadata?.privacyPolicyAgreed === true;
    
    if (!privacyAgreed && !metadataAgreed) {
      // User has NOT agreed - BLOCK generation and show modal
      console.log('[BuildFromScratch] User has not agreed to privacy policy, blocking generation...');
      setPendingSubmit(true);
      setShowPrivacyModal(true);
      return;
    }
    
    // Prevent multiple submissions
    if (loading) {
      console.warn('Generation already in progress, ignoring duplicate submit');
      return;
    }
    
    setLoading(true);
    setGenerationProgress(0);
    setGenerationMessage('Preparing your customized documents...');
    const processStartTime = Date.now();
    setStartTime(processStartTime);
    const initialEstimateSeconds = 600; // 10 minutes initial
    setEstimatedTimeRemaining(initialEstimateSeconds);
    
    // Realistic progress simulation with stages
    const stages = [
      { target: 15, duration: 15000, message: 'Reviewing your business information...' },
      { target: 35, duration: 120000, message: 'Generating your employee handbook based on your answers (this may take 2-3 minutes)...' },
      { target: 60, duration: 180000, message: 'Creating your safety manual and compliance policies from scratch...' },
      { target: 80, duration: 120000, message: 'Customizing documents for your industry and state requirements...' },
      { target: 95, duration: 60000, message: 'Finalizing your customized documents...' },
    ];
    
    let currentStageIndex = 0;
    let currentProgress = 0;
    let apiCompleted = false;
    let progressInterval: NodeJS.Timeout | null = null;
    
    // Smooth progress updates
    progressInterval = setInterval(() => {
      const elapsed = Date.now() - processStartTime;
      const currentStage = stages[currentStageIndex];
      
      if (currentStage && !apiCompleted) {
        const prevStagesDuration = currentStageIndex > 0 ? stages.slice(0, currentStageIndex).reduce((sum, s) => sum + s.duration, 0) : 0;
        const stageElapsed = elapsed - prevStagesDuration;
        const prevStageTarget = currentStageIndex > 0 ? stages[currentStageIndex - 1].target : 0;
        const stageProgress = Math.min((stageElapsed / currentStage.duration) * (currentStage.target - prevStageTarget), currentStage.target - prevStageTarget);
        
        // Smooth increment - never jump, always increase gradually
        const targetProgress = prevStageTarget + stageProgress;
        // Ensure progress always increases (never decreases or stays stuck)
        // If we're at 0 or very low, ensure we start moving immediately
        const minIncrement = currentProgress < 1 ? 0.3 : 0.2;
        const increment = Math.max(minIncrement, Math.min(0.3, targetProgress - currentProgress));
        currentProgress = Math.min(currentProgress + increment, targetProgress);
        setGenerationMessage(currentStage.message);
        
        // Move to next stage if target reached
        if (currentProgress >= currentStage.target && currentStageIndex < stages.length - 1) {
          currentStageIndex++;
        }
      } else if (apiCompleted && currentProgress < 95) {
        // After API completes, continue to generation stage smoothly
        const prevStagesDuration = stages.slice(0, stages.length - 1).reduce((sum, s) => sum + s.duration, 0);
        const stageElapsed = Math.max(0, elapsed - prevStagesDuration);
        const stageProgress = 80 + Math.min((stageElapsed / stages[stages.length - 1].duration) * 15, 15);
        // Smooth increment towards target - ensure it always increases
        const targetProgress = Math.min(stageProgress, 95);
        // Always increment by at least 0.1% to prevent getting stuck
        const increment = Math.max(0.1, Math.min(0.3, targetProgress - currentProgress));
        currentProgress = Math.min(currentProgress + increment, targetProgress);
        
        setGenerationMessage('Finalizing documents...');
      } else if (apiCompleted && currentProgress >= 95 && currentProgress < 100) {
        // Final stage - complete to 100% smoothly - ensure it always increases
        const targetProgress = 100;
        // Always increment by at least 0.1% to prevent getting stuck
        const increment = Math.max(0.1, Math.min(0.3, targetProgress - currentProgress));
        currentProgress = Math.min(currentProgress + increment, targetProgress);
        
        // If near 100%, complete it
        if (currentProgress >= 99.5) {
          currentProgress = 100;
        }
        
        setGenerationMessage('Documents generated successfully!');
        
        if (currentProgress >= 100) {
          if (progressInterval) clearInterval(progressInterval);
          setEstimatedTimeRemaining(0);
        }
      }
      
      // Update estimated time remaining - SIMPLE countdown that NEVER goes up
      const elapsedSeconds = elapsed / 1000;
      
      // Simple approach: always count down from initial estimate based on elapsed time
      // This is the most reliable - it never goes up, only down
      const newEstimate = Math.max(0, initialEstimateSeconds - elapsedSeconds);
      
      // Only update if it's actually decreasing (never increase)
      const currentEstimate = estimatedTimeRemaining !== null ? estimatedTimeRemaining : initialEstimateSeconds;
      if (newEstimate < currentEstimate || estimatedTimeRemaining === null) {
        setEstimatedTimeRemaining(Math.max(0, Math.ceil(newEstimate)));
      }
      
      // Update display progress smoothly (already smoothed above, just sync)
      setGenerationProgress(Math.min(currentProgress, 100));
    }, 100);

    try {
      // Generate compliance documents using AI
      const response = await fetch('/api/generate-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessInfo,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        if (progressInterval) clearInterval(progressInterval);
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate documents');
      }

      const data = await response.json();
      
      // Check if more information is needed
      if (data.needsMoreInfo) {
        // Stop progress at 50% and show JC chat
        setGenerationProgress(50);
        setGenerationMessage('I need a bit more information to create the most comprehensive documents for you.');
        setNeedsMoreInfo(true);
        setPartialDocuments(data.partialDocuments || '');
        setShowJCChat(true);
        setConversationHistory([{
          role: 'assistant',
          content: data.message || 'I need a bit more information to create the most comprehensive documents for you. Let me ask you a few quick questions.'
        }]);
        apiCompleted = true; // Stop the progress simulation
        if (progressInterval) clearInterval(progressInterval);
        return; // Don't redirect - show chat instead
      }
      
      // Mark API as completed, but let progress continue naturally
      apiCompleted = true;
      
      // Store report in sessionStorage for immediate access
      const reportData = {
        id: data.reportId,
        reportId: data.reportId,
        fileName: `${businessInfo.businessName} - Generated Compliance Documents`,
        analysis: data.analysis,
        createdAt: new Date().toISOString(),
      };
      
      const sessionKey = `report_${data.reportId}`;
      sessionStorage.setItem(sessionKey, JSON.stringify(reportData));
      
      // Also save to local storage for persistence across browsers
      if (user?.id) {
        try {
          const localReportsKey = `lifeos_reports_${user.id}`;
          const existing = localStorage.getItem(localReportsKey);
          const reports: any[] = existing ? JSON.parse(existing) : [];
          const filtered = reports.filter(r => r.id !== data.reportId);
          const updated = [reportData, ...filtered].slice(0, 100);
          localStorage.setItem(localReportsKey, JSON.stringify(updated));
          console.log('[BuildFromScratch] Saved report to local storage');
        } catch (e) {
          console.warn('[BuildFromScratch] Error saving to local storage:', e);
        }
      }
      
      // Small delay to show completion and ensure Firestore save completes
      await new Promise(r => setTimeout(r, 1500));
      
      // Redirect to view the generated documents
      router.push(`/reports/${data.reportId}`);
    } catch (error) {
      console.error('Error generating documents:', error);
      if (progressInterval) clearInterval(progressInterval);
      setLoading(false);
      setGenerationProgress(0);
      setGenerationMessage('');
      setEstimatedTimeRemaining(null);
      setStartTime(null);
      alert(`Failed to generate documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const updateField = (field: keyof BusinessInfo, value: any) => {
    setBusinessInfo({ ...businessInfo, [field]: value });
  };

  const toggleArrayItem = (field: keyof BusinessInfo, item: string) => {
    const current = businessInfo[field] as string[];
    if (current.includes(item)) {
      updateField(field, current.filter(i => i !== item));
    } else {
      updateField(field, [...current, item]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <NavBar />
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              Build Your Compliance System
            </h1>
            <p className="text-white/60 text-lg">
              We'll ask detailed questions to create perfectly customized documents for your business.
            </p>
          </motion.div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-white/40 mb-2">
              <span>Step {step} of {TOTAL_STEPS}</span>
              <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <motion.div
                className="bg-[#0071e3] h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#1d1d1f] rounded-3xl p-8 border border-white/10 mb-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#0071e3]/20 rounded-xl flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{generationMessage}</p>
                  <p className="text-white/50 text-sm">
                    {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
                      <span>~{Math.floor(estimatedTimeRemaining / 60)}:{('0' + (estimatedTimeRemaining % 60)).slice(-2)} remaining</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${generationProgress}%`,
                    background: `linear-gradient(to right, ${generationProgress < 40 ? '#0071e3' : generationProgress < 70 ? '#00c7ff' : '#34c759'}, ${generationProgress < 40 ? '#00c7ff' : generationProgress < 70 ? '#34c759' : '#34c759'})`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${generationProgress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <p className="text-center text-white/40 text-sm mt-4">{Math.round(generationProgress)}% complete</p>
            </motion.div>
          )}

          {/* Form Steps */}
          {!loading && (
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Business Info */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-[#1d1d1f] rounded-3xl p-8 border border-white/10"
                >
                  <h2 className="text-2xl font-semibold text-white mb-6">Basic Business Information</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Business Name *
                      </label>
                      <input
                        type="text"
                        value={businessInfo.businessName}
                        onChange={(e) => updateField('businessName', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#0071e3]"
                        placeholder="Enter your business name"
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Industry *
                      </label>
                      <select
                        value={businessInfo.industry}
                        onChange={(e) => updateField('industry', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#0071e3]"
                      >
                        <option value="">Select your industry</option>
                        {industries.map((ind) => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Number of Employees *
                        </label>
                        <select
                          value={businessInfo.employeeCount}
                          onChange={(e) => updateField('employeeCount', e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#0071e3]"
                        >
                          <option value="">Select</option>
                          {employeeCounts.map((count) => (
                            <option key={count} value={count}>{count}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Business Structure *
                        </label>
                        <select
                          value={businessInfo.businessStructure}
                          onChange={(e) => updateField('businessStructure', e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#0071e3]"
                        >
                          <option value="">Select</option>
                          {businessStructures.map((struct) => (
                            <option key={struct} value={struct}>{struct}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Primary State/Location *
                      </label>
                      <input
                        type="text"
                        value={businessInfo.state}
                        onChange={(e) => updateField('state', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#0071e3]"
                        placeholder="e.g., California, New York, Texas"
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Year Established
                      </label>
                      <input
                        type="text"
                        value={businessInfo.yearEstablished}
                        onChange={(e) => updateField('yearEstablished', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#0071e3]"
                        placeholder="e.g., 2020"
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Business Website URL <span className="text-white/40 text-xs">(Optional but Recommended)</span>
                      </label>
                      <input
                        type="url"
                        value={businessInfo.websiteUrl}
                        onChange={(e) => updateField('websiteUrl', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#0071e3]"
                        placeholder="https://yourbusiness.com"
                      />
                      <p className="text-white/40 text-xs mt-2">
                        Providing your website helps us gather accurate business information automatically, ensuring documents are based on real data, not assumptions.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end mt-8">
                    <button
                      onClick={handleNext}
                      disabled={!businessInfo.businessName || !businessInfo.industry || !businessInfo.employeeCount || !businessInfo.state || !businessInfo.businessStructure}
                      className="px-8 py-3 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                    {(!businessInfo.businessName || !businessInfo.industry || !businessInfo.employeeCount || !businessInfo.state || !businessInfo.businessStructure) && (
                      <p className="text-white/40 text-xs mt-2 text-center w-full">
                        ⚠️ All required fields must be completed. We need accurate information to generate compliant documents.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Work Environment */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-[#1d1d1f] rounded-3xl p-8 border border-white/10"
                >
                  <h2 className="text-2xl font-semibold text-white mb-6">Work Environment</h2>
                  <p className="text-white/60 mb-6">Tell us about where your employees work</p>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-3">
                        Work Environments (select all that apply) *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {workEnvironments.map((env) => (
                          <label key={env} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={businessInfo.workEnvironment.includes(env)}
                              onChange={() => toggleArrayItem('workEnvironment', env)}
                              className="w-5 h-5 text-[#0071e3] rounded"
                            />
                            <span className="text-white text-sm">{env}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-3">
                        Additional Work Environment Details
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                          <input
                            type="checkbox"
                            checked={businessInfo.hasRemoteWorkers}
                            onChange={(e) => updateField('hasRemoteWorkers', e.target.checked)}
                            className="w-5 h-5 text-[#0071e3] rounded"
                          />
                          <span className="text-white text-sm">Has remote/telecommuting employees</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      onClick={handleBack}
                      className="px-8 py-3 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={businessInfo.workEnvironment.length === 0}
                      className="px-8 py-3 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Job Roles & Pay Structure */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-[#1d1d1f] rounded-3xl p-8 border border-white/10"
                >
                  <h2 className="text-2xl font-semibold text-white mb-6">Job Roles & Pay Structure</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-3">
                        Job Roles in Your Company (select all that apply) *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {jobRoles.map((role) => (
                          <label key={role} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={businessInfo.jobRoles.includes(role)}
                              onChange={() => toggleArrayItem('jobRoles', role)}
                              className="w-5 h-5 text-[#0071e3] rounded"
                            />
                            <span className="text-white text-sm">{role}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-3">
                        Employee Types (select all that apply) *
                      </label>
                      <div className="space-y-3">
                        {[
                          { key: 'hasHourlyEmployees', label: 'Hourly employees (non-exempt)' },
                          { key: 'hasSalariedEmployees', label: 'Salaried employees' },
                          { key: 'hasExemptEmployees', label: 'Exempt employees (executive, professional, administrative)' },
                          { key: 'hasContractors', label: 'Independent contractors' },
                        ].map((type) => (
                          <label key={type.key} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={businessInfo[type.key as keyof BusinessInfo] as boolean}
                              onChange={(e) => updateField(type.key as keyof BusinessInfo, e.target.checked)}
                              className="w-5 h-5 text-[#0071e3] rounded"
                            />
                            <span className="text-white text-sm">{type.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Pay Frequency *
                      </label>
                      <select
                        value={businessInfo.payFrequency}
                        onChange={(e) => updateField('payFrequency', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#0071e3]"
                      >
                        <option value="">Select pay frequency</option>
                        {payFrequencies.map((freq) => (
                          <option key={freq} value={freq}>{freq}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      onClick={handleBack}
                      className="px-8 py-3 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={businessInfo.jobRoles.length === 0 || !businessInfo.payFrequency}
                      className="px-8 py-3 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Benefits & Policies */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-[#1d1d1f] rounded-3xl p-8 border border-white/10"
                >
                  <h2 className="text-2xl font-semibold text-white mb-6">Benefits & Current Documents</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-3">
                        Benefits Offered (select all that apply)
                      </label>
                      <div className="space-y-3">
                        {[
                          { key: 'offersHealthInsurance', label: 'Health Insurance' },
                          { key: 'offersRetirementPlan', label: 'Retirement Plan (401k, etc.)' },
                          { key: 'offersPaidTimeOff', label: 'Paid Time Off (PTO)' },
                          { key: 'offersSickLeave', label: 'Sick Leave' },
                        ].map((benefit) => (
                          <label key={benefit.key} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={businessInfo[benefit.key as keyof BusinessInfo] as boolean}
                              onChange={(e) => updateField(benefit.key as keyof BusinessInfo, e.target.checked)}
                              className="w-5 h-5 text-[#0071e3] rounded"
                            />
                            <span className="text-white text-sm">{benefit.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-3">
                        Current Documents (select all that apply)
                      </label>
                      <div className="space-y-3">
                        {[
                          { key: 'hasEmployeeHandbook', label: 'Employee Handbook' },
                          { key: 'hasSafetyManual', label: 'Safety Manual' },
                          { key: 'hasPolicies', label: 'Company Policies' },
                        ].map((doc) => (
                          <label key={doc.key} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={businessInfo[doc.key as keyof BusinessInfo] as boolean}
                              onChange={(e) => updateField(doc.key as keyof BusinessInfo, e.target.checked)}
                              className="w-5 h-5 text-[#0071e3] rounded"
                            />
                            <span className="text-white text-sm">{doc.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      onClick={handleBack}
                      className="px-8 py-3 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-8 py-3 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Compliance Priorities */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-[#1d1d1f] rounded-3xl p-8 border border-white/10"
                >
                  <h2 className="text-2xl font-semibold text-white mb-6">Compliance Priorities</h2>
                  <p className="text-white/60 mb-6">Which compliance areas are most important for your business?</p>
                  
                  <div className="space-y-3 mb-6">
                    {complianceAreas.map((area) => (
                      <label key={area} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={businessInfo.complianceConcerns.includes(area)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateField('complianceConcerns', [...businessInfo.complianceConcerns, area]);
                            } else {
                              updateField('complianceConcerns', businessInfo.complianceConcerns.filter((c) => c !== area));
                            }
                          }}
                          className="w-5 h-5 text-[#0071e3] rounded"
                        />
                        <span className="text-white">{area}</span>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={businessInfo.hasOSHARequirements}
                        onChange={(e) => updateField('hasOSHARequirements', e.target.checked)}
                        className="w-5 h-5 text-[#0071e3] rounded"
                      />
                      <span className="text-white">OSHA compliance required (workplace safety)</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={businessInfo.hasHIPAARequirements}
                        onChange={(e) => updateField('hasHIPAARequirements', e.target.checked)}
                        className="w-5 h-5 text-[#0071e3] rounded"
                      />
                      <span className="text-white">HIPAA compliance required (healthcare data)</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={businessInfo.hasDataPrivacyConcerns}
                        onChange={(e) => updateField('hasDataPrivacyConcerns', e.target.checked)}
                        className="w-5 h-5 text-[#0071e3] rounded"
                      />
                      <span className="text-white">Data privacy concerns (customer data, employee data)</span>
                    </label>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      onClick={handleBack}
                      className="px-8 py-3 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-8 py-3 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 6: Specific Details */}
              {step === 6 && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-[#1d1d1f] rounded-3xl p-8 border border-white/10"
                >
                  <h2 className="text-2xl font-semibold text-white mb-6">Specific Requirements</h2>
                  <p className="text-white/60 mb-6">Tell us about any specific concerns or requirements</p>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Specific Safety Concerns or Hazards
                      </label>
                      <textarea
                        value={businessInfo.specificSafetyConcerns}
                        onChange={(e) => updateField('specificSafetyConcerns', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#0071e3] min-h-[100px]"
                        placeholder="e.g., Heavy machinery, chemical handling, working at heights, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Specific Policies You Need
                      </label>
                      <textarea
                        value={businessInfo.specificPoliciesNeeded}
                        onChange={(e) => updateField('specificPoliciesNeeded', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#0071e3] min-h-[100px]"
                        placeholder="e.g., Social media policy, remote work policy, dress code, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        Industry-Specific Requirements
                      </label>
                      <textarea
                        value={businessInfo.industrySpecificRequirements}
                        onChange={(e) => updateField('industrySpecificRequirements', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#0071e3] min-h-[100px]"
                        placeholder="e.g., Food safety certifications, professional licensing requirements, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">
                        State-Specific Needs
                      </label>
                      <textarea
                        value={businessInfo.stateSpecificNeeds}
                        onChange={(e) => updateField('stateSpecificNeeds', e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#0071e3] min-h-[100px]"
                        placeholder="e.g., California meal break requirements, New York paid sick leave, etc."
                      />
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      onClick={handleBack}
                      className="px-8 py-3 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-8 py-3 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 7: Review & Generate */}
              {step === 7 && (
                <motion.div
                  key="step7"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-[#1d1d1f] rounded-3xl p-8 border border-white/10"
                >
                  <h2 className="text-2xl font-semibold text-white mb-6">Review & Generate</h2>
                  
                  <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto">
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-white/60 text-sm mb-1">Business Name</p>
                      <p className="text-white font-medium">{businessInfo.businessName}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-white/60 text-sm mb-1">Industry & Structure</p>
                      <p className="text-white font-medium">{businessInfo.industry} • {businessInfo.businessStructure}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-white/60 text-sm mb-1">Employees</p>
                      <p className="text-white font-medium">{businessInfo.employeeCount}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-white/60 text-sm mb-1">Work Environments</p>
                      <p className="text-white font-medium">{businessInfo.workEnvironment.join(', ') || 'None selected'}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-white/60 text-sm mb-1">Job Roles</p>
                      <p className="text-white font-medium">{businessInfo.jobRoles.join(', ') || 'None selected'}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-white/60 text-sm mb-1">Compliance Priorities</p>
                      <p className="text-white font-medium">
                        {businessInfo.complianceConcerns.length > 0
                          ? businessInfo.complianceConcerns.join(', ')
                          : 'None selected'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#0071e3]/10 border border-[#0071e3]/30 rounded-xl p-6 mb-8">
                    <p className="text-white text-sm">
                      <strong>What happens next:</strong> Our AI will <strong>GENERATE</strong> comprehensive, customized compliance documents 
                      (employee handbook, safety manual, policies) based on <strong>YOUR answers</strong>. We're not auditing anything - we're 
                      <strong> creating your documents from scratch</strong> using the information you provided.
                    </p>
                    <ul className="text-white/80 text-sm mt-3 list-disc list-inside space-y-1">
                      <li>Employee Handbook tailored to your industry and state</li>
                      <li>Safety Manual with specific procedures for your work environment</li>
                      <li>All required compliance policies</li>
                      <li>State-specific requirements</li>
                      <li>Industry-specific regulations</li>
                    </ul>
                    <p className="text-white/60 text-xs mt-4">
                      <strong>Important:</strong> We're GENERATING documents based on what you told us. We're not analyzing or auditing - we're building your handbook from scratch. Generation typically takes 5-10 minutes. Please don't close this page.
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={handleBack}
                      className="px-8 py-3 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-8 py-3 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors disabled:bg-white/10 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Generating...' : 'Generate Documents'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* JC Chat for Additional Information */}
      {showJCChat && needsMoreInfo && (
        <GenerationChatbot
          isOpen={showJCChat}
          businessInfo={businessInfo}
          partialDocuments={partialDocuments}
          conversationHistory={conversationHistory}
          onContinue={async (additionalInfo: any, updatedHistory: any[]) => {
            setLoading(true);
            setGenerationProgress(50);
            setGenerationMessage('Generating complete documents with your additional information...');
            
            try {
              const response = await fetch('/api/continue-generation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  businessInfo,
                  additionalInfo,
                  conversationHistory: updatedHistory,
                  partialDocuments,
                }),
              });

              if (!response.ok) {
                throw new Error('Failed to continue generation');
              }

              const data = await response.json();
              
              // Store report
              const reportData = {
                id: data.reportId,
                reportId: data.reportId,
                fileName: `${businessInfo.businessName} - Generated Compliance Documents`,
                analysis: data.analysis,
                createdAt: new Date().toISOString(),
              };
              
              const sessionKey = `report_${data.reportId}`;
              sessionStorage.setItem(sessionKey, JSON.stringify(reportData));
              
              // Also save to local storage for persistence
              if (user?.id) {
                try {
                  const localReportsKey = `lifeos_reports_${user.id}`;
                  const existing = localStorage.getItem(localReportsKey);
                  const reports: any[] = existing ? JSON.parse(existing) : [];
                  const filtered = reports.filter(r => r.id !== data.reportId);
                  const updated = [reportData, ...filtered].slice(0, 100);
                  localStorage.setItem(localReportsKey, JSON.stringify(updated));
                } catch (e) {
                  console.warn('Error saving to local storage:', e);
                }
              }
              
              // Complete progress
              setGenerationProgress(100);
              setGenerationMessage('Documents generated successfully!');
              await new Promise(r => setTimeout(r, 1500));
              
              // Redirect to view documents
              router.push(`/reports/${data.reportId}`);
            } catch (error) {
              console.error('Error continuing generation:', error);
              setLoading(false);
              alert(`Failed to generate documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }}
          onClose={() => {
            setShowJCChat(false);
            setLoading(false);
          }}
        />
      )}

      {/* Privacy Agreement Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <PrivacyAgreementModal
            isBlocking={true} // Block all usage until agreed
            onAgree={() => {
              setShowPrivacyModal(false);
              if (pendingSubmit) {
                setPendingSubmit(false);
                handleSubmit();
              }
            }}
            onCancel={() => {
              // If blocking, don't allow cancel - they must agree
              alert('You must agree to the Privacy Policy and Terms of Service to use LifeØS. If you do not agree, please close this browser window.');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Generation Chatbot Component for collecting additional information
function GenerationChatbot({ 
  isOpen, 
  businessInfo, 
  partialDocuments, 
  conversationHistory: initialHistory,
  onContinue, 
  onClose 
}: {
  isOpen: boolean;
  businessInfo: BusinessInfo;
  partialDocuments: string;
  conversationHistory: Array<{role: string; content: string}>;
  onContinue: (additionalInfo: any, history: any[]) => void;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>(initialHistory);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [collectedInfo, setCollectedInfo] = useState<any>({});
  const [questionCount, setQuestionCount] = useState(0); // Track number of questions asked
  const [showContinueButton, setShowContinueButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialHistory);
    // Count assistant messages (questions) in initial history
    const initialQuestions = initialHistory.filter(m => m.role === 'assistant').length;
    setQuestionCount(initialQuestions);
    if (initialQuestions >= 5) {
      setShowContinueButton(true);
    }
  }, [initialHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Check what information is still missing
      const missingInfo = [];
      if (!businessInfo.businessName) missingInfo.push('business name');
      if (!businessInfo.industry) missingInfo.push('industry');
      if (!businessInfo.state) missingInfo.push('state');
      if (!businessInfo.employeeCount) missingInfo.push('number of employees');
      if (businessInfo.jobRoles.length === 0) missingInfo.push('job roles');
      if (businessInfo.workEnvironment.length === 0) missingInfo.push('work environments');
      if (!businessInfo.payFrequency) missingInfo.push('pay frequency');
      
      // Check if user said "no" - continue conversation anyway
      const userSaidNo = /^(no|nope|nah|not really|don'?t have|don'?t|none|n\/a|na)$/i.test(userMessage.content.trim());
      
      const response = await fetch('/api/chat-compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `I'm helping generate compliance documents for ${businessInfo.businessName || 'a business'}. 

CRITICAL: We need REAL, ACCURATE information - not made-up details. The user said: "${userMessage.content}".

${userSaidNo ? 'IMPORTANT: The user said "no" or indicated they don\'t have this information. Continue the conversation - ask a DIFFERENT question about something else they might know. Don\'t stop - keep gathering information. ' : ''}

Missing information: ${missingInfo.length > 0 ? missingInfo.join(', ') : 'Some specific details'}

Based on our conversation, what specific question should I ask next to gather accurate business information? Ask ONE clear, specific question. ${userSaidNo ? 'Since they said no to the previous question, ask about something DIFFERENT. ' : ''}Do NOT accept vague answers - we need real details to generate documents that will pass compliance audits.`,
          analysis: { generatedDocuments: partialDocuments },
          fileName: `${businessInfo.businessName || 'Business'} - Generated Compliance Documents`,
          conversationHistory: newMessages,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const assistantMessage = { role: 'assistant', content: data.response };
      
      // Increment question count (assistant messages are questions)
      const newQuestionCount = questionCount + 1;
      setQuestionCount(newQuestionCount);
      
      // Show Continue button after 5 questions
      if (newQuestionCount >= 5) {
        setShowContinueButton(true);
      }
      
      setMessages([...newMessages, assistantMessage]);
      
      // Extract any information from the conversation
      const extractedInfo = extractInfoFromConversation([...newMessages, assistantMessage]);
      setCollectedInfo({ ...collectedInfo, ...extractedInfo });
      
      // Check if JC says we have enough info (but don't auto-continue if Continue button is shown)
      const hasEnoughInfo = data.response.toLowerCase().includes('ready to generate') || 
                           data.response.toLowerCase().includes('have enough information') ||
                           data.response.toLowerCase().includes('let me generate');
      
      // Only auto-continue if we have enough info AND haven't shown Continue button yet
      if (hasEnoughInfo && !showContinueButton && newQuestionCount < 5) {
        setTimeout(() => {
          onContinue(collectedInfo, [...newMessages, assistantMessage]);
        }, 1000);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Sorry, I ran into an issue. Could you try rephrasing your answer?' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const extractInfoFromConversation = (history: any[]): any => {
    const info: any = {};
    const fullText = history.map(m => m.content).join(' ');
    
    // Extract common business details mentioned
    if (fullText.match(/\d+\s*(employees?|staff|workers?)/i)) {
      const match = fullText.match(/(\d+)\s*(employees?|staff|workers?)/i);
      if (match) info.employeeCount = match[1];
    }
    
    // Extract state if mentioned
    const states = ['California', 'New York', 'Texas', 'Florida', 'Illinois'];
    states.forEach(state => {
      if (fullText.includes(state)) info.state = state;
    });
    
    return info;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#1d1d1f] rounded-3xl border border-white/10 w-full max-w-3xl h-[80vh] flex flex-col"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#34c759]/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Jamshed Cooper (JC)</h2>
                <p className="text-sm text-white/50">Helping complete your documents</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-[#0071e3] text-white'
                    : 'bg-white/5 text-white/90 border border-white/10'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 text-white/90 border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">JC is typing</span>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 border-t border-white/10 space-y-3">
            {showContinueButton && (
              <div className="flex justify-center">
                <button
                  onClick={() => onContinue(collectedInfo, messages)}
                  className="px-8 py-3 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors shadow-lg shadow-[#0071e3]/20"
                >
                  Continue to Generate Documents
                </button>
              </div>
            )}
            {showContinueButton && (
              <p className="text-center text-white/50 text-xs">
                Or continue the conversation if you want to add more information
              </p>
            )}
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={showContinueButton ? "Add more information if needed..." : "Answer JC's questions..."}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

