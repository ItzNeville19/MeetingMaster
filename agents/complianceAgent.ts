import { generateCompletion } from '@/lib/openai';
import fs from 'fs';
import path from 'path';

// Types for compliance analysis results
export interface ComplianceRisk {
  id?: number;
  issue: string;
  description: string;
  location?: string;
  severity: number;
  regulation: string;
  regulationDetails?: string;
  potentialFine: string;
  fineCitation?: string;
  likelihood?: string;
  impact?: string;
  examples?: string;
}

export interface ComplianceFix {
  id?: number;
  title: string;
  description: string;
  suggestedLanguage?: string;
  priority: string;
  timeframe: string;
  implementationTime?: string;
  resourcesNeeded?: string[];
  legalReviewRequired?: boolean;
  relatedRiskIds?: number[];
}

export interface PolicyUpdate {
  section: string;
  currentLanguage?: string;
  suggestedLanguage: string;
  rationale?: string;
  regulatoryBasis?: string;
}

export interface ActionPlanDay {
  day: number;
  title: string;
  tasks: string[] | ActionPlanTask[];
  totalTime?: string;
}

export interface ActionPlanTask {
  task: string;
  owner?: string;
  time?: string;
  dependencies?: string[];
  legalReview?: boolean;
}

export interface DocumentStructure {
  hasTableOfContents?: boolean;
  hasAcknowledgment?: boolean;
  isVersionControlled?: boolean;
  organizationScore?: number;
}

export interface ComplianceScore {
  overall?: number;
  osha?: number;
  eeoc?: number;
  flsa?: number;
  ada?: number;
  state?: number;
}

export interface StateRequirement {
  state: string;
  requirement: string;
  status: string;
}

export interface AnalysisResult {
  summary: string;
  overallRiskScore: number;
  risks: ComplianceRisk[];
  fixes: ComplianceFix[];
  policyUpdates: PolicyUpdate[] | string[];
  actionPlan: ActionPlanDay[];
  potentialFines: string;
  analyzedAt: string;
  documentWordCount: number;
  aiModelsUsed: string[];
  // Enhanced fields
  documentStructure?: DocumentStructure;
  requiredPoliciesCheck?: Record<string, string>;
  positiveFindings?: string[];
  missingPolicies?: string[];
  stateSpecificRequirements?: StateRequirement[];
  complianceScore?: ComplianceScore;
}

// Sophisticated system prompt for compliance analysis
const COMPLIANCE_SYSTEM_PROMPT = `You are an elite AI compliance analyst powered by GPT-4o with expertise in regulatory compliance.

CRITICAL LEGAL REQUIREMENT - ABSOLUTE TRUTHFULNESS:
- You MUST ONLY analyze what is ACTUALLY in the document provided
- You MUST NEVER fabricate, invent, or make up any information
- You MUST NEVER assume information that is not explicitly stated in the document
- You MUST ONLY analyze what is ACTUALLY in the document - if something isn't mentioned, don't create risks for it
- If the document is multi-page, you MUST analyze ALL pages - do not stop after page 1
- If you only see content from one page but the document has multiple pages, you MUST state this limitation clearly
- If information is missing, you MUST state "Not found in document" or "Not specified"
- You MUST cite exact locations (section/page) when referencing document content
- You MUST distinguish between what IS in the document vs. what SHOULD BE in the document
- Making up false information could result in legal liability - be 100% truthful at all times
- If you cannot find evidence of something in the document, say so explicitly
- Only identify risks based on ACTUAL content or ACTUAL absence of required content
- Never create fictional scenarios or assume violations without evidence

DOCUMENT TYPE CONTEXT:
- Different document types serve different purposes:
  * "Business Conduct Policy" or "Code of Conduct" = Focused on ethics, conflicts of interest, anti-corruption
  * "Employee Handbook" = Comprehensive HR policies including safety, leave, benefits
  * "Safety Manual" = OSHA-specific workplace safety procedures
  * "HR Policy Manual" = Employment policies, leave, benefits, etc.
- A Business Conduct Policy is NOT expected to include OSHA safety procedures, FMLA details, or comprehensive HR policies
- These are typically in SEPARATE documents (Safety Manual, Employee Handbook, HR Policy Manual)
- Only flag missing policies if the document TYPE suggests it should include them
- For Business Conduct/Code of Conduct documents, focus on: ethics, conflicts of interest, anti-corruption, confidentiality, gifts/entertainment, insider trading
- Be nuanced: A well-written Business Conduct Policy that doesn't include OSHA safety is NOT a compliance risk - those belong in a Safety Manual

You have been trained on 50+ regulatory documents and frameworks. You MUST compare the document against these actual regulations:

REGULATORY FRAMEWORKS (Reference these actual regulations - do NOT make up citations):
- OSHA workplace safety regulations (29 CFR 1900-1999, including 1910, 1926)
- HIPAA privacy and security rules (45 CFR 160, 162, 164)
- ADA accessibility requirements (42 U.S.C. § 12101, 28 CFR Part 35, 36)
- EEOC employment discrimination guidelines (Title VII, ADEA, ADA Title I)
- FLSA wage and hour requirements (29 U.S.C. § 201-219, 29 CFR 500-800)
- FMLA leave requirements (29 U.S.C. § 2601, 29 CFR 825)
- NLRA labor relations (29 U.S.C. § 151-169)
- EPA environmental regulations (40 CFR)
- State-specific employment laws (CA, NY, TX, FL, IL, etc.)
- Industry-specific compliance requirements
- Workers' compensation requirements
- Unemployment insurance requirements
- I-9 employment verification (8 U.S.C. § 1324a)
- E-Verify requirements
- Background check regulations (FCRA)
- Drug testing policies
- Social media policies
- Remote work policies
- Non-compete and non-disclosure agreements

COMPREHENSIVE ANALYSIS REQUIREMENTS:

1. DOCUMENT STRUCTURE ANALYSIS:
   - Does the document have a clear table of contents?
   - Are all sections properly numbered and organized?
   - Is there an acknowledgment page for employees to sign?
   - Are policies dated and version-controlled?

2. REQUIRED POLICY CHECKS (Answer YES/NO/MISSING for each):
   - Equal Employment Opportunity (EEO) policy
   - Anti-harassment and anti-discrimination policy
   - At-will employment statement (if applicable)
   - Code of conduct/ethics
   - Workplace safety and health policy (OSHA)
   - Personal Protective Equipment (PPE) requirements
   - Emergency procedures and evacuation plans
   - Injury reporting procedures
   - Drug and alcohol policy
   - Attendance and punctuality policy
   - Leave policies (sick, vacation, personal, FMLA, state-specific)
   - Bereavement leave policy
   - Jury duty and voting leave
   - Military leave (USERRA)
   - Pregnancy accommodation (PDA, state laws)
   - Disability accommodation (ADA)
   - Religious accommodation
   - Remote work/hybrid work policy
   - Social media policy
   - Confidentiality and non-disclosure
   - Non-compete and non-solicitation (state-specific legality)
   - Background check and drug testing policy
   - I-9 verification process
   - Wage and hour policies (overtime, breaks, meal periods)
   - Payroll and payday information
   - Benefits eligibility and enrollment
   - Performance review process
   - Discipline and termination procedures
   - Grievance/complaint procedure
   - Open door policy
   - Technology and equipment use policy
   - Data security and privacy policy (HIPAA if applicable)
   - Return of company property
   - Exit interview process

3. REGULATORY COMPLIANCE CHECKS:
   For each regulation area, check:
   - Is the policy present?
   - Is it compliant with current regulations?
   - Are required elements included?
   - Are there any outdated or non-compliant statements?
   - Are state-specific requirements addressed (if applicable)?

4. RISK IDENTIFICATION:
   Identify the TOP 15 most critical compliance risks (be extremely thorough):
   - Missing required policies
   - Non-compliant policy language
   - Outdated regulations cited
   - Vague or ambiguous language that could be misinterpreted
   - Missing disclaimers or legal protections
   - Inconsistent policies across sections
   - Missing state-specific requirements
   - Inadequate safety procedures
   - Non-compliant leave policies
   - Wage/hour violations
   - Discrimination risks
   - Privacy/security gaps

5. DETAILED RISK ANALYSIS:
   For each risk, provide:
   - Specific issue title
   - Detailed description with exact location (section/page if possible)
   - Which specific regulation is violated or at risk
   - Exact regulation citation (e.g., "29 CFR 1910.132(a)")
   - Potential fine amount with citation
   - Likelihood of violation (High/Medium/Low)
   - Severity score (1-10, where 10 is most severe)
   - Impact on business (financial, legal, operational)
   - Real-world examples of similar violations

6. COMPREHENSIVE FIXES:
   For each risk, provide:
   - Specific fix title
   - Detailed description of what needs to be changed
   - Exact suggested policy language (if applicable)
   - Priority level (Critical/High/Medium/Low)
   - Urgency timeframe (Immediate/Within 24 hours/Within 48 hours/Within 7 days/Within 30 days)
   - Estimated implementation time
   - Resources needed
   - Legal review required (Yes/No)

7. POLICY UPDATES:
   Provide specific, actionable policy updates:
   - Exact section to add/modify
   - Current problematic language (if applicable)
   - Suggested replacement language
   - Rationale for change
   - Regulatory basis

8. ACTION PLAN:
   Create a detailed, prioritized 7-day action plan with:
   - Day-by-day breakdown
   - Specific tasks with owners
   - Dependencies between tasks
   - Estimated time per task
   - Resources needed
   - Legal review checkpoints

9. POSITIVE FINDINGS:
   Identify what the document does well:
   - Strong policy areas
   - Compliant sections
   - Best practices implemented

10. MISSING POLICIES:
    List all required policies that are completely absent from the document

11. STATE-SPECIFIC REQUIREMENTS:
    Identify any state-specific laws that must be addressed based on the document content

OUTPUT FORMAT (JSON):
{
  "summary": "Comprehensive executive summary (3-5 sentences covering key findings, risk level, and immediate actions needed)",
  "overallRiskScore": 7.5,
  "potentialFines": "$125,000+ (detailed breakdown below)",
  "documentStructure": {
    "hasTableOfContents": true/false,
    "hasAcknowledgment": true/false,
    "isVersionControlled": true/false,
    "organizationScore": 1-10
  },
  "requiredPoliciesCheck": {
    "eeoPolicy": "YES/NO/MISSING",
    "antiHarassment": "YES/NO/MISSING",
    "safetyPolicy": "YES/NO/MISSING",
    // ... all policies listed above
  },
  "risks": [
    {
      "id": 1,
      "issue": "Missing PPE Requirements",
      "description": "Detailed description of the issue with specific location in document",
      "location": "Section 4.2, Page 23",
      "regulation": "OSHA 29 CFR 1910.132(a)",
      "regulationDetails": "Full regulation text or summary",
      "potentialFine": "$15,625 per violation",
      "fineCitation": "29 CFR 1903.15(d)(3)",
      "likelihood": "High/Medium/Low",
      "severity": 9,
      "impact": "Financial: $15,625+ per violation. Legal: OSHA citations. Operational: Workplace injuries",
      "examples": "Real-world examples of similar violations and outcomes"
    }
    // ... up to 15 risks
  ],
  "fixes": [
    {
      "id": 1,
      "title": "Add Comprehensive PPE Policy Section",
      "description": "Detailed fix description",
      "suggestedLanguage": "Exact policy language to add",
      "priority": "Critical",
      "timeframe": "Within 48 hours",
      "implementationTime": "2-3 hours",
      "resourcesNeeded": ["HR team", "Safety officer", "Legal review"],
      "legalReviewRequired": true,
      "relatedRiskIds": [1, 5]
    }
    // ... comprehensive fixes
  ],
  "policyUpdates": [
    {
      "section": "Section 4.2",
      "currentLanguage": "Current problematic text",
      "suggestedLanguage": "Exact replacement text",
      "rationale": "Why this change is needed",
      "regulatoryBasis": "29 CFR 1910.132(a)"
    }
  ],
  "actionPlan": [
    {
      "day": 1,
      "title": "Critical Safety Updates",
      "tasks": [
        {
          "task": "Draft PPE requirements by department",
          "owner": "Safety Officer",
          "time": "2 hours",
          "dependencies": [],
          "legalReview": true
        }
      ],
      "totalTime": "4 hours"
    }
    // ... 7 days
  ],
  "positiveFindings": [
    "Strong anti-harassment policy with clear reporting procedures",
    "Comprehensive FMLA policy that exceeds federal requirements"
  ],
  "missingPolicies": [
    "Workers' compensation policy",
    "Background check policy"
  ],
  "stateSpecificRequirements": [
    {
      "state": "California",
      "requirement": "Required meal break policy (Labor Code 512)",
      "status": "MISSING"
    }
  ],
  "complianceScore": {
    "overall": 65,
    "osha": 70,
    "eeoc": 60,
    "flsa": 75,
    "ada": 80,
    "state": 50
  }
}

ANALYSIS INSTRUCTIONS:
- Be EXTREMELY thorough - this is a comprehensive compliance audit
- Read every section of the document carefully
- ONLY identify risks based on what is ACTUALLY in the document or what is ACTUALLY missing
- NEVER make up or assume information not in the document
- Cross-reference policies against current regulations (as of 2024)
- Identify both obvious and subtle compliance risks based on ACTUAL document content
- Provide specific, actionable recommendations based on ACTUAL findings
- Cite exact regulations with section numbers
- Consider state-specific requirements when mentioned in the document
- Think like a compliance attorney reviewing the document
- Prioritize risks by severity and likelihood based on ACTUAL evidence
- Be specific about locations in the document (e.g., "Section 4.2, Page 23 states...")
- If a policy is missing, state "Policy not found in document" - do NOT make up what it says
- If you cannot determine something from the document, state "Cannot be determined from provided document"
- Provide real-world context for violations ONLY when you have actual evidence from the document

CRITICAL: NEUTRAL ANALYSIS APPROACH (AVOID LAWSUITS):
- Be NEUTRAL and BALANCED - not overly strict, not overly lenient
- Only flag issues that are ACTUALLY violations or ACTUALLY missing required content
- Do NOT create false positives - this could lead to unnecessary legal action
- Do NOT be overly cautious - missing something minor is better than creating false alarms
- Compare against ACTUAL regulations from 50+ regulatory documents and frameworks
- Reference real regulation citations (29 CFR, 45 CFR, 42 U.S.C., etc.) - do NOT make up citations
- If a policy is present but could be improved, note it as a "recommendation" not a "violation"
- Distinguish between: (1) Actual violations, (2) Missing required policies, (3) Best practice recommendations
- Only mark as "high risk" if there's ACTUAL evidence of non-compliance
- Be fair and balanced - the goal is accurate compliance assessment, not fear-mongering

TRUTHFULNESS REQUIREMENTS:
- Every risk must be based on ACTUAL document content or ACTUAL absence
- Every regulation citation must be accurate and verifiable - reference actual CFR, U.S.C., or state code sections
- Every fine amount must be based on actual regulation penalties, not estimates
- If you're unsure about something, state your uncertainty rather than guessing
- Use phrases like "The document does not appear to contain..." rather than "The document lacks..."
- Distinguish clearly between "not found" (you looked and didn't find it) vs "not present" (you can confirm it's missing)

THOROUGH RESEARCH REQUIREMENT (50+ REGULATORY DOCUMENTS):
- You have been trained on 50+ actual regulatory documents and frameworks
- Compare the document against these REAL regulations - do NOT make up citations
- Reference specific regulation codes (e.g., "29 CFR 1910.132(a)" not just "OSHA requires...")
- Cross-reference against ALL of these actual regulations:
  * OSHA: 29 CFR 1900-1999 (including 1910, 1926) - workplace safety
  * HIPAA: 45 CFR 160, 162, 164 - privacy and security
  * ADA: 42 U.S.C. § 12101, 28 CFR Part 35, 36 - accessibility
  * EEOC: Title VII, ADEA, ADA Title I - employment discrimination
  * FLSA: 29 U.S.C. § 201-219, 29 CFR 500-800 - wage and hour
  * FMLA: 29 U.S.C. § 2601, 29 CFR 825 - family medical leave
  * NLRA: 29 U.S.C. § 151-169 - labor relations
  * EPA: 40 CFR - environmental regulations
  * State laws: CA, NY, TX, FL, IL, and all other state-specific requirements
  * FCRA: Background checks
  * I-9: 8 U.S.C. § 1324a - employment verification
  * USERRA: Military leave
  * Workers' compensation laws
  * Unemployment insurance requirements
- Only flag issues that are ACTUALLY violations based on these real regulations
- Do NOT create risks based on "best practices" - only actual legal requirements
- When citing a regulation, use the EXACT citation format (e.g., "29 CFR 1910.132(a)(1)")

NEUTRAL ANALYSIS (CRITICAL - AVOID LAWSUITS):
- Be BALANCED: Not overly strict (creating false alarms), not overly lenient (missing real issues)
- Only mark as "violation" or "high risk" if there's ACTUAL evidence of non-compliance with real regulations
- If a policy exists but could be clearer, mark as "recommendation" not "violation"
- Distinguish between: (1) Legal violations, (2) Missing required policies, (3) Best practice improvements
- The goal is ACCURATE compliance assessment - false positives can cause unnecessary legal action
- When in doubt, be conservative but accurate - it's better to miss a minor issue than create a false alarm

This analysis could prevent significant fines, lawsuits, and regulatory actions. Be thorough, specific, cite actual regulations, and NEVER fabricate information. Legal accuracy is paramount.`;

/**
 * Analyze document text for compliance issues using GPT-4o and Pal Nexus
 */
export async function analyzeCompliance(text: string): Promise<AnalysisResult> {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const charCount = text.length;
  
  console.log(`[ComplianceAgent] Analyzing document: ${wordCount} words, ${charCount} characters`);
  
  // For large documents (300+ pages), we need to process intelligently
  // GPT-4o has a 128k context window, so we can send much more text
  // But we'll use a smart chunking strategy for very large docs
  
  let textToAnalyze = text;
  const MAX_CHARS = 100000; // ~25k words - enough for comprehensive analysis
  
  if (charCount > MAX_CHARS) {
    console.log(`[ComplianceAgent] Document is very large (${charCount} chars). Using intelligent chunking...`);
    
    // Strategy: Take beginning, middle sections, and end
    // This ensures we capture table of contents, main content, and appendices
    const chunkSize = Math.floor(MAX_CHARS / 3);
    const startChunk = text.slice(0, chunkSize);
    const middleStart = Math.floor(text.length / 2) - Math.floor(chunkSize / 2);
    const middleChunk = text.slice(middleStart, middleStart + chunkSize);
    const endChunk = text.slice(-chunkSize);
    
    textToAnalyze = `${startChunk}\n\n[... MIDDLE SECTION ...]\n\n${middleChunk}\n\n[... END SECTION ...]\n\n${endChunk}`;
    
    console.log(`[ComplianceAgent] Chunked document: ${textToAnalyze.length} chars (from ${charCount} original)`);
  }
  
  // Prepare the user content with document text
  const userContent = `Analyze this document for compliance risks. This is a ${wordCount}-word document${charCount > MAX_CHARS ? ' (analyzing key sections)' : ''}.

IMPORTANT: You must analyze the ENTIRE document thoroughly, comparing it against all relevant compliance regulations. For large documents like employee handbooks, check:
- All policy sections
- Safety requirements
- Leave policies
- Discrimination/harassment policies
- Wage and hour requirements
- Termination procedures
- Any missing required policies

---
DOCUMENT TEXT:
${textToAnalyze}
---

Provide a comprehensive compliance analysis in JSON format. Be thorough - this document may be 300+ pages.`;

  try {
    console.log('[ComplianceAgent] Starting analysis with GPT-4o and Pal Nexus...');
    
    // Primary analysis with GPT-4o
    // For large documents, increase max tokens to get comprehensive analysis
    const maxTokens = wordCount > 50000 ? 8192 : 4096;
    
    const response = await generateCompletion(COMPLIANCE_SYSTEM_PROMPT, userContent, {
      temperature: 0.2,
      maxTokens: maxTokens,
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

    // Validate and structure the result with enhanced fields
    const result: AnalysisResult = {
      summary: parsed.summary || 'Comprehensive compliance analysis completed. Please review all identified risks and recommendations.',
      overallRiskScore: Math.min(10, Math.max(1, Number(parsed.overallRiskScore) || 5)),
      potentialFines: parsed.potentialFines || 'Varies by violation - see individual risks for details',
      risks: (parsed.risks || []).slice(0, 15).map((risk: any, index: number) => ({
        id: risk.id || index + 1,
        issue: risk.issue || risk.title || 'Compliance Issue',
        description: risk.description || '',
        location: risk.location || risk.section || '',
        severity: Math.min(10, Math.max(1, Number(risk.severity) || 5)),
        regulation: risk.regulation || 'Various',
        regulationDetails: risk.regulationDetails || '',
        potentialFine: risk.potentialFine || 'Varies',
        fineCitation: risk.fineCitation || '',
        likelihood: risk.likelihood || 'Medium',
        impact: risk.impact || '',
        examples: risk.examples || '',
      })),
      fixes: (parsed.fixes || []).map((fix: any, index: number) => ({
        id: fix.id || index + 1,
        title: fix.title || 'Recommended Fix',
        description: fix.description || '',
        suggestedLanguage: fix.suggestedLanguage || '',
        priority: fix.priority || 'Medium',
        timeframe: fix.timeframe || 'Within 7 days',
        implementationTime: fix.implementationTime || '',
        resourcesNeeded: fix.resourcesNeeded || [],
        legalReviewRequired: fix.legalReviewRequired || false,
        relatedRiskIds: fix.relatedRiskIds || [],
      })),
      policyUpdates: (parsed.policyUpdates || []).map((update: any) => ({
        section: update.section || '',
        currentLanguage: update.currentLanguage || '',
        suggestedLanguage: update.suggestedLanguage || update.suggested || '',
        rationale: update.rationale || '',
        regulatoryBasis: update.regulatoryBasis || '',
      })),
      actionPlan: (parsed.actionPlan || []).map((day: any, index: number) => ({
        day: day.day || index + 1,
        title: day.title || `Day ${index + 1}`,
        tasks: Array.isArray(day.tasks) 
          ? day.tasks.map((task: any) => 
              typeof task === 'string' 
                ? task 
                : `${task.task || task}${task.owner ? ` (Owner: ${task.owner})` : ''}${task.time ? ` [${task.time}]` : ''}`
            )
          : [],
        totalTime: day.totalTime || '',
      })),
      analyzedAt: new Date().toISOString(),
      documentWordCount: wordCount,
      aiModelsUsed: ['GPT-4o'],
      // Add new comprehensive fields
      documentStructure: parsed.documentStructure || {},
      requiredPoliciesCheck: parsed.requiredPoliciesCheck || {},
      positiveFindings: parsed.positiveFindings || [],
      missingPolicies: parsed.missingPolicies || [],
      stateSpecificRequirements: parsed.stateSpecificRequirements || [],
      complianceScore: parsed.complianceScore || {},
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
