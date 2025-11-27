import { Report, AnalysisResult } from './types';

// Enable demo mode when Clerk is not configured or API keys are missing
export const IS_DEMO_MODE = !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === '' ||
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'YOUR_PUBLISHABLE_KEY';

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const DEMO_ANALYSIS: AnalysisResult = {
  overallRiskScore: 7.8,
  summary: "Your employee handbook has significant compliance gaps that could expose your organization to regulatory fines. We identified 5 key risk areas requiring immediate attention, primarily related to workplace safety protocols and employee classification. The most critical issues involve OSHA safety equipment requirements and FLSA overtime exemption criteria. With the recommended fixes, you can achieve compliance within 7 days.",
  risks: [
    {
      issue: 'Missing Safety Equipment Requirements',
      description: 'The handbook does not specify required personal protective equipment (PPE) for warehouse and manufacturing areas. OSHA mandates clear documentation of PPE requirements.',
      severity: 9,
      regulation: 'OSHA 29 CFR 1910.132',
      potentialFine: '$15,625 per violation',
    },
    {
      issue: 'Incomplete Anti-Harassment Policy',
      description: 'Current policy lacks specific reporting procedures and investigation timelines required under EEOC guidelines.',
      severity: 8,
      regulation: 'EEOC Guidelines',
      potentialFine: '$50,000 per claim',
    },
    {
      issue: 'Overtime Exemption Classification',
      description: 'Job descriptions for exempt employees do not clearly establish duties that qualify for FLSA exemptions.',
      severity: 7,
      regulation: 'FLSA 29 USC § 213',
      potentialFine: '$10,000 per employee',
    },
    {
      issue: 'Emergency Exit Signage',
      description: 'Policy does not address emergency exit signage and evacuation route posting requirements.',
      severity: 6,
      regulation: 'OSHA 29 CFR 1910.37',
      potentialFine: '$7,000 per violation',
    },
    {
      issue: 'Break Time Documentation',
      description: 'Meal and rest break policies do not comply with state-specific requirements for California employees.',
      severity: 5,
      regulation: 'CA Labor Code § 512',
      potentialFine: '$100 per day per employee',
    },
  ],
  fixes: [
    {
      title: 'Add Comprehensive PPE Policy Section',
      description: 'Create a dedicated section listing all required PPE by job role and work area. Include training requirements and violation consequences.',
      priority: 'Critical',
      timeframe: 'Within 48 hours',
    },
    {
      title: 'Update Anti-Harassment Reporting Procedures',
      description: 'Add specific steps for filing complaints, designate trained investigators, and document investigation timelines (max 30 days).',
      priority: 'High',
      timeframe: 'Within 3 days',
    },
    {
      title: 'Revise Exempt Employee Job Descriptions',
      description: 'Ensure all exempt positions clearly document supervisory duties, decision-making authority, and specialized knowledge requirements.',
      priority: 'High',
      timeframe: 'Within 5 days',
    },
    {
      title: 'Add Emergency Evacuation Section',
      description: 'Include emergency exit locations, evacuation assembly points, and fire warden responsibilities.',
      priority: 'Medium',
      timeframe: 'Within 5 days',
    },
    {
      title: 'Update California Break Time Policy',
      description: 'Create state-specific addendum for California employees covering meal period timing and rest break frequency.',
      priority: 'Medium',
      timeframe: 'Within 7 days',
    },
  ],
  policyUpdates: [
    'Add Section 4.2: Personal Protective Equipment Requirements',
    'Revise Section 7.1: Harassment Reporting and Investigation Procedures',
    'Update Appendix A: Exempt vs Non-Exempt Classification Criteria',
    'Add Section 3.5: Emergency Evacuation Procedures',
    'Create California Addendum for Section 5.3: Meal and Rest Breaks',
  ],
  actionPlan: [
    {
      day: 1,
      title: 'Critical Safety Updates',
      tasks: [
        'Draft comprehensive PPE requirements by department',
        'Review current exempt employee classifications',
        'Assign policy revision responsibilities to HR team',
      ],
    },
    {
      day: 2,
      title: 'Documentation Review',
      tasks: [
        'Complete PPE policy section and submit for legal review',
        'Draft updated anti-harassment reporting procedures',
        'Map emergency exits and assembly points for each facility',
      ],
    },
    {
      day: 3,
      title: 'Legal Review',
      tasks: [
        'Legal counsel reviews PPE and harassment policy updates',
        'HR verifies exempt employee duties meet FLSA tests',
        'Finalize emergency evacuation section',
      ],
    },
    {
      day: 4,
      title: 'State Compliance',
      tasks: [
        'Draft California meal/rest break addendum',
        'Review other state-specific requirements if applicable',
        'Incorporate legal feedback on policies',
      ],
    },
    {
      day: 5,
      title: 'Final Review',
      tasks: [
        'Complete final review of all updated sections',
        'Prepare employee communication about policy updates',
        'Schedule mandatory training sessions',
      ],
    },
    {
      day: 6,
      title: 'Distribution',
      tasks: [
        'Distribute updated handbook to all employees',
        'Collect acknowledgment signatures',
        'Update digital policy repository',
      ],
    },
    {
      day: 7,
      title: 'Training & Verification',
      tasks: [
        'Conduct required compliance training sessions',
        'Verify all acknowledgments are collected',
        'Schedule follow-up audit for 30 days',
      ],
    },
  ],
  potentialFines: '$125,000+',
};

export const DEMO_REPORTS: Report[] = [
  {
    id: 'demo-report-1',
    userId: 'demo-user',
    fileName: 'Employee_Handbook_2024.pdf',
    fileUrl: '',
    analysis: DEMO_ANALYSIS,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    status: 'completed',
  },
  {
    id: 'demo-report-2',
    userId: 'demo-user',
    fileName: 'Safety_Procedures_Manual.pdf',
    fileUrl: '',
    analysis: {
      overallRiskScore: 6.2,
      summary: "Your safety procedures manual covers most OSHA requirements but has gaps in chemical handling and lockout/tagout procedures. Updating these sections will significantly reduce your liability exposure.",
      risks: [
        {
          issue: 'Incomplete Chemical Handling Procedures',
          description: 'Missing specific protocols for handling hazardous materials as required by OSHA HazCom standard.',
          severity: 8,
          regulation: 'OSHA 29 CFR 1910.1200',
          potentialFine: '$15,625 per violation',
        },
        {
          issue: 'Lockout/Tagout Gaps',
          description: 'Current LOTO procedures lack specific energy isolation methods for certain equipment.',
          severity: 7,
          regulation: 'OSHA 29 CFR 1910.147',
          potentialFine: '$15,625 per violation',
        },
        {
          issue: 'First Aid Training Documentation',
          description: 'No documentation of first aid training frequency or certification requirements.',
          severity: 5,
          regulation: 'OSHA 29 CFR 1910.151',
          potentialFine: '$7,000 per violation',
        },
      ],
      fixes: [
        {
          title: 'Add Chemical Safety Data Sheets Section',
          description: 'Include procedures for accessing and understanding SDS sheets for all hazardous materials.',
          priority: 'High',
          timeframe: 'Within 48 hours',
        },
        {
          title: 'Update Lockout/Tagout Procedures',
          description: 'Add equipment-specific energy isolation methods and verification steps.',
          priority: 'High',
          timeframe: 'Within 3 days',
        },
      ],
      policyUpdates: [
        'Add Section 2.4: Hazardous Material Handling',
        'Revise Section 3.1: Equipment Lockout/Tagout Procedures',
      ],
      actionPlan: [
        {
          day: 1,
          title: 'Chemical Safety Audit',
          tasks: ['Inventory all hazardous materials', 'Verify SDS availability'],
        },
        {
          day: 2,
          title: 'LOTO Review',
          tasks: ['Review all equipment requiring LOTO', 'Document energy sources'],
        },
        {
          day: 3,
          title: 'Documentation Update',
          tasks: ['Complete chemical handling section', 'Update LOTO procedures'],
        },
      ],
      potentialFines: '$75,000+',
    },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    status: 'completed',
  },
  {
    id: 'demo-report-3',
    userId: 'demo-user',
    fileName: 'HIPAA_Privacy_Policy.pdf',
    fileUrl: '',
    analysis: {
      overallRiskScore: 8.5,
      summary: "Critical gaps identified in your HIPAA privacy policy. Missing breach notification procedures and Business Associate Agreement requirements could result in severe penalties. Immediate action required.",
      risks: [
        {
          issue: 'Missing Breach Notification Procedures',
          description: 'No documented process for notifying affected individuals and HHS in case of a data breach.',
          severity: 9,
          regulation: 'HIPAA Breach Notification Rule',
          potentialFine: '$1.5M per violation category',
        },
        {
          issue: 'Incomplete BAA Requirements',
          description: 'Business Associate Agreements do not include all required provisions under HIPAA.',
          severity: 8,
          regulation: 'HIPAA Privacy Rule 45 CFR 164.504',
          potentialFine: '$100,000 per violation',
        },
        {
          issue: 'Minimum Necessary Standard',
          description: 'Policy does not address limiting PHI access to minimum necessary for job functions.',
          severity: 7,
          regulation: 'HIPAA Privacy Rule 45 CFR 164.502',
          potentialFine: '$50,000 per violation',
        },
        {
          issue: 'Patient Rights Documentation',
          description: 'Incomplete documentation of patient rights to access and amend their records.',
          severity: 6,
          regulation: 'HIPAA Privacy Rule 45 CFR 164.524',
          potentialFine: '$25,000 per violation',
        },
      ],
      fixes: [
        {
          title: 'Create Breach Response Plan',
          description: 'Document step-by-step breach identification, investigation, and notification procedures.',
          priority: 'Critical',
          timeframe: 'Within 24 hours',
        },
        {
          title: 'Update Business Associate Agreements',
          description: 'Add required provisions including permitted uses, safeguards, and breach notification.',
          priority: 'Critical',
          timeframe: 'Within 48 hours',
        },
      ],
      policyUpdates: [
        'Add Section 8: Breach Notification Procedures',
        'Revise Section 4: Business Associate Requirements',
        'Add Section 5.2: Minimum Necessary Standard',
      ],
      actionPlan: [
        {
          day: 1,
          title: 'Breach Plan Development',
          tasks: ['Draft breach notification procedures', 'Identify breach response team'],
        },
        {
          day: 2,
          title: 'BAA Updates',
          tasks: ['Review all current BAAs', 'Draft updated template'],
        },
        {
          day: 3,
          title: 'Implementation',
          tasks: ['Execute updated BAAs with vendors', 'Train staff on breach procedures'],
        },
      ],
      potentialFines: '$2M+',
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    status: 'completed',
  },
];
