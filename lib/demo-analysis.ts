// Demo mode analysis - generates realistic compliance results without external APIs

import { AnalysisResult, ComplianceRisk } from '@/lib/types';

// Sample risks based on document type
const riskTemplates: Record<string, ComplianceRisk[]> = {
  employee_handbook: [
    {
      id: 1,
      title: 'Missing PPE Policy',
      description: 'Your employee handbook lacks comprehensive Personal Protective Equipment (PPE) requirements as mandated by OSHA standards.',
      severity: 9,
      category: 'Workplace Safety',
      regulation: 'OSHA 1910.132',
      potentialFine: '$15,625',
      fix: 'Add comprehensive PPE requirements to safety manual Section 4.2, including types of PPE required, proper usage, and maintenance procedures.',
    },
    {
      id: 2,
      title: 'Incomplete Harassment Training Documentation',
      description: 'Documentation shows inconsistent harassment prevention training. EEOC requires documented quarterly training for all employees.',
      severity: 8,
      category: 'HR Compliance',
      regulation: 'EEOC Guidelines',
      potentialFine: '$50,000',
      fix: 'Implement quarterly harassment prevention training with sign-off documentation. Create attendance tracking system.',
    },
    {
      id: 3,
      title: 'Overtime Classification Error',
      description: '3 positions appear to be incorrectly classified as exempt. This could result in back-pay claims and FLSA penalties.',
      severity: 7,
      category: 'Labor Law',
      regulation: 'FLSA 29 USC § 213',
      potentialFine: '$10,000',
      fix: 'Audit all exempt classifications using DOL salary and duties tests. Reclassify affected positions and update payroll.',
    },
    {
      id: 4,
      title: 'Missing Emergency Action Plan',
      description: 'No documented emergency action plan found. Required for workplaces with more than 10 employees.',
      severity: 6,
      category: 'Workplace Safety',
      regulation: 'OSHA 1910.38',
      potentialFine: '$7,000',
      fix: 'Create written emergency action plan including evacuation procedures, emergency contacts, and assembly points.',
    },
    {
      id: 5,
      title: 'Outdated Break Policy',
      description: 'Break policy does not reflect current state labor laws for meal and rest periods.',
      severity: 5,
      category: 'Labor Law',
      regulation: 'State Labor Code',
      potentialFine: '$5,000',
      fix: 'Update break policy to match current state requirements. Include timing, duration, and documentation requirements.',
    },
  ],
  safety_manual: [
    {
      id: 1,
      title: 'Incomplete Lockout/Tagout Procedures',
      description: 'LOTO procedures lack specific machine-by-machine energy control documentation required by OSHA.',
      severity: 9,
      category: 'Workplace Safety',
      regulation: 'OSHA 1910.147',
      potentialFine: '$25,000',
      fix: 'Document machine-specific LOTO procedures for each piece of equipment. Train all affected employees.',
    },
    {
      id: 2,
      title: 'Missing Hazard Communication Program',
      description: 'No written hazard communication program found. SDS sheets may be incomplete or inaccessible.',
      severity: 8,
      category: 'Workplace Safety',
      regulation: 'OSHA 1910.1200',
      potentialFine: '$15,000',
      fix: 'Implement written HazCom program. Ensure all SDS sheets are current and accessible to employees.',
    },
    {
      id: 3,
      title: 'Fire Extinguisher Inspection Gap',
      description: 'Fire extinguisher inspection records show 3-month gap in monthly inspections.',
      severity: 7,
      category: 'Fire Safety',
      regulation: 'OSHA 1910.157',
      potentialFine: '$7,500',
      fix: 'Establish monthly inspection schedule with designated responsible parties. Document all inspections.',
    },
  ],
  hipaa_policy: [
    {
      id: 1,
      title: 'Inadequate Access Controls',
      description: 'PHI access logs show users with permissions beyond minimum necessary standard.',
      severity: 9,
      category: 'Data Privacy',
      regulation: 'HIPAA 45 CFR 164.312',
      potentialFine: '$50,000',
      fix: 'Audit and restrict PHI access to minimum necessary. Implement role-based access controls.',
    },
    {
      id: 2,
      title: 'Missing Business Associate Agreements',
      description: 'No BAAs found for 2 vendors with access to PHI.',
      severity: 8,
      category: 'Data Privacy',
      regulation: 'HIPAA 45 CFR 164.502',
      potentialFine: '$25,000',
      fix: 'Execute BAAs with all vendors handling PHI. Review and update annually.',
    },
    {
      id: 3,
      title: 'Incomplete Breach Notification Policy',
      description: 'Breach notification procedures do not include all required elements.',
      severity: 7,
      category: 'Data Privacy',
      regulation: 'HIPAA 45 CFR 164.404',
      potentialFine: '$15,000',
      fix: 'Update breach notification policy to include all required elements including timelines and reporting requirements.',
    },
  ],
  default: [
    {
      id: 1,
      title: 'Policy Documentation Gap',
      description: 'Document appears to be missing required policy elements for compliance.',
      severity: 7,
      category: 'General Compliance',
      regulation: 'Various',
      potentialFine: '$10,000',
      fix: 'Review document against applicable regulations and add missing required sections.',
    },
    {
      id: 2,
      title: 'Outdated References',
      description: 'Document contains references to outdated regulations or standards.',
      severity: 6,
      category: 'General Compliance',
      regulation: 'Various',
      potentialFine: '$5,000',
      fix: 'Update all regulatory references to current versions. Establish annual review process.',
    },
    {
      id: 3,
      title: 'Missing Acknowledgment Process',
      description: 'No employee acknowledgment or sign-off process documented.',
      severity: 5,
      category: 'General Compliance',
      regulation: 'Best Practice',
      potentialFine: '$2,500',
      fix: 'Implement employee acknowledgment process with documented sign-offs and version tracking.',
    },
  ],
};

function detectDocumentType(fileName: string): string {
  const name = fileName.toLowerCase();
  if (name.includes('handbook') || name.includes('employee') || name.includes('hr')) {
    return 'employee_handbook';
  }
  if (name.includes('safety') || name.includes('osha') || name.includes('hazard')) {
    return 'safety_manual';
  }
  if (name.includes('hipaa') || name.includes('phi') || name.includes('privacy') || name.includes('health')) {
    return 'hipaa_policy';
  }
  return 'default';
}

function generateRandomVariation(base: number, variance: number): number {
  return Math.max(1, Math.min(10, base + Math.floor(Math.random() * variance * 2) - variance));
}

export function generateDemoAnalysis(fileName: string, fileSize: number): AnalysisResult {
  const docType = detectDocumentType(fileName);
  const baseRisks = riskTemplates[docType] || riskTemplates.default;
  
  // Add some randomization to make each analysis feel unique
  const risks: ComplianceRisk[] = baseRisks.map((risk, index) => ({
    ...risk,
    severity: generateRandomVariation(risk.severity, 1),
  })).sort((a, b) => b.severity - a.severity);

  const overallRiskScore = Math.round(
    (risks.reduce((sum, r) => sum + r.severity, 0) / risks.length) * 10
  ) / 10;

  const totalFines = risks.reduce((sum, r) => {
    const amount = parseInt(r.potentialFine.replace(/[$,]/g, '')) || 0;
    return sum + amount;
  }, 0);

  return {
    summary: `Analysis of "${fileName}" identified ${risks.length} compliance risks with a combined potential exposure of $${totalFines.toLocaleString()}. ${
      overallRiskScore >= 7 ? 'Immediate attention is recommended.' : 'Review and address findings within 30 days.'
    }`,
    overallRiskScore,
    risks,
    policyUpdates: [
      {
        section: 'Introduction',
        currentIssue: 'Missing effective date and version control',
        suggestedLanguage: 'This policy is effective as of [DATE] and supersedes all previous versions.',
      },
      {
        section: 'Definitions',
        currentIssue: 'Key compliance terms not defined',
        suggestedLanguage: 'Add definitions section for all regulatory terms referenced in this document.',
      },
    ],
    actionPlan: {
      day1: 'Review findings with management team and prioritize risks by severity',
      day2_3: 'Draft updated policies and procedures for high-severity items',
      day4_5: 'Implement immediate fixes and begin training documentation',
      day6_7: 'Document all changes and schedule follow-up compliance review',
    },
    positiveFindings: [
      'Document structure follows industry best practices',
      'Clear language and formatting throughout',
      'Regular review process appears to be in place',
    ],
    analyzedAt: new Date().toISOString(),
    documentWordCount: Math.round(fileSize / 6), // Rough estimate
  };
}

export function generateDemoPdfUrl(): string {
  // Return a placeholder - in production this would be the actual PDF URL
  return '/demo-report.pdf';
}

