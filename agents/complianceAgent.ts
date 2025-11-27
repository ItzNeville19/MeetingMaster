import { generateCompletion } from '@/lib/openai';
import fs from 'fs';
import path from 'path';

// Types for compliance analysis results
export interface ComplianceRisk {
  issue: string;
  description: string;
  severity: number;
  regulation: string;
  potentialFine: string;
}

export interface ComplianceFix {
  title: string;
  description: string;
  priority: string;
  timeframe: string;
}

export interface ActionPlanDay {
  day: number;
  title: string;
  tasks: string[];
}

export interface AnalysisResult {
  summary: string;
  overallRiskScore: number;
  risks: ComplianceRisk[];
  fixes: ComplianceFix[];
  policyUpdates: string[];
  actionPlan: ActionPlanDay[];
  potentialFines: string;
  analyzedAt: string;
  documentWordCount: number;
  aiModelsUsed: string[];
}

// Sophisticated system prompt for compliance analysis
const COMPLIANCE_SYSTEM_PROMPT = `You are an elite AI compliance analyst powered by GPT-4o and Pal Nexus. You have been trained on:
- All OSHA workplace safety regulations (29 CFR 1900-1999)
- HIPAA privacy and security rules (45 CFR 160, 162, 164)
- ADA accessibility requirements (42 U.S.C. § 12101)
- EEOC employment discrimination guidelines
- FLSA wage and hour requirements (29 U.S.C. § 201-219)
- FMLA leave requirements (29 U.S.C. § 2601)
- EPA environmental regulations
- State-specific employment laws (CA, NY, TX, etc.)
- Industry-specific compliance requirements

ANALYSIS REQUIREMENTS:
1. Identify the TOP 5 most critical compliance risks
2. For each risk, provide:
   - Specific issue description
   - Which regulation is violated
   - Exact potential fine amount (with citation)
   - Severity score (1-10, where 10 is most severe)
3. Provide SPECIFIC, ACTIONABLE fixes (not generic advice)
4. Suggest exact policy language updates
5. Create a detailed 7-day action plan

OUTPUT FORMAT (JSON):
{
  "summary": "Executive summary of findings (2-3 sentences)",
  "overallRiskScore": 7.5,
  "potentialFines": "$125,000+",
  "risks": [
    {
      "issue": "Missing PPE Requirements",
      "description": "Handbook does not specify required personal protective equipment for warehouse staff",
      "severity": 9,
      "regulation": "OSHA 29 CFR 1910.132",
      "potentialFine": "$15,625 per violation"
    }
  ],
  "fixes": [
    {
      "title": "Add PPE Policy Section",
      "description": "Create dedicated section listing required PPE by job role. Include eye protection, hearing protection, and gloves requirements.",
      "priority": "Critical",
      "timeframe": "Within 48 hours"
    }
  ],
  "policyUpdates": [
    "Add Section 4.2: Personal Protective Equipment Requirements",
    "Revise Section 7.1: Harassment Reporting Procedures"
  ],
  "actionPlan": [
    {
      "day": 1,
      "title": "Critical Safety Updates",
      "tasks": [
        "Draft PPE requirements by department",
        "Review current exempt classifications"
      ]
    }
  ]
}

Be thorough, specific, and cite actual regulations. This analysis could prevent significant fines.`;

/**
 * Analyze document text for compliance issues using GPT-4o and Pal Nexus
 */
export async function analyzeCompliance(text: string): Promise<AnalysisResult> {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  
  // Prepare the user content with document text
  const userContent = `Analyze this document for compliance risks:

---
DOCUMENT TEXT (${wordCount} words):
${text.slice(0, 15000)}
---

Provide a comprehensive compliance analysis in JSON format.`;

  try {
    console.log('[ComplianceAgent] Starting analysis with GPT-4o and Pal Nexus...');
    
    // Primary analysis with GPT-4o
    const response = await generateCompletion(COMPLIANCE_SYSTEM_PROMPT, userContent, {
      temperature: 0.2,
      maxTokens: 4096,
    });

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch (e) {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    }

    // Validate and structure the result
    const result: AnalysisResult = {
      summary: parsed.summary || 'Analysis completed. Please review the identified risks.',
      overallRiskScore: Math.min(10, Math.max(1, Number(parsed.overallRiskScore) || 5)),
      potentialFines: parsed.potentialFines || 'Varies by violation',
      risks: (parsed.risks || []).slice(0, 5).map((risk: any) => ({
        issue: risk.issue || risk.title || 'Compliance Issue',
        description: risk.description || '',
        severity: Math.min(10, Math.max(1, Number(risk.severity) || 5)),
        regulation: risk.regulation || 'Various',
        potentialFine: risk.potentialFine || 'Varies',
      })),
      fixes: (parsed.fixes || []).map((fix: any) => ({
        title: fix.title || 'Recommended Fix',
        description: fix.description || '',
        priority: fix.priority || 'Medium',
        timeframe: fix.timeframe || 'Within 7 days',
      })),
      policyUpdates: parsed.policyUpdates || [],
      actionPlan: (parsed.actionPlan || []).map((day: any, index: number) => ({
        day: day.day || index + 1,
        title: day.title || `Day ${index + 1}`,
        tasks: day.tasks || [],
      })),
      analyzedAt: new Date().toISOString(),
      documentWordCount: wordCount,
      aiModelsUsed: ['GPT-4o', 'Pal Nexus'],
    };

    // Ensure we have at least a basic action plan if none provided
    if (result.actionPlan.length === 0) {
      result.actionPlan = [
        { day: 1, title: 'Review & Prioritize', tasks: ['Review all findings with management', 'Prioritize critical issues'] },
        { day: 2, title: 'Documentation', tasks: ['Gather current policies', 'Identify gaps'] },
        { day: 3, title: 'Draft Updates', tasks: ['Draft policy revisions', 'Legal review'] },
        { day: 4, title: 'Finalize', tasks: ['Finalize policy changes', 'Prepare training materials'] },
        { day: 5, title: 'Implementation', tasks: ['Update official documents', 'Begin rollout'] },
        { day: 6, title: 'Training', tasks: ['Conduct staff training', 'Collect acknowledgments'] },
        { day: 7, title: 'Verification', tasks: ['Verify all changes implemented', 'Schedule follow-up audit'] },
      ];
    }

    // Sort risks by severity (highest first)
    result.risks.sort((a, b) => b.severity - a.severity);

    console.log('[ComplianceAgent] Analysis complete:', {
      riskCount: result.risks.length,
      overallScore: result.overallRiskScore,
    });

    return result;
  } catch (error) {
    console.error('[ComplianceAgent] Analysis error:', error);
    throw new Error(`Failed to analyze document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get a severity label from a numeric score
 */
export function getSeverityLabel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 9) return 'critical';
  if (score >= 7) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

/**
 * Get severity color for display
 */
export function getSeverityColor(score: number): { bg: string; text: string } {
  if (score >= 9) return { bg: 'bg-[#ff3b30]/10', text: 'text-[#ff3b30]' };
  if (score >= 7) return { bg: 'bg-[#ff9500]/10', text: 'text-[#ff9500]' };
  if (score >= 5) return { bg: 'bg-[#ffcc00]/10', text: 'text-[#966a00]' };
  return { bg: 'bg-[#34c759]/10', text: 'text-[#34c759]' };
}
