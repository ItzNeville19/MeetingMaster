'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import NavBar from '@/components/NavBar';
import { useRouter, useSearchParams } from 'next/navigation';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// Position-specific question sets
const questionSets: Record<string, Question[]> = {
  'Senior Compliance AI Engineer': [
    {
      id: 1,
      question: 'You are building an OCR pipeline for compliance documents. A document contains both printed text and handwritten notes. Which approach would provide the highest accuracy for extracting structured compliance data?',
      options: [
        'Use GPT-4 Vision API with a single prompt for all text extraction',
        'Pre-process with image enhancement, use specialized OCR for printed text, then GPT-4 Vision for handwritten sections with context-aware prompts',
        'Convert entire document to text using Tesseract OCR, then parse with regex',
        'Use only Google Cloud Vision API with default settings'
      ],
      correctAnswer: 1,
      explanation: 'A multi-stage approach with specialized tools for different content types, combined with context-aware AI processing, yields the highest accuracy for compliance-critical data extraction.'
    },
    {
      id: 2,
      question: 'You need to implement a compliance risk scoring system. The AI model outputs a confidence score of 0.85 for a "High Risk" classification. However, the document contains ambiguous language. What is the most appropriate action?',
      options: [
        'Accept the classification as-is since confidence is above 0.8',
        'Flag for human review, provide context about ambiguity, and suggest manual verification',
        'Lower the risk score automatically to account for ambiguity',
        'Reject the classification and mark as "Unknown"'
      ],
      correctAnswer: 1,
      explanation: 'When dealing with ambiguous compliance-critical content, human review is essential. The system should flag uncertainty rather than make potentially costly assumptions.'
    },
    {
      id: 3,
      question: 'You are designing a system to analyze OSHA compliance across 10,000+ documents. The current GPT-4 API calls cost $0.03 per document and take 3 seconds each. What optimization strategy would be most effective?',
      options: [
        'Process all documents sequentially to avoid rate limits',
        'Implement document chunking, caching for similar documents, batch processing with parallel workers, and use cheaper models for initial screening',
        'Use only GPT-3.5-turbo for all documents to reduce costs',
        'Skip documents over 10 pages to save time'
      ],
      correctAnswer: 1,
      explanation: 'A multi-layered optimization approach combining caching, parallel processing, and intelligent model selection provides the best balance of cost, speed, and accuracy at scale.'
    },
    {
      id: 4,
      question: 'A compliance document contains a reference to "29 CFR 1910.1200" but the AI model incorrectly identifies it as "29 CFR 1910.120". This is a critical error. How would you prevent this?',
      options: [
        'Increase the model temperature for more creative interpretations',
        'Implement regex pattern matching for regulation citations, validate against a regulatory database, and use post-processing verification',
        'Use a smaller context window to focus the model',
        'Accept the error as acceptable since regulations are similar'
      ],
      correctAnswer: 1,
      explanation: 'Regulatory citations require exact accuracy. Combining pattern matching, database validation, and verification steps ensures critical compliance data is extracted correctly.'
    },
    {
      id: 5,
      question: 'You need to implement real-time compliance monitoring for regulatory changes. The system must detect when new OSHA regulations affect existing client documents. What architecture would be most robust?',
      options: [
        'Poll the OSHA website every 24 hours and re-analyze all documents',
        'Use webhooks from regulatory databases, maintain a versioned regulation knowledge base, implement incremental document re-analysis, and notify clients of affected sections',
        'Manually update regulations quarterly',
        'Only check regulations when a client uploads a new document'
      ],
      correctAnswer: 1,
      explanation: 'A proactive, event-driven architecture with versioned knowledge bases ensures clients are always aware of regulatory changes affecting their compliance status.'
    },
    {
      id: 6,
      question: 'You are implementing a document analysis system that processes sensitive HIPAA-protected information. What security measures are absolutely critical?',
      options: [
        'Basic encryption is sufficient',
        'End-to-end encryption, access controls, audit logging, data minimization, and compliance with HIPAA technical safeguards (45 CFR 164.312)',
        'Store everything in plain text for faster processing',
        'Only encrypt during transmission'
      ],
      correctAnswer: 1,
      explanation: 'HIPAA requires comprehensive security including encryption at rest and in transit, strict access controls, audit trails, and adherence to all technical safeguard requirements.'
    },
    {
      id: 7,
      question: 'Your AI model identifies a potential ADA violation with 88% confidence. The document mentions "reasonable accommodations" but lacks specific procedures. What is the appropriate action?',
      options: [
        'Mark it as low risk since accommodations are mentioned',
        'Flag as medium-high risk, note the lack of specific procedures, and recommend detailed accommodation request processes per ADA Title I requirements',
        'Ignore it - 88% is not high enough',
        'Automatically generate a fix without review'
      ],
      correctAnswer: 1,
      explanation: 'Mentioning accommodations without specific procedures is a compliance gap. ADA requires clear, documented processes for accommodation requests.'
    },
    {
      id: 8,
      question: 'A client uploads 500 documents for batch analysis. Your current system processes them sequentially, taking 2 hours total. How would you optimize this?',
      options: [
        'Process faster sequentially',
        'Implement parallel processing with worker pools, batch API calls, progress tracking, and error handling with retries',
        'Only process the first 100',
        'Tell the client to wait longer'
      ],
      correctAnswer: 1,
      explanation: 'Parallel processing with proper worker management, batching, and error handling can reduce processing time significantly while maintaining reliability.'
    },
    {
      id: 9,
      question: 'Your compliance analysis system needs to handle documents in multiple languages. What is the best approach?',
      options: [
        'Only support English',
        'Implement language detection, use multilingual models or translation APIs, and ensure regulatory knowledge bases cover target languages',
        'Ask users to translate first',
        'Use Google Translate for everything'
      ],
      correctAnswer: 1,
      explanation: 'A comprehensive multilingual system requires language detection, appropriate model selection, and localized regulatory knowledge for accurate compliance analysis.'
    },
    {
      id: 10,
      question: 'You discover a critical bug that causes false negatives in OSHA violation detection. The bug has been live for 2 weeks affecting 50+ clients. What is the ethical response?',
      options: [
        'Fix it quietly and hope no one notices',
        'Immediately fix the bug, notify affected clients, offer re-analysis of affected documents, and implement additional testing to prevent recurrence',
        'Blame it on the AI model',
        'Only fix it for new clients'
      ],
      correctAnswer: 1,
      explanation: 'Ethical software development requires transparency about critical bugs, immediate remediation, client notification, and prevention measures.'
    }
  ],
  'Musician Performer & Content Creator': [
    {
      id: 1,
      question: 'You are preparing for a professional recording session. The producer asks you to play a piece in 7/8 time signature with a tempo of 132 BPM. How many beats per measure, and what is the most common subdivision pattern?',
      options: [
        '7 beats per measure, typically subdivided as 2+2+3 or 3+2+2',
        '8 beats per measure, subdivided evenly as 4+4',
        '7 beats per measure, always subdivided as 3+4',
        '14 beats per measure, subdivided as 7+7'
      ],
      correctAnswer: 0,
      explanation: '7/8 time has 7 eighth-note beats per measure. The most common and musically natural subdivisions are 2+2+3 or 3+2+2, which create the characteristic "uneven" feel of compound time signatures.'
    },
    {
      id: 2,
      question: 'During a live performance, your monitor mix suddenly cuts out mid-song. What is the professional protocol?',
      options: [
        'Stop playing immediately and signal the sound engineer',
        'Continue performing, use visual cues from other musicians, maintain stage presence, and address the issue during the next break',
        'Point at the sound engineer and make angry gestures',
        'Walk off stage until the issue is fixed'
      ],
      correctAnswer: 1,
      explanation: 'Professional musicians maintain performance continuity despite technical issues. Visual communication and musical awareness allow the show to continue while issues are resolved.'
    },
    {
      id: 3,
      question: 'You are editing a music video and notice the audio is slightly out of sync with the video (audio is 2 frames ahead). The project is 30fps. How many milliseconds do you need to shift the audio?',
      options: [
        'Approximately 66.67 milliseconds backward',
        'Approximately 33.33 milliseconds forward',
        '2 milliseconds backward',
        '60 milliseconds forward'
      ],
      correctAnswer: 0,
      explanation: 'At 30fps, each frame is 33.33ms. If audio is 2 frames ahead, shift it back by 2 × 33.33ms = 66.67ms to sync properly.'
    },
    {
      id: 4,
      question: 'A client wants you to create content that uses a copyrighted song. They say "fair use" applies. What is the most legally sound approach?',
      options: [
        'Use the song since the client said it\'s fair use',
        'Obtain proper licensing, use royalty-free alternatives, or create original music. Fair use is complex and rarely applies to commercial content',
        'Use a 10-second clip which is always fair use',
        'Upload it and hope no one notices'
      ],
      correctAnswer: 1,
      explanation: 'Fair use is a complex legal doctrine that rarely applies to commercial content creation. Proper licensing protects both you and your client from legal issues.'
    },
    {
      id: 5,
      question: 'You are practicing a difficult passage that requires precise intonation. Your practice partner suggests using a drone tone. What is the primary benefit?',
      options: [
        'It makes the passage easier to play',
        'It provides a constant reference pitch, trains the ear for precise intonation, and develops tonal center awareness',
        'It covers up intonation mistakes',
        'It makes practice more fun'
      ],
      correctAnswer: 1,
      explanation: 'Drone tones provide constant reference pitch, train the ear for precise intonation, improve pitch accuracy, and develop tonal center awareness.'
    },
    {
      id: 6,
      question: 'How many hours per day should a professional musician practice to maintain and improve their skills?',
      options: [
        '1-2 hours is sufficient for professionals',
        '3-6 hours daily, with focused practice sessions, breaks, and deliberate practice techniques',
        '8+ hours non-stop for maximum improvement',
        'Practice is not necessary for professionals'
      ],
      correctAnswer: 1,
      explanation: 'Professional musicians typically practice 3-6 hours daily, using focused sessions with breaks. Quality and deliberate practice techniques matter more than raw hours.'
    },
    {
      id: 7,
      question: 'You are recording a violin part and notice intonation issues in the upper register. What is the most effective approach?',
      options: [
        'Use pitch correction software on everything',
        'Practice with a tuner, use drone tones, record multiple takes, and select the best performance',
        'Lower the volume so mistakes are less noticeable',
        'Record in a different key'
      ],
      correctAnswer: 1,
      explanation: 'Proper intonation requires ear training, reference pitches, and multiple takes. Software correction should be minimal and used only when necessary.'
    },
    {
      id: 8,
      question: 'A colleague sends you inappropriate messages after work hours. How should you handle this professionally?',
      options: [
        'Respond immediately to be polite',
        'Set clear boundaries, respond only to work-related communication during professional hours, document if harassment continues',
        'Ignore it completely',
        'Share it with everyone'
      ],
      correctAnswer: 1,
      explanation: 'Professional boundaries require addressing inappropriate communication firmly, maintaining work-appropriate responses, and documenting harassment if it persists.'
    },
    {
      id: 9,
      question: 'You are asked to perform a piece you have never heard before in 2 hours. What is your preparation strategy?',
      options: [
        'Wing it - professionals can play anything',
        'Analyze the score, identify difficult passages, practice those sections first, establish tempo and phrasing, and create a mental map of the piece',
        'Tell them you need more time',
        'Play a different piece instead'
      ],
      correctAnswer: 1,
      explanation: 'Professional preparation involves systematic analysis, prioritizing difficult sections, and creating a comprehensive understanding of the piece in the available time.'
    },
    {
      id: 10,
      question: 'During an orchestra rehearsal, the conductor asks for a different interpretation than you prepared. What is the professional response?',
      options: [
        'Argue that your interpretation is better',
        'Adapt immediately, listen to the conductor\'s vision, blend with the ensemble, and maintain professional demeanor',
        'Ignore the conductor and play your way',
        'Walk out of rehearsal'
      ],
      correctAnswer: 1,
      explanation: 'Orchestral playing requires flexibility, active listening, and the ability to adapt to the conductor\'s interpretation while maintaining ensemble cohesion.'
    },
    {
      id: 11,
      question: 'You notice a colleague is consistently late to rehearsals and unprepared. What is the appropriate professional action?',
      options: [
        'Confront them publicly during rehearsal',
        'Address it privately first, document patterns if it continues, and involve leadership if unprofessional behavior persists',
        'Ignore it - not your problem',
        'Complain to everyone else'
      ],
      correctAnswer: 1,
      explanation: 'Professional conflict resolution involves private communication first, documentation of patterns, and escalation only when necessary.'
    },
    {
      id: 12,
      question: 'A recording session runs over schedule due to technical issues. The client asks you to stay longer without additional pay. How do you handle this?',
      options: [
        'Stay as long as needed - be a team player',
        'Politely discuss overtime compensation, refer to your contract terms, and negotiate fair payment for extended time',
        'Leave immediately',
        'Complain loudly about unfair treatment'
      ],
      correctAnswer: 1,
      explanation: 'Professional boundaries include fair compensation. Discuss overtime terms respectfully and ensure contractual agreements are honored.'
    },
    {
      id: 13,
      question: 'You are editing a video and the client requests changes that will significantly reduce quality. What is the professional approach?',
      options: [
        'Do exactly what they ask without comment',
        'Explain the quality implications, offer alternative solutions that meet their goals while maintaining standards, and document their final decision',
        'Refuse to make the changes',
        'Make the changes but complain about it'
      ],
      correctAnswer: 1,
      explanation: 'Professional service includes educating clients about quality implications while respecting their final decisions and maintaining documentation.'
    },
    {
      id: 14,
      question: 'During a live stream, your internet connection becomes unstable. What is the best immediate action?',
      options: [
        'Stop the stream immediately',
        'Inform viewers of the issue, continue with reduced quality if possible, have backup connection ready, and maintain professionalism',
        'Pretend nothing is wrong',
        'Blame the platform'
      ],
      correctAnswer: 1,
      explanation: 'Professional content creators communicate technical issues transparently, adapt when possible, and always maintain backup solutions.'
    },
    {
      id: 15,
      question: 'You receive a negative comment on your content that includes personal attacks. How should you respond?',
      options: [
        'Respond with equal hostility',
        'Ignore personal attacks, address constructive criticism professionally if present, and maintain your brand voice',
        'Delete all comments',
        'Make a video calling them out'
      ],
      correctAnswer: 1,
      explanation: 'Professional content creators maintain composure, separate personal attacks from constructive feedback, and protect their brand reputation.'
    },
    {
      id: 16,
      question: 'A fellow musician asks you to collaborate, but their work ethic and professionalism have been questionable. What is the appropriate response?',
      options: [
        'Agree immediately to be supportive',
        'Set clear expectations, establish boundaries, and decline if professional standards cannot be met',
        'Agree but complain about it later',
        'Publicly criticize their work'
      ],
      correctAnswer: 1,
      explanation: 'Professional collaborations require clear expectations and boundaries. It\'s acceptable to decline if standards cannot be maintained.'
    },
    {
      id: 17,
      question: 'You are asked to perform a piece that contains culturally sensitive material you are not qualified to represent. What is the ethical approach?',
      options: [
        'Perform it anyway - music is universal',
        'Decline respectfully, suggest qualified performers, and explain the importance of authentic representation',
        'Perform it but change the meaning',
        'Perform it without acknowledging the cultural context'
      ],
      correctAnswer: 1,
      explanation: 'Cultural sensitivity and authentic representation are essential. Professionals recognize their limitations and defer to qualified representatives.'
    },
    {
      id: 18,
      question: 'During a recording, you make a mistake but the producer says "we\'ll fix it in post." What is your professional responsibility?',
      options: [
        'Accept it and move on',
        'Request another take to get it right, as post-production fixes should be minimal and used only when necessary',
        'Insist on perfect takes always',
        'Let them fix everything in post'
      ],
      correctAnswer: 1,
      explanation: 'Professional musicians strive for excellent live takes. Post-production should enhance, not replace, quality performance.'
    },
    {
      id: 19,
      question: 'You discover your original composition has been used without permission in a commercial. What are your legal options?',
      options: [
        'Do nothing - exposure is good',
        'Document the infringement, contact a music attorney, send a cease and desist, and pursue licensing or damages',
        'Post about it on social media only',
        'Use their content without permission in return'
      ],
      correctAnswer: 1,
      explanation: 'Intellectual property rights must be protected through proper legal channels. Documentation and professional legal representation are essential.'
    },
    {
      id: 20,
      question: 'A client requests content that promotes values you personally disagree with. How do you handle this professionally?',
      options: [
        'Do it anyway for the money',
        'Politely decline, explain your boundaries, and refer them to other creators if appropriate',
        'Do it but add subtle criticism',
        'Publicly shame the client'
      ],
      correctAnswer: 1,
      explanation: 'Professional boundaries include the right to decline work that conflicts with personal values, while maintaining respectful communication.'
    },
    {
      id: 21,
      question: 'You are preparing for an important audition. What is the optimal practice schedule in the final week?',
      options: [
        'Practice 12 hours daily right up to the audition',
        'Maintain consistent practice, increase intensity 2-3 days before, taper 1-2 days before, and rest the day of',
        'Don\'t practice at all to avoid burnout',
        'Only practice the day before'
      ],
      correctAnswer: 1,
      explanation: 'Optimal preparation: consistent practice, increased intensity 2-3 weeks before, tapering 1-2 days before, and rest on the day of performance.'
    },
    {
      id: 22,
      question: 'During a performance, you notice a string is about to break. What is the professional protocol?',
      options: [
        'Stop immediately and fix it',
        'Continue playing, prepare for the break, have backup instrument ready, and transition smoothly if it breaks',
        'Pretend you don\'t notice',
        'Make a dramatic scene'
      ],
      correctAnswer: 1,
      explanation: 'Professional musicians anticipate and prepare for technical issues, maintaining performance continuity while managing equipment problems.'
    },
    {
      id: 23,
      question: 'You are asked to create content with a very tight deadline that will require cutting corners on quality. What is the professional response?',
      options: [
        'Accept and do the best you can',
        'Negotiate realistic timeline, explain quality implications of rushing, and propose solutions that maintain standards',
        'Accept but deliver poor quality',
        'Refuse without explanation'
      ],
      correctAnswer: 1,
      explanation: 'Professional service includes honest communication about timelines and quality, with proactive solutions that protect your reputation.'
    },
    {
      id: 24,
      question: 'A fellow performer makes inappropriate advances during a work event. What is the appropriate professional response?',
      options: [
        'Ignore it to avoid drama',
        'Set clear boundaries immediately, document the incident, and report to appropriate authorities if it continues',
        'Respond in kind',
        'Quit the project immediately'
      ],
      correctAnswer: 1,
      explanation: 'Professional boundaries require immediate, clear communication, documentation of harassment, and proper reporting procedures.'
    },
    {
      id: 25,
      question: 'You are editing a video and realize you made an error that will require significant rework. What is the professional approach?',
      options: [
        'Hide the mistake and hope no one notices',
        'Inform the client immediately, explain the issue, provide timeline for correction, and take responsibility',
        'Blame the client for unclear instructions',
        'Deliver it anyway'
      ],
      correctAnswer: 1,
      explanation: 'Professional integrity requires transparency about mistakes, taking responsibility, and providing solutions rather than excuses.'
    },
    {
      id: 26,
      question: 'A client wants to use your performance in a way that violates your original agreement. How do you handle this?',
      options: [
        'Let them do whatever they want',
        'Review the contract, communicate the violation, negotiate terms, and protect your rights while maintaining relationship',
        'Sue them immediately',
        'Publicly call them out'
      ],
      correctAnswer: 1,
      explanation: 'Contractual agreements must be honored. Professional conflict resolution involves communication, negotiation, and legal protection when necessary.'
    },
    {
      id: 27,
      question: 'You are asked to perform a piece that is beyond your current technical ability. What is the honest professional response?',
      options: [
        'Accept and hope you can learn it in time',
        'Be honest about your limitations, suggest alternatives, or request adequate preparation time',
        'Accept and fake it',
        'Criticize the piece as too difficult'
      ],
      correctAnswer: 1,
      explanation: 'Professional honesty about abilities protects your reputation and ensures quality delivery. Overcommitting damages credibility.'
    },
    {
      id: 28,
      question: 'During a live performance, you completely forget a section of the piece. What is the professional recovery strategy?',
      options: [
        'Stop and start over',
        'Improvise musically appropriate material, maintain composure, and continue seamlessly',
        'Apologize profusely to the audience',
        'Walk off stage'
      ],
      correctAnswer: 1,
      explanation: 'Professional performers recover from mistakes seamlessly, using musical knowledge to improvise appropriate material while maintaining performance flow.'
    },
    {
      id: 29,
      question: 'You receive an offer for a high-profile gig that conflicts with a previous commitment to a smaller event. What is the ethical approach?',
      options: [
        'Cancel the small gig immediately',
        'Honor your original commitment unless the other party agrees to release you, maintaining professional integrity',
        'Try to do both and do both poorly',
        'Ghost the small gig'
      ],
      correctAnswer: 1,
      explanation: 'Professional integrity means honoring commitments. Breaking contracts damages reputation and relationships, regardless of opportunity size.'
    },
    {
      id: 30,
      question: 'You are creating content and realize you accidentally used copyrighted material without permission. What is the immediate professional action?',
      options: [
        'Publish it and hope no one notices',
        'Remove the material immediately, replace with licensed content, and ensure all future content is properly cleared',
        'Use it but add a disclaimer',
        'Blame someone else'
      ],
      correctAnswer: 1,
      explanation: 'Copyright compliance is non-negotiable. Immediate correction and prevention of future violations protects you and your clients legally.'
    }
  ],
  'Compliance Analyst': [
    {
      id: 1,
      question: 'An employee handbook states "employees may be required to work overtime as needed." What compliance risk does this present?',
      options: [
        'None - this is standard language',
        'FLSA violation: fails to specify overtime compensation, exempt vs non-exempt classification, and may violate state-specific overtime laws',
        'OSHA violation',
        'HIPAA violation'
      ],
      correctAnswer: 1,
      explanation: 'Vague overtime language without clear classification and compensation details violates FLSA requirements and can lead to significant back-pay claims.'
    },
    {
      id: 2,
      question: 'A company\'s safety manual references "OSHA standards" but doesn\'t cite specific regulations. What is the compliance issue?',
      options: [
        'No issue - general references are acceptable',
        'Lack of specificity makes enforcement difficult, fails to provide actionable guidance, and may not meet OSHA documentation requirements',
        'Too much detail',
        'OSHA doesn\'t require citations'
      ],
      correctAnswer: 1,
      explanation: 'Compliance documentation must be specific and actionable. General references don\'t provide the clarity needed for proper implementation and enforcement.'
    },
    {
      id: 3,
      question: 'A company\'s employee handbook states that FMLA leave is available but doesn\'t specify the 12-month period calculation method. What compliance risk exists?',
      options: [
        'No risk - FMLA is mentioned',
        'FMLA violation: must specify whether using calendar year, rolling 12-month, or 12-month period measured forward, as this affects eligibility',
        'Only a minor documentation issue',
        'FMLA doesn\'t require specific calculation methods'
      ],
      correctAnswer: 1,
      explanation: 'FMLA requires employers to specify and consistently apply their 12-month period calculation method. Ambiguity can lead to eligibility disputes and violations.'
    },
    {
      id: 4,
      question: 'A safety policy mentions "appropriate PPE" but doesn\'t list specific equipment by job role. What OSHA requirement is missing?',
      options: [
        'None - general mention is sufficient',
        'OSHA 1910.132 requires specific PPE identification by hazard and job function, training requirements, and maintenance procedures',
        'PPE doesn\'t need to be job-specific',
        'Only training is required'
      ],
      correctAnswer: 1,
      explanation: 'OSHA requires employers to conduct hazard assessments and specify exact PPE requirements for each job function, not just general mentions.'
    },
    {
      id: 5,
      question: 'An I-9 form is stored in an unlocked filing cabinet accessible to all employees. What compliance violations exist?',
      options: [
        'None - I-9s can be stored anywhere',
        'Multiple issues: unauthorized access to sensitive documents, potential privacy violations, and failure to implement proper document retention security as required by federal law',
        'Only a minor security issue',
        'I-9s don\'t require special storage'
      ],
      correctAnswer: 1,
      explanation: 'I-9 forms contain sensitive information and must be stored securely with access controls. Unauthorized access violates privacy requirements and document security standards.'
    },
    {
      id: 6,
      question: 'A company policy states employees can be terminated "at will" but doesn\'t mention protected classes or anti-discrimination policies. What is missing?',
      options: [
        'Nothing - at-will employment covers everything',
        'EEOC compliance requires explicit anti-discrimination policies, protected class definitions, and clear procedures for reporting discrimination',
        'At-will means no policies needed',
        'Only verbal communication is required'
      ],
      correctAnswer: 1,
      explanation: 'At-will employment doesn\'t override anti-discrimination laws. Companies must have explicit policies protecting against discrimination based on protected characteristics.'
    },
    {
      id: 7,
      question: 'A workplace safety manual references "lockout/tagout procedures" but provides no step-by-step instructions. What OSHA requirement is violated?',
      options: [
        'None - mentioning it is enough',
        'OSHA 1910.147 requires detailed written procedures for each piece of equipment, including specific steps, authorized personnel, and verification methods',
        'Only training is required',
        'General procedures are acceptable'
      ],
      correctAnswer: 1,
      explanation: 'OSHA lockout/tagout standards require equipment-specific written procedures with detailed steps. Generic references don\'t meet compliance requirements.'
    },
    {
      id: 8,
      question: 'An employee handbook mentions "reasonable accommodations" for disabilities but doesn\'t explain the interactive process. What ADA requirement is missing?',
      options: [
        'Nothing - mentioning accommodations is sufficient',
        'ADA requires explanation of the interactive process, how to request accommodations, documentation requirements, and timeline expectations',
        'Only verbal explanation is needed',
        'ADA doesn\'t require written procedures'
      ],
      correctAnswer: 1,
      explanation: 'ADA requires employers to have clear, documented processes for accommodation requests, including the interactive dialogue process between employer and employee.'
    },
    {
      id: 9,
      question: 'A company\'s harassment policy states "harassment will not be tolerated" but doesn\'t define what constitutes harassment. What compliance gap exists?',
      options: [
        'None - the statement is clear',
        'EEOC guidelines require specific definitions of prohibited conduct, examples of harassment types, protected characteristics, and reporting procedures',
        'Only training is required',
        'General statements are sufficient'
      ],
      correctAnswer: 1,
      explanation: 'Effective anti-harassment policies must define prohibited conduct specifically, provide examples, and establish clear reporting and investigation procedures.'
    },
    {
      id: 10,
      question: 'A safety manual mentions "emergency evacuation procedures" but doesn\'t include floor plans, assembly points, or evacuation routes. What OSHA requirement is missing?',
      options: [
        'None - mentioning evacuation is enough',
        'OSHA 1910.38 requires detailed emergency action plans including floor plans, primary/alternate routes, assembly locations, headcount procedures, and designated coordinators',
        'Only verbal instructions are needed',
        'General procedures are acceptable'
      ],
      correctAnswer: 1,
      explanation: 'OSHA emergency action plans must be comprehensive and site-specific, including visual aids like floor plans and detailed procedures for all emergency scenarios.'
    }
  ]
};

// Default questions if position not found
const defaultQuestions: Question[] = questionSets['Compliance Analyst'] || [];

export default function SkillsTestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const position = searchParams.get('position') || 'General Position';
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [testComplete, setTestComplete] = useState(false);
  const [strikes, setStrikes] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(true);
  const [faceAwayTime, setFaceAwayTime] = useState(0);
  const [lastFaceDetectedTime, setLastFaceDetectedTime] = useState(Date.now());
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceAwayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const questions = questionSets[position] || defaultQuestions;
  const isMusicPosition = position.includes('Musician');

  // Camera setup
  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user', 
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          
          // Ensure video plays
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().catch(err => {
                console.error('Error playing video:', err);
              });
            }
          };
          
          setCameraActive(true);
        }
      } catch (error) {
        console.error('Camera access denied:', error);
        setCameraActive(false);
      }
    };

    setupCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const addStrike = useCallback((reason: string) => {
    setStrikes(prev => {
      const newStrikes = prev + 1;
      if (newStrikes >= 3) {
        // Test failed - zero score
        setTestComplete(true);
        setScore(0);
        setTimeout(() => {
          alert(`❌ TEST FAILED\n\nYou received 3 strikes.\n\nYour score: 0/${questions.length}\n\nYou may retake the test by applying again.`);
        }, 100);
      } else {
        setTimeout(() => {
          alert(`⚠️ STRIKE ${newStrikes}/3\n\nReason: ${reason}\n\n${3 - newStrikes} strike(s) remaining. Stay focused!`);
        }, 100);
      }
      return newStrikes;
    });
  }, [questions.length]);

  // Tab switching detection - gives strikes
  useEffect(() => {
    if (!testStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addStrike('Tab switch detected');
      }
    };

    const handleBlur = () => {
      addStrike('Window focus lost');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [testStarted, addStrike]);

  // Face detection with strike system - looks away for 3+ seconds = strike
  useEffect(() => {
    if (!cameraActive || !testStarted || !videoRef.current || !canvasRef.current) return;

    const detectFace = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Simplified face detection - check for skin tones in center region
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const regionWidth = canvas.width * 0.4;
      const regionHeight = canvas.height * 0.4;

      let skinPixels = 0;
      for (let y = centerY - regionHeight/2; y < centerY + regionHeight/2; y += 4) {
        for (let x = centerX - regionWidth/2; x < centerX + regionWidth/2; x += 4) {
          const idx = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
          const r = imageData.data[idx];
          const g = imageData.data[idx + 1];
          const b = imageData.data[idx + 2];
          
          // Simple skin tone detection
          if (r > 95 && g > 40 && b > 20 && 
              Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
              Math.abs(r - g) > 15 && r > g && r > b) {
            skinPixels++;
          }
        }
      }

      const threshold = (regionWidth * regionHeight) / 16 * 0.1;
      const detected = skinPixels > threshold;
      setFaceDetected(detected);

      // Track face away time
      if (detected) {
        setLastFaceDetectedTime(Date.now());
        setFaceAwayTime(0);
        if (faceAwayTimerRef.current) {
          clearTimeout(faceAwayTimerRef.current);
          faceAwayTimerRef.current = null;
        }
      } else {
        const awayTime = (Date.now() - lastFaceDetectedTime) / 1000;
        setFaceAwayTime(awayTime);
        
        // If looking away for 3+ seconds, give a strike (only once per away period)
        if (awayTime >= 3 && !faceAwayTimerRef.current) {
          faceAwayTimerRef.current = setTimeout(() => {
            addStrike('Looking away from camera for 3+ seconds');
            // Reset timer so it can trigger again if they continue looking away
            setTimeout(() => {
              faceAwayTimerRef.current = null;
            }, 2000);
          }, 100);
        }
      }
    };

    const interval = setInterval(detectFace, 500);
    return () => {
      clearInterval(interval);
      if (faceAwayTimerRef.current) {
        clearTimeout(faceAwayTimerRef.current);
      }
    };
  }, [cameraActive, testStarted, lastFaceDetectedTime, faceDetected, addStrike]);

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    if (answerIndex === questions[currentQuestion].correctAnswer) {
      setScore(prev => prev + 1);
    }
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setTestComplete(true);
    }
  };

  const handleSubmit = () => {
    const percentage = Math.round((score / questions.length) * 100);
    const subject = encodeURIComponent(`Test Results - ${position}`);
    const body = encodeURIComponent(
      `Position: ${position}\nScore: ${score}/${questions.length} (${percentage}%)\n\nThank you for taking the assessment!`
    );
    window.location.href = `mailto:neville@rayze.xyz?subject=${subject}&body=${body}`;
  };

  // Intro/Start page
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <main className="pt-24 pb-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-[#1d1d1f] mb-4">
                Skills Assessment
              </h1>
              <p className="text-xl text-[#86868b] mb-2">
                Position: {position}
              </p>
              <p className="text-lg text-[#86868b]">
                {questions.length} Questions
              </p>
            </div>

            <div className="bg-[#f5f5f7] rounded-2xl p-8 mb-6">
              <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-4">Test Rules & Requirements</h2>
              <ul className="space-y-3 text-[#1d1d1f] mb-6">
                <li className="flex items-start gap-3">
                  <span className="text-[#ff3b30] font-bold">⚠️</span>
                  <span><strong>Camera Required:</strong> You must keep your camera on and face visible throughout the test</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff3b30] font-bold">⚠️</span>
                  <span><strong>Strike System:</strong> You have 3 strikes. Looking away for 3+ seconds or switching tabs = 1 strike. 3 strikes = automatic failure (0%)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#ff3b30] font-bold">⚠️</span>
                  <span><strong>No Tab Switching:</strong> Switching tabs or windows will result in a strike</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#34c759] font-bold">✓</span>
                  <span><strong>Stay Focused:</strong> Keep your face visible and stay on this page</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#34c759] font-bold">✓</span>
                  <span><strong>Take Your Time:</strong> Read each question carefully before answering</span>
                </li>
              </ul>

              {/* Camera Preview */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-[#1d1d1f] mb-2">Camera Preview:</p>
                <div className="relative inline-block bg-[#1d1d1f] rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-64 h-48 object-cover rounded-lg border-2 border-[#0071e3] bg-[#1d1d1f]"
                    style={{ transform: 'scaleX(-1)' }} // Mirror the video
                    onLoadedMetadata={(e) => {
                      const video = e.currentTarget;
                      video.play().catch(err => console.error('Play error:', err));
                    }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  {!cameraActive && (
                    <div className="absolute inset-0 bg-[#1d1d1f] rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-white/20 border-t-[#0071e3] rounded-full animate-spin mx-auto mb-2" />
                        <p>Requesting camera access...</p>
                      </div>
                    </div>
                  )}
                  {cameraActive && !faceDetected && (
                    <div className="absolute inset-0 bg-red-500/50 rounded-lg flex items-center justify-center text-white text-sm font-semibold z-10">
                      Face Not Detected
                    </div>
                  )}
                  {cameraActive && faceDetected && (
                    <div className="absolute bottom-2 left-2 bg-[#34c759] text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
                      ✓ Face Detected
                    </div>
                  )}
                </div>
                {!cameraActive && (
                  <p className="text-sm text-[#ff3b30] mt-2">⚠️ Camera access required to start the test</p>
                )}
              </div>

              <button
                onClick={() => {
                  if (!cameraActive) {
                    alert('Please allow camera access to continue');
                    return;
                  }
                  if (!faceDetected) {
                    alert('Please position yourself so your face is visible in the camera');
                    return;
                  }
                  setTestStarted(true);
                }}
                disabled={!cameraActive || !faceDetected}
                className="w-full px-8 py-4 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors disabled:bg-[#86868b] disabled:cursor-not-allowed"
              >
                {!cameraActive ? 'Waiting for Camera...' : !faceDetected ? 'Position Face in Camera' : 'Start Test'}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (testComplete) {
    const percentage = strikes >= 3 ? 0 : Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <main className="pt-24 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-[#1d1d1f] mb-4">
              {strikes >= 3 ? 'Test Failed' : 'Test Complete!'}
            </h1>
            <p className="text-2xl text-[#86868b] mb-2">
              Your Score: {score}/{questions.length} ({percentage}%)
            </p>
            {strikes >= 3 && (
              <p className="text-lg text-[#ff3b30] mb-4">
                You received 3 strikes and were disqualified
              </p>
            )}
            <p className="text-lg text-[#86868b] mb-8">
              Strikes: {strikes}/3
            </p>
            <button
              onClick={handleSubmit}
              className="px-8 py-4 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors"
            >
              Send Results via Email
            </button>
          </div>
        </main>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Camera Preview & Strikes */}
          <div className="mb-6">
            <div className="flex gap-4 items-center mb-4">
              <div className="relative bg-[#1d1d1f] rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-32 h-24 object-cover rounded-lg border-2 border-[#0071e3] bg-[#1d1d1f]"
                  style={{ transform: 'scaleX(-1)' }} // Mirror the video
                  onLoadedMetadata={(e) => {
                    const video = e.currentTarget;
                    video.play().catch(err => console.error('Play error:', err));
                  }}
                />
                <canvas ref={canvasRef} className="hidden" />
                {!cameraActive && (
                  <div className="absolute inset-0 bg-[#1d1d1f] rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-[#0071e3] rounded-full animate-spin" />
                  </div>
                )}
                {cameraActive && !faceDetected && (
                  <div className="absolute inset-0 bg-red-500/50 rounded-lg flex items-center justify-center text-white text-xs font-semibold z-10">
                    {faceAwayTime > 0 ? `Away: ${faceAwayTime.toFixed(1)}s` : 'Face Not Detected'}
                  </div>
                )}
                {cameraActive && faceDetected && (
                  <div className="absolute bottom-1 left-1 bg-[#34c759] text-white px-2 py-0.5 rounded text-xs font-semibold z-10">
                    ✓
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-full font-bold ${
                    strikes === 0 ? 'bg-[#34c759] text-white' :
                    strikes === 1 ? 'bg-[#ffcc00] text-[#966a00]' :
                    strikes === 2 ? 'bg-[#ff9500] text-white' :
                    'bg-[#ff3b30] text-white'
                  }`}>
                    Strikes: {strikes}/3
                  </div>
                  {!faceDetected && faceAwayTime > 0 && (
                    <div className="text-sm text-[#ff3b30] font-semibold">
                      ⚠️ Looking away: {faceAwayTime.toFixed(1)}s
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-[#86868b] mb-2">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>Score: {score}/{currentQuestion + 1}</span>
            </div>
            <div className="w-full bg-[#f5f5f7] rounded-full h-2">
              <div
                className="bg-[#0071e3] h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="bg-[#f5f5f7] rounded-2xl p-8 mb-6">
            <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-6">{question.question}</h2>
            
            <div className="space-y-3">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === question.correctAnswer;
                const showResult = showExplanation && isSelected;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={selectedAnswer !== null}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      showResult && isCorrect
                        ? 'bg-[#34c759] text-white'
                        : showResult && !isCorrect
                        ? 'bg-[#ff3b30] text-white'
                        : isSelected
                        ? 'bg-[#0071e3] text-white'
                        : 'bg-white hover:bg-[#e8e8ed] text-[#1d1d1f]'
                    } ${selectedAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-white rounded-xl"
              >
                <p className="text-[#1d1d1f]">
                  <strong>Explanation:</strong> {question.explanation}
                </p>
              </motion.div>
            )}
          </div>

          {/* Next Button */}
          {showExplanation && (
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors"
              >
                {currentQuestion < questions.length - 1 ? 'Next Question' : 'Complete Test'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
