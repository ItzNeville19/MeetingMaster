import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { saveReportToSupabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { businessInfo, additionalInfo, conversationHistory, partialDocuments } = body;

    if (!businessInfo) {
      return NextResponse.json({ error: 'Business information is required' }, { status: 400 });
    }

    // Merge additional info from chat into businessInfo
    const mergedBusinessInfo = {
      ...businessInfo,
      ...additionalInfo,
      // Extract specific info from conversation
      conversationNotes: conversationHistory
        .filter((msg: any) => msg.role === 'user')
        .map((msg: any) => msg.content)
        .join(' | '),
    };

    // Generate comprehensive compliance documents with ALL information (including chat)
    const prompt = `You are an expert compliance consultant GENERATING complete, production-ready compliance documents for a small business FROM SCRATCH.

CRITICAL REQUIREMENT - NO FABRICATION:
- You MUST ONLY use the business information provided below
- Do NOT invent, assume, or make up any business details
- If information is missing, use generic industry-standard language
- Do NOT create fictional addresses, phone numbers, or specific business details
- All documents must be based on ACTUAL information provided
- Compare against 50+ real regulations - use actual CFR, U.S.C., and state code citations

CRITICAL: Generate SEPARATE, COMPLETE documents. Each document should be FULLY WRITTEN, COMPREHENSIVE, and VERY LONG if you have enough information. Write like Apple's employee handbook - detailed, professional, comprehensive. Do NOT create outlines - write complete, detailed documents.

Generate documents in this EXACT format with clear separators:

========== EMPLOYEE HANDBOOK ==========
Write a COMPREHENSIVE, DETAILED employee handbook (like Apple's - very thorough and complete). Include ALL sections fully written out with complete policy language. Make it LONG and DETAILED - this is a real employee handbook, not an outline.

========== SAFETY MANUAL ==========
Write a COMPREHENSIVE, DETAILED safety manual (like Apple's - very thorough and complete). Include ALL sections fully written out with complete procedures. Make it LONG and DETAILED.

========== COMPLIANCE POLICIES ==========
Write COMPREHENSIVE, DETAILED compliance policies. Include ALL sections fully written out. Make it LONG and DETAILED.

DETAILED BUSINESS INFORMATION:

BASIC INFORMATION:
- Business Name: ${mergedBusinessInfo.businessName}
- Industry: ${mergedBusinessInfo.industry}
- Business Structure: ${mergedBusinessInfo.businessStructure}
- Number of Employees: ${mergedBusinessInfo.employeeCount}
- Primary Location/State: ${mergedBusinessInfo.state}
- Year Established: ${mergedBusinessInfo.yearEstablished || 'Not specified'}
- Website: ${mergedBusinessInfo.websiteUrl || 'Not provided'}

ADDITIONAL INFORMATION FROM CONVERSATION:
${mergedBusinessInfo.conversationNotes ? `- Additional details: ${mergedBusinessInfo.conversationNotes}` : ''}

WORK ENVIRONMENT:
- Work Environments: ${mergedBusinessInfo.workEnvironment?.join(', ') || 'Not specified'}
- Has Remote Workers: ${mergedBusinessInfo.hasRemoteWorkers ? 'Yes' : 'No'}

JOB ROLES & EMPLOYEE TYPES:
- Job Roles: ${mergedBusinessInfo.jobRoles?.join(', ') || 'Not specified'}
- Has Hourly Employees: ${mergedBusinessInfo.hasHourlyEmployees ? 'Yes' : 'No'}
- Has Salaried Employees: ${mergedBusinessInfo.hasSalariedEmployees ? 'Yes' : 'No'}
- Has Exempt Employees: ${mergedBusinessInfo.hasExemptEmployees ? 'Yes' : 'No'}
- Has Contractors: ${mergedBusinessInfo.hasContractors ? 'Yes' : 'No'}
- Pay Frequency: ${mergedBusinessInfo.payFrequency || 'Not specified'}

BENEFITS:
- Offers Health Insurance: ${mergedBusinessInfo.offersHealthInsurance ? 'Yes' : 'No'}
- Offers Retirement Plan: ${mergedBusinessInfo.offersRetirementPlan ? 'Yes' : 'No'}
- Offers Paid Time Off: ${mergedBusinessInfo.offersPaidTimeOff ? 'Yes' : 'No'}
- Offers Sick Leave: ${mergedBusinessInfo.offersSickLeave ? 'Yes' : 'No'}

COMPLIANCE REQUIREMENTS:
- Compliance Priorities: ${mergedBusinessInfo.complianceConcerns?.join(', ') || 'General compliance'}
- OSHA Requirements: ${mergedBusinessInfo.hasOSHARequirements ? 'Yes - Required' : 'No'}
- HIPAA Requirements: ${mergedBusinessInfo.hasHIPAARequirements ? 'Yes - Required' : 'No'}
- Data Privacy Concerns: ${mergedBusinessInfo.hasDataPrivacyConcerns ? 'Yes' : 'No'}

SPECIFIC DETAILS:
- Specific Safety Concerns: ${mergedBusinessInfo.specificSafetyConcerns || 'None specified'}
- Specific Policies Needed: ${mergedBusinessInfo.specificPoliciesNeeded || 'None specified'}
- Industry-Specific Requirements: ${mergedBusinessInfo.industrySpecificRequirements || 'None specified'}
- State-Specific Needs: ${mergedBusinessInfo.stateSpecificNeeds || 'None specified'}

CRITICAL: Write COMPREHENSIVE, DETAILED documents like Apple's employee handbook. Each document should be VERY LONG, VERY DETAILED, and COMPLETE. Write every section fully - not outlines, not summaries, but complete policy language.`;

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
3. Start directly with the document content using separator markers: ========== DOCUMENT NAME ==========
4. Write complete policy language that can be used immediately
5. Do NOT include placeholders like [COMPANY NAME] - use the actual business name provided
6. Do NOT say "Here is..." or "Below is..." - just write the documents
7. Make it professional and ready to use
8. Write COMPREHENSIVE documents - like Apple's employee handbook - VERY LONG, VERY DETAILED, COMPLETE
9. Each document should be substantial (thousands of words) - write everything out fully

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

Generate complete, ready-to-use compliance documents. Output ONLY the document text with separator markers, nothing else.`,
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

    // Documents are complete - save the report with separate documents
    const reportId = uuidv4();
    const combinedDocuments = Object.values(separateDocuments).join('\n\n==========\n\n');
    
    const reportData = {
      id: reportId,
      userId,
      fileName: `${mergedBusinessInfo.businessName} - Generated Compliance Documents`,
      fileUrl: '',
      analysis: {
        summary: `Compliance documents generated from scratch for ${mergedBusinessInfo.businessName} in ${mergedBusinessInfo.industry} industry, located in ${mergedBusinessInfo.state}.`,
        overallRiskScore: 0,
        risks: [],
        fixes: [],
        policyUpdates: [],
        actionPlan: [],
        positiveFindings: [`Generated comprehensive compliance documents including employee handbook, safety manual, and required policies for ${mergedBusinessInfo.businessName}.`],
        generatedDocuments: combinedDocuments,
        separateDocuments: separateDocuments,
        businessInfo: mergedBusinessInfo,
        isGeneratedDocument: true,
        needsMoreInfo: false,
      },
      createdAt: new Date().toISOString(),
    };

    // PRIMARY: Save to Supabase
    let supabaseSuccess = false;
    try {
      supabaseSuccess = await saveReportToSupabase(userId, {
        id: reportId,
        fileName: reportData.fileName,
        fileUrl: reportData.fileUrl,
        analysis: reportData.analysis,
        createdAt: reportData.createdAt,
      });
      if (supabaseSuccess) {
        console.log('[ContinueGeneration] Report saved to Supabase (PRIMARY), ID:', reportId);
      }
    } catch (supabaseError) {
      console.error('[ContinueGeneration] Supabase error (will try backups):', supabaseError);
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
        console.log('[ContinueGeneration] Report saved to Firestore Admin SDK (BACKUP 1), ID:', reportId);
      } else {
        const { saveReportToFirestore } = await import('@/lib/firestore-rest');
        await saveReportToFirestore(reportId, reportData);
        firestoreSuccess = true;
        console.log('[ContinueGeneration] Report saved to Firestore REST API (BACKUP 1), ID:', reportId);
      }
    } catch (firestoreError) {
      console.error('[ContinueGeneration] Firestore backup error:', firestoreError);
    }

    if (!supabaseSuccess && !firestoreSuccess) {
      return NextResponse.json({
        success: true,
        reportId,
        analysis: reportData.analysis,
        generatedText: combinedDocuments,
        separateDocuments,
        warning: 'Report generated but could not be saved to database. It will be available in this session only.',
      });
    }

    return NextResponse.json({
      success: true,
      reportId,
      analysis: reportData.analysis,
      generatedText: combinedDocuments,
      separateDocuments,
    });
  } catch (error) {
    console.error('Continue generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to continue generation' },
      { status: 500 }
    );
  }
}
