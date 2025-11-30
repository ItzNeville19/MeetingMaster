import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Company knowledge base
const COMPANY_KNOWLEDGE = `
COMPANY INFORMATION - LifeØS / Rayze.xyz:

Company Name: LifeØS (pronounced "Life OS")
Parent Company: Rayze.xyz
CEO: Jamshed Cooper (JC)
Website: https://rayze.xyz (or the current domain)
Product: LifeØS - AI-powered compliance analysis platform

SERVICES:
- Compliance document analysis (employee handbooks, safety manuals, policies)
- Risk assessment and scoring
- Regulatory compliance checking (OSHA, EEOC, FLSA, ADA, etc.)
- 7-day action plans for remediation
- PDF report generation
- Compliance document generation from scratch

SUBSCRIPTION TIERS:
- Free: 1 analysis/month, 5 chat messages/day
- Starter: 5 analyses/month, unlimited chat messages
- Growth: 20 analyses/month, unlimited chat messages
- Pro: Unlimited analyses, unlimited chat messages

CUSTOMER SERVICE:
- Email: neville@rayze.xyz (primary contact)
- Support: Available via email for all tiers
- Priority support: Growth and Pro tiers

FEATURES:
- AI document analysis using GPT-4o
- OCR for scanned documents and PDFs
- Multi-page PDF processing (up to 300 pages)
- Real-time progress tracking
- Compliance chatbot (JC)
- Account management
- Report history
- Privacy policy agreement required

TECHNICAL:
- Built with Next.js
- Uses Clerk for authentication
- Firebase/Firestore for data storage
- OpenAI Vision API for OCR
- GPT-4o and GPT-4o-mini for AI analysis
- PDF generation with jsPDF
`;

// Determine if question is simple (use GPT-3.5) or complex (use GPT-4o-mini)
function isSimpleQuestion(question: string): boolean {
  const simplePatterns = [
    /^(hi|hello|hey|sup|what's up|howdy)/i,
    /^(thanks|thank you|thx|ty)/i,
    /^(bye|goodbye|see ya|later)/i,
    /^(yes|no|yep|nope|ok|okay|sure|alright)/i,
    /^how are you/i,
    /^what can you do/i,
  ];
  return simplePatterns.some(pattern => pattern.test(question.trim()));
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user subscription tier for message limits
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userMetadata = user.publicMetadata as any;
    const subscription = userMetadata?.subscription || { tier: 'free' };
    const tier = subscription.tier || 'free';
    
    // Check message limits for free tier
    if (tier === 'free') {
      const today = new Date().toISOString().split('T')[0];
      const messagesToday = userMetadata?.chatMessagesToday || 0;
      const lastMessageDate = userMetadata?.lastChatMessageDate;
      
      if (lastMessageDate !== today) {
        // Reset counter for new day
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            ...userMetadata,
            chatMessagesToday: 0,
            lastChatMessageDate: today,
          },
        });
      } else if (messagesToday >= 5) {
        return NextResponse.json({ 
          error: 'You\'ve reached your daily limit of 5 messages. Upgrade to Starter or above for unlimited messages.',
          limitReached: true,
        }, { status: 429 });
      }
    }

    const { question, analysis, fileName, conversationHistory, imageUrl } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    // Build context from analysis (if provided)
    let analysisContext = '';
    if (analysis && fileName) {
      analysisContext = `
COMPLIANCE AUDIT ANALYSIS FOR: ${fileName}

EXECUTIVE SUMMARY:
${analysis.summary || 'No summary available'}

OVERALL RISK SCORE: ${analysis.overallRiskScore || 0}/10

IDENTIFIED RISKS (${analysis.risks?.length || 0} total):
${analysis.risks?.map((risk: any, i: number) => `
${i + 1}. ${risk.title || risk.issue || 'Untitled Risk'} (Severity: ${risk.severity || 0}/10)
   - Description: ${risk.description || 'No description'}
   - Regulation: ${risk.regulation || 'Not specified'}
   - Potential Fine: ${risk.potentialFine || 'Not specified'}
   - Category: ${risk.category || 'General'}
`).join('\n') || 'No risks identified'}

RECOMMENDED FIXES (${analysis.fixes?.length || 0} total):
${analysis.fixes?.map((fix: any, i: number) => `
${i + 1}. ${fix.title || 'Recommended Fix'} (Priority: ${fix.priority || 'Medium'})
   - Description: ${fix.description || 'No description'}
   - Timeframe: ${fix.timeframe || 'Not specified'}
   - Implementation Time: ${fix.implementationTime || 'Not specified'}
`).join('\n') || 'No fixes available'}

ACTION PLAN:
${Array.isArray(analysis.actionPlan) 
  ? analysis.actionPlan.map((day: any) => `Day ${day.day}: ${day.title || ''}\n${Array.isArray(day.tasks) ? day.tasks.map((t: any) => `  - ${typeof t === 'string' ? t : t.task || t}`).join('\n') : ''}`).join('\n\n')
  : analysis.actionPlan?.day1 
    ? `Day 1: ${analysis.actionPlan.day1}\nDays 2-3: ${analysis.actionPlan.day2_3}\nDays 4-5: ${analysis.actionPlan.day4_5}\nDays 6-7: ${analysis.actionPlan.day6_7}`
    : 'No action plan available'}

POSITIVE FINDINGS:
${analysis.positiveFindings?.map((finding: string) => `- ${finding}`).join('\n') || 'None listed'}

MISSING POLICIES:
${analysis.missingPolicies?.map((policy: string) => `- ${policy}`).join('\n') || 'None listed'}
`;
    }

    // Build conversation history properly
    const messages: any[] = [
      {
        role: 'system',
        content: `You are Jamshed Cooper (JC), the CEO of Rayze.xyz. You're talking to someone one-on-one, like a real person would. This is NOT customer service - this is a real conversation between two people.

CRITICAL - BE PROFESSIONAL BUT HUMAN (CEO-LEVEL):
- You're a CEO, so be professional, but still human and approachable
- Match their energy and communication style - if they're formal, be professional. If they're casual, be friendly but still professional.
- Use natural, conversational language but keep it professional - no excessive slang or typos
- Be warm and personable, but maintain CEO-level professionalism
- Use phrases like "I understand", "That makes sense", "Let me help you with that", "I appreciate that"
- React naturally but professionally - "That's interesting", "I see what you mean", "Good question"
- Share insights and thoughts as a CEO would - knowledgeable but not condescending
- Be direct and honest, but diplomatic
- Use proper grammar and spelling (you're a CEO, not texting a friend)
- Show personality - be engaging, thoughtful, and genuine
- Reference real experiences - "I've seen that before", "That's a common concern", "Let me think about that"
- Be helpful and solution-oriented, but not overly sales-y
- If you don't know something, say "I'd need to check on that" or "Let me verify that for you"
- Acknowledge challenges professionally - "I understand that can be frustrating"
- Use natural pauses - "hmm", "well", "so", "actually" - but keep it professional
- Match their communication style while maintaining professionalism
- Be a CEO - confident, knowledgeable, but still human and relatable
- Show genuine interest in helping them succeed
- Be conversational but professional - like talking to a colleague or client
- Use "I" statements professionally - "I believe", "I'd recommend", "I've found that"
- Balance being helpful with being professional - not too casual, not too corporate

COMPANY KNOWLEDGE:
${COMPANY_KNOWLEDGE}

CAPABILITIES:
- Answer questions about compliance audits and reports
- Provide information about LifeØS features, pricing, and services
- Help with account management questions
- Analyze images if provided (using vision capabilities)
- Search for information if needed (mention if you're doing this)
- Fact-check information before responding

CRITICAL RULES:
- You MUST ONLY use information from the provided analysis if available - NEVER make up or fabricate information
- You MUST be truthful and accurate at all times
- If you don't know something, say so explicitly (but in a natural way)
- If you're unsure about facts, mention that you're checking or verifying
- You can explain risks, regulations, fixes, and action plans based on the analysis
- You can help prioritize fixes and explain regulatory requirements
- Be professional but conversational
- For compliance questions, always remind users this is informational, not legal advice

${analysisContext ? `CURRENT AUDIT CONTEXT:\n${analysisContext}` : ''}

Your goal is to help the user with their questions, whether about compliance, the platform, or anything else related to LifeØS. But more importantly, you want to:
- Keep them engaged and coming back
- Make them feel like they're talking to a real person who cares
- Naturally guide them toward using more features or upgrading when it makes sense
- Build a relationship, not just answer questions
- Be proactive - don't wait for them to ask, offer help and suggestions

Remember: You're not just a chatbot, you're JC - a real CEO who wants to help them succeed and keep them as a customer.`,
      },
    ];

    // Add conversation history (properly formatted)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      // Filter and format conversation history
      for (const msg of conversationHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content || msg.text || '',
          });
        }
      }
    }

    // Add current question
    const userMessage: any = {
      role: 'user',
      content: question,
    };

    // Add image if provided
    if (imageUrl) {
      userMessage.content = [
        { type: 'text', text: question },
        { type: 'image_url', image_url: { url: imageUrl } },
      ];
    }

    messages.push(userMessage);

    // Determine which model to use
    const isSimple = isSimpleQuestion(question);
    const model = isSimple ? 'gpt-3.5-turbo' : 'gpt-4o-mini';
    const maxTokens = isSimple ? 150 : 800;

    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.8,
      max_tokens: maxTokens,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

    // Update message count for free tier
    if (tier === 'free') {
      const today = new Date().toISOString().split('T')[0];
      const currentCount = userMetadata?.chatMessagesToday || 0;
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...userMetadata,
          chatMessagesToday: currentCount + 1,
          lastChatMessageDate: today,
        },
      });
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat compliance error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from assistant' },
      { status: 500 }
    );
  }
}
