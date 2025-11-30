import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { analyzeCompliance } from '@/agents/complianceAgent';
import { saveReportToFirestore } from '@/lib/firestore-rest';
import { v4 as uuidv4 } from 'uuid';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { businessInfo } = body;

    if (!businessInfo) {
      return NextResponse.json({ error: 'Business information is required' }, { status: 400 });
    }

    // CRITICAL VALIDATION: Ensure we have minimum required information
    const requiredFields = {
      businessName: businessInfo.businessName?.trim(),
      industry: businessInfo.industry?.trim(),
      employeeCount: businessInfo.employeeCount?.trim(),
      state: businessInfo.state?.trim(),
      businessStructure: businessInfo.businessStructure?.trim(),
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value || value.length === 0)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Missing required information',
        missingFields,
        message: `Please provide: ${missingFields.join(', ')}. We cannot generate accurate documents without this information.`,
      }, { status: 400 });
    }

    // If website URL is provided, we could scrape it for additional info (future enhancement)
    let websiteInfo = null;
    if (businessInfo.websiteUrl && businessInfo.websiteUrl.trim().length > 0) {
      try {
        // Validate URL format
        const url = new URL(businessInfo.websiteUrl);
        console.log('[GenerateDocuments] Website URL provided:', url.hostname);
        // TODO: Could add web scraping here to gather business info automatically
        websiteInfo = { url: businessInfo.websiteUrl, hostname: url.hostname };
      } catch (e) {
        console.warn('[GenerateDocuments] Invalid website URL format:', businessInfo.websiteUrl);
      }
    }

    // Generate comprehensive compliance documents using GPT-4 with ALL detailed information
    // IMPORTANT: This is GENERATING documents based on user input, NOT auditing existing documents
    // CRITICAL: Only use information provided - do NOT make up business details
    const prompt = `You are an expert compliance consultant GENERATING complete, ready-to-use compliance documents for a small business FROM SCRATCH.

CRITICAL REQUIREMENT - NO FABRICATION:
- You MUST ONLY use the business information provided below
- Do NOT invent, assume, or make up any business details
- If information is missing, use generic industry-standard language
- Do NOT create fictional addresses, phone numbers, or specific business details
- All documents must be based on ACTUAL information provided
- Compare against 50+ real regulations - use actual CFR, U.S.C., and state code citations

CRITICAL REQUIREMENTS:
1. Generate COMPLETE, FULLY-WRITTEN documents - NOT outlines, NOT templates, NOT placeholders
2. Every section must be fully written with complete policy language
3. Use the business information provided to customize EVERY section
4. Do NOT include any instructions, prompts, or meta-commentary in the output
5. Do NOT say "Here is a template" or "Fill in the blanks" - write the complete documents
6. Output ONLY the final documents - no explanations, no notes, no instructions
7. Make it production-ready - they should be able to use it immediately

IF INFORMATION IS MISSING:
- Use industry-standard defaults and best practices
- Make reasonable assumptions based on the business type and state
- Still generate complete documents - don't leave placeholders
- The documents should be usable even if some details are generic

DETAILED BUSINESS INFORMATION:

BASIC INFORMATION:
- Business Name: ${businessInfo.businessName}
- Industry: ${businessInfo.industry}
- Business Structure: ${businessInfo.businessStructure}
- Number of Employees: ${businessInfo.employeeCount}
- Primary Location/State: ${businessInfo.state}
- Year Established: ${businessInfo.yearEstablished || 'Not specified'}
- Website: ${businessInfo.websiteUrl || 'Not provided'}
${websiteInfo ? `\n\nNOTE: Business website is ${websiteInfo.url} - use this to inform your understanding of the business, but do NOT make up specific details not provided.` : ''}

WORK ENVIRONMENT:
- Work Environments: ${businessInfo.workEnvironment.join(', ') || 'Not specified'}
- Has Remote Workers: ${businessInfo.hasRemoteWorkers ? 'Yes' : 'No'}
- Has Warehouse: ${businessInfo.hasWarehouse ? 'Yes' : 'No'}
- Has Office: ${businessInfo.hasOffice ? 'Yes' : 'No'}
- Has Retail Space: ${businessInfo.hasRetailSpace ? 'Yes' : 'No'}
- Has Construction Sites: ${businessInfo.hasConstructionSites ? 'Yes' : 'No'}

JOB ROLES & EMPLOYEE TYPES:
- Job Roles: ${businessInfo.jobRoles.join(', ') || 'Not specified'}
- Has Hourly Employees (Non-Exempt): ${businessInfo.hasHourlyEmployees ? 'Yes' : 'No'}
- Has Salaried Employees: ${businessInfo.hasSalariedEmployees ? 'Yes' : 'No'}
- Has Exempt Employees: ${businessInfo.hasExemptEmployees ? 'Yes' : 'No'}
- Has Independent Contractors: ${businessInfo.hasContractors ? 'Yes' : 'No'}
- Pay Frequency: ${businessInfo.payFrequency || 'Not specified'}

BENEFITS:
- Offers Health Insurance: ${businessInfo.offersHealthInsurance ? 'Yes' : 'No'}
- Offers Retirement Plan: ${businessInfo.offersRetirementPlan ? 'Yes' : 'No'}
- Offers Paid Time Off: ${businessInfo.offersPaidTimeOff ? 'Yes' : 'No'}
- Offers Sick Leave: ${businessInfo.offersSickLeave ? 'Yes' : 'No'}

CURRENT DOCUMENTS:
- Has Employee Handbook: ${businessInfo.hasEmployeeHandbook ? 'Yes' : 'No'}
- Has Safety Manual: ${businessInfo.hasSafetyManual ? 'Yes' : 'No'}
- Has Policies: ${businessInfo.hasPolicies ? 'Yes' : 'No'}

COMPLIANCE REQUIREMENTS:
- Compliance Priorities: ${businessInfo.complianceConcerns.join(', ') || 'General compliance'}
- OSHA Requirements: ${businessInfo.hasOSHARequirements ? 'Yes - Required' : 'No'}
- HIPAA Requirements: ${businessInfo.hasHIPAARequirements ? 'Yes - Required' : 'No'}
- Data Privacy Concerns: ${businessInfo.hasDataPrivacyConcerns ? 'Yes' : 'No'}

SPECIFIC DETAILS:
- Specific Safety Concerns: ${businessInfo.specificSafetyConcerns || 'None specified'}
- Specific Policies Needed: ${businessInfo.specificPoliciesNeeded || 'None specified'}
- Industry-Specific Requirements: ${businessInfo.industrySpecificRequirements || 'None specified'}
- State-Specific Needs: ${businessInfo.stateSpecificNeeds || 'None specified'}

OUTPUT FORMAT:
Generate ONLY the final documents. Do NOT include:
- Instructions or prompts
- "Here is..." or "Below is..." statements
- Placeholder text like [COMPANY NAME] or [FILL IN]
- Notes about what to add later
- Explanations of what each section is

Start directly with the document content. For example, start with:

"EMPLOYEE HANDBOOK
${businessInfo.businessName}
Effective Date: ${new Date().toLocaleDateString()}

1. WELCOME LETTER
Dear Team Members,

Welcome to ${businessInfo.businessName}..."

CRITICAL: Generate SEPARATE, COMPLETE documents. Each document should be FULLY WRITTEN, COMPREHENSIVE, and VERY LONG (like Apple's employee handbook - thousands of words, very detailed). Write complete, detailed documents - NOT outlines, NOT summaries, but FULL comprehensive documents with every section fully written out.

Generate documents in this EXACT format with clear separators:

========== EMPLOYEE HANDBOOK ==========
   Write the COMPLETE, FULL employee handbook for ${businessInfo.businessName}. Include:
   - Their industry: ${businessInfo.industry}
   - Their business structure: ${businessInfo.businessStructure}
   - Their state: ${businessInfo.state} (include ALL state-specific requirements)
   - Their employee types: ${businessInfo.hasHourlyEmployees ? 'Hourly' : ''} ${businessInfo.hasSalariedEmployees ? 'Salaried' : ''} ${businessInfo.hasExemptEmployees ? 'Exempt' : ''} ${businessInfo.hasContractors ? 'Contractors' : ''}
   - Their work environments: ${businessInfo.workEnvironment.join(', ')}
   - Their job roles: ${businessInfo.jobRoles.join(', ')}
   
   Include ALL required sections:
   - Welcome Letter & Company Overview
   - At-Will Employment Statement (if applicable to ${businessInfo.state})
   - Equal Employment Opportunity Policy
   - Anti-Harassment & Anti-Discrimination Policy
   - Code of Conduct & Ethics
   - Workplace Safety Policy (OSHA-compliant if ${businessInfo.hasOSHARequirements})
   - Personal Protective Equipment (PPE) Requirements (if applicable)
   - Leave Policies:
     * Sick Leave (state-specific for ${businessInfo.state})
     * Vacation/PTO Policy (if ${businessInfo.offersPaidTimeOff})
     * FMLA Leave
     * Bereavement Leave
     * Jury Duty & Voting Leave
     * Military Leave (USERRA)
     * Pregnancy Accommodation
     * Disability Accommodation (ADA)
   - Pay & Compensation:
     * Pay Frequency: ${businessInfo.payFrequency}
     * Overtime Policy (for non-exempt employees)
     * Meal & Rest Break Requirements (state-specific for ${businessInfo.state})
   - Benefits (if offered):
     * Health Insurance: ${businessInfo.offersHealthInsurance ? 'Include details' : 'Not offered'}
     * Retirement Plan: ${businessInfo.offersRetirementPlan ? 'Include details' : 'Not offered'}
   - Performance Review Process
   - Discipline & Termination Procedures
   - Grievance/Complaint Procedure
   - Technology & Equipment Use Policy
   - Remote Work Policy (if ${businessInfo.hasRemoteWorkers})
   - Social Media Policy
   - Confidentiality & Non-Disclosure
   - Return of Company Property
   - Acknowledgment Page

========== SAFETY MANUAL ==========
   Create a comprehensive safety manual based on:
   - Work environments: ${businessInfo.workEnvironment.join(', ')}
   - Specific safety concerns: ${businessInfo.specificSafetyConcerns || 'General workplace safety'}
   - OSHA requirements: ${businessInfo.hasOSHARequirements ? 'Full OSHA compliance required' : 'Basic safety'}
   
   Include:
   - Emergency Procedures & Evacuation Plans
   - Personal Protective Equipment (PPE) Requirements by Job Role
   - Hazard Communication Program
   - Lockout/Tagout Procedures (if applicable to work environment)
   - Incident Reporting Procedures
   - Safety Training Requirements
   - Workplace Violence Prevention
   - Ergonomic Guidelines (if office work)
   - Specific procedures for: ${businessInfo.workEnvironment.join(', ')}

========== COMPLIANCE POLICIES ==========
   Create detailed policies for:
   ${businessInfo.complianceConcerns.map((c: string) => `   - ${c}`).join('\n')}
   ${businessInfo.hasHIPAARequirements ? '   - HIPAA Privacy & Security (Full compliance required)' : ''}
   ${businessInfo.hasDataPrivacyConcerns ? '   - Data Privacy & Protection' : ''}
   ${businessInfo.specificPoliciesNeeded ? `   - ${businessInfo.specificPoliciesNeeded}` : ''}
   
   Include state-specific policies for ${businessInfo.state}:
   ${businessInfo.stateSpecificNeeds || '   - All applicable state employment laws'}

========== INDUSTRY-SPECIFIC REQUIREMENTS ==========
   ${businessInfo.industrySpecificRequirements || `Include all compliance requirements specific to the ${businessInfo.industry} industry.`}

CRITICAL REQUIREMENTS:
- Make EVERYTHING specific to ${businessInfo.businessName} in ${businessInfo.state}
- Include exact state regulations and citations for ${businessInfo.state}
- Reference specific job roles: ${businessInfo.jobRoles.join(', ')}
- Address specific work environments: ${businessInfo.workEnvironment.join(', ')}
- Include exact policy language that can be used immediately
- Make it professional but accessible for small businesses
- Ensure all policies are legally compliant for ${businessInfo.state}
- Include all required disclaimers and legal protections
- Make it comprehensive - this is their complete compliance system

Format as a comprehensive, ready-to-use compliance document package.`;

    // Call OpenAI to generate documents
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert compliance consultant specializing in creating complete, production-ready compliance documents for small businesses.

CRITICAL OUTPUT REQUIREMENTS:
1. Generate COMPLETE documents - write every section fully, not outlines or templates
2. Output ONLY the final document text - no instructions, no explanations, no meta-commentary
3. Start directly with the document content (e.g., "EMPLOYEE HANDBOOK" or "1. WELCOME LETTER")
4. Write complete policy language that can be used immediately
5. Do NOT include placeholders like [COMPANY NAME] - use the actual business name provided
6. Do NOT say "Here is..." or "Below is..." - just write the documents
7. Make it professional and ready to use

CRITICAL LEGAL REQUIREMENT - ABSOLUTE TRUTHFULNESS:
- Use ONLY the business information provided by the user - do NOT invent details
- For missing details, use generic industry-standard language (e.g., "Company" instead of specific name if not provided)
- All policy language must be based on ACTUAL regulations from 50+ regulatory frameworks
- State regulations must be accurate and verifiable for the specified state
- Never create fictional business details, addresses, phone numbers, or specific information
- Compare against real regulations: OSHA (29 CFR), HIPAA (45 CFR), ADA (42 U.S.C., 28 CFR), EEOC (Title VII), FLSA (29 U.S.C.), FMLA (29 CFR 825), state laws
- Use exact regulation citations (e.g., "29 CFR 1910.132(a)" not "OSHA requires...")
- The generated documents should match what would be found if the user uploaded their actual employee handbook
- If information is missing, use placeholder language like "Company" or "the business" - do NOT make up specific details

Generate complete, ready-to-use compliance documents. Output ONLY the document text, nothing else.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 32000, // Very high limit for comprehensive, separate documents
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const openaiData = await openaiResponse.json();
    let generatedText = openaiData.choices[0]?.message?.content || '';

    // Split documents by separator markers
    const documentSeparator = /==========\s+([^=]+)\s+==========/g;
    const separateDocuments: Record<string, string> = {};
    
    // Extract each document section
    let lastIndex = 0;
    let match;
    let lastDocName = 'Compliance Documents';
    
    while ((match = documentSeparator.exec(generatedText)) !== null) {
      // Save previous document
      if (lastIndex > 0 || match.index > 0) {
        const docContent = generatedText.substring(lastIndex, match.index).trim();
        if (docContent.length > 50) {
          separateDocuments[lastDocName] = docContent;
        }
      }
      lastDocName = match[1].trim();
      lastIndex = match.index + match[0].length;
    }
    
    // Save last document
    if (lastIndex < generatedText.length) {
      const docContent = generatedText.substring(lastIndex).trim();
      if (docContent.length > 50) {
        separateDocuments[lastDocName] = docContent;
      }
    }
    
    // If no separators found, try to split by common document titles
    if (Object.keys(separateDocuments).length === 0) {
      const titlePatterns = [
        { name: 'Employee Handbook', regex: /(?:^|\n)(?:EMPLOYEE\s+HANDBOOK|EMPLOYEE\s+MANUAL|HANDBOOK)/i },
        { name: 'Safety Manual', regex: /(?:^|\n)(?:SAFETY\s+MANUAL|WORKPLACE\s+SAFETY|OSHA\s+MANUAL)/i },
        { name: 'Compliance Policies', regex: /(?:^|\n)(?:COMPLIANCE\s+POLICIES|POLICY\s+MANUAL|POLICIES)/i },
        { name: 'Code of Conduct', regex: /(?:^|\n)(?:CODE\s+OF\s+CONDUCT|ETHICS\s+POLICY|BUSINESS\s+CONDUCT)/i },
        { name: 'HR Policies', regex: /(?:^|\n)(?:HR\s+POLICIES|HUMAN\s+RESOURCES|HR\s+MANUAL)/i },
      ];
      
      const sections: Array<{ name: string; start: number }> = [];
      for (const pattern of titlePatterns) {
        const titleMatch = generatedText.match(pattern.regex);
        if (titleMatch && titleMatch.index !== undefined) {
          sections.push({ name: pattern.name, start: titleMatch.index });
        }
      }
      
      sections.sort((a, b) => a.start - b.start);
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const nextSection = sections[i + 1];
        const end = nextSection ? nextSection.start : generatedText.length;
        const content = generatedText.substring(section.start, end).trim();
        if (content.length > 50) {
          separateDocuments[section.name] = content;
        }
      }
    }
    
    // If still no separate documents, store as single document
    if (Object.keys(separateDocuments).length === 0) {
      separateDocuments['Compliance Documents'] = generatedText;
    }

    // Clean each separate document
    const promptPatterns = [
      /^.*?(?=EMPLOYEE HANDBOOK|SAFETY MANUAL|COMPLIANCE|WELCOME|INTRODUCTION|1\.|#)/i,
      /(?:^|\n)(?:Here is|Below is|I've created|I'll generate|This document|Note:|Important:|Please note:).*?(?=\n\n|\n[A-Z])/gi,
      /\[.*?\]/g,
      /TODO:|FILL IN|REPLACE|INSERT|ADD HERE/gi,
      /(?:^|\n)---.*?---/g,
      /==========\s+[^=]+\s+==========/g, // Remove separator markers from content
    ];
    
    for (const docName in separateDocuments) {
      let docContent = separateDocuments[docName];
      
      for (const pattern of promptPatterns) {
        docContent = docContent.replace(pattern, '');
      }
      
      // Ensure it starts with actual content
      const contentStart = docContent.search(/(?:EMPLOYEE HANDBOOK|SAFETY MANUAL|COMPLIANCE|WELCOME|INTRODUCTION|^1\.|^#)/i);
      if (contentStart > 0 && contentStart < 200) {
        docContent = docContent.substring(contentStart);
      }
      
      // Clean up instruction-like text
      docContent = docContent.replace(/^(?:\s|[\-\*])*(?:You are|Generate|Create|Write|Output|Here|Below).*?\n/gi, '');
      
      separateDocuments[docName] = docContent.trim();
    }
    
    // CRITICAL: Check if we need more information - analyze separate documents
    const totalLength = Object.values(separateDocuments).reduce((sum, doc) => sum + doc.length, 0);
    const avgDocLength = totalLength / Math.max(Object.keys(separateDocuments).length, 1);
    
    const isTooShort = totalLength < 10000 || avgDocLength < 2000; // Each document should be substantial
    const hasPlaceholders = Object.values(separateDocuments).some(doc => 
      /\[.*?\]|TODO:|FILL IN|REPLACE|INSERT|ADD HERE|not specified|please provide|need more information/i.test(doc)
    );
    const hasIncompleteSections = Object.values(separateDocuments).some(doc =>
      doc.split(/\n\n/).some(section => 
        section.length < 100 && (section.toLowerCase().includes('section') || section.toLowerCase().includes('policy'))
      )
    );

    // CRITICAL: If key information is missing, we MUST ask for more
    const missingKeyInfo = !businessInfo.businessName || 
                           !businessInfo.industry || 
                           !businessInfo.state ||
                           !businessInfo.employeeCount ||
                           businessInfo.jobRoles.length === 0 ||
                           businessInfo.workEnvironment.length === 0;
    
    const needsMoreInfo = missingKeyInfo || isTooShort || hasPlaceholders || hasIncompleteSections;
    
    // If needs more info, don't save yet - return status for chat flow
    if (needsMoreInfo) {
      return NextResponse.json({
        success: true,
        needsMoreInfo: true,
        partialDocuments: generatedText,
        businessInfo,
        message: 'I need a bit more information to create the most comprehensive documents for you. Let me ask you a few quick questions.',
      });
    }

    // Documents are complete - save the report with separate documents
    const reportId = uuidv4();
    const combinedDocuments = Object.values(separateDocuments).join('\n\n==========\n\n');
    
    const reportData = {
      id: reportId,
      userId,
      fileName: `${businessInfo.businessName} - Generated Compliance Documents`,
      fileUrl: '',
      analysis: {
        // Minimal structure - NO audit, NO risks, NO fixes
        summary: `Compliance documents generated from scratch for ${businessInfo.businessName} in ${businessInfo.industry} industry, located in ${businessInfo.state}.`,
        overallRiskScore: 0, // No risk score for generated documents
        risks: [], // NO risks - we just created these!
        fixes: [], // NO fixes - we just created these!
        policyUpdates: [], // NO policy updates needed
        actionPlan: [], // NO action plan - documents are ready to use
        positiveFindings: [`Generated comprehensive compliance documents including employee handbook, safety manual, and required policies for ${businessInfo.businessName}.`],
        generatedDocuments: combinedDocuments, // Combined for display
        separateDocuments: separateDocuments, // Separate documents for individual downloads
        businessInfo,
        isGeneratedDocument: true, // Flag to indicate this is a generated document, not an audit
        needsMoreInfo: needsMoreInfo, // Flag if we need more information
      },
      createdAt: new Date().toISOString(),
    };

    // PRIMARY: Save to Supabase
    let supabaseSuccess = false;
    try {
      const { saveReportToSupabase } = await import('@/lib/supabase');
      supabaseSuccess = await saveReportToSupabase(userId, {
        id: reportId,
        fileName: reportData.fileName,
        fileUrl: reportData.fileUrl,
        analysis: reportData.analysis,
        createdAt: reportData.createdAt,
      });
      if (supabaseSuccess) {
        console.log('[GenerateDocuments] Report saved to Supabase (PRIMARY), ID:', reportId);
      }
    } catch (supabaseError) {
      console.error('[GenerateDocuments] Supabase error (will try backups):', supabaseError);
    }

    // BACKUP 1: Save to Firestore
    let firestoreSuccess = false;
    try {
      if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
        const { saveReport } = await import('@/lib/firebase-admin');
        await saveReport(userId, {
          fileName: reportData.fileName,
          fileUrl: reportData.fileUrl,
          analysis: reportData.analysis,
          createdAt: new Date(),
        });
        firestoreSuccess = true;
        console.log('[GenerateDocuments] Report saved to Firestore Admin SDK (BACKUP 1), ID:', reportId);
      } else {
        const { saveReportToFirestore } = await import('@/lib/firestore-rest');
        await saveReportToFirestore(reportId, reportData);
        firestoreSuccess = true;
        console.log('[GenerateDocuments] Report saved to Firestore REST API (BACKUP 1), ID:', reportId);
      }
    } catch (firestoreError) {
      console.error('[GenerateDocuments] Firestore backup error:', firestoreError);
    }

    // If both failed, still return the report but with warning
    if (!supabaseSuccess && !firestoreSuccess) {
      return NextResponse.json({
        success: true,
        reportId,
        analysis: reportData.analysis,
        generatedText,
        warning: 'Report generated but could not be saved to database. It will be available in this session only. Please check your database configuration.',
      });
    }

    return NextResponse.json({
      success: true,
      reportId,
      analysis: reportData.analysis,
      generatedText: combinedDocuments,
      separateDocuments, // Return separate documents
    });
  } catch (error) {
    console.error('Document generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate documents' },
      { status: 500 }
    );
  }
}

