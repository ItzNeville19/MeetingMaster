'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '@/components/NavBar';
import ComplianceChatbot from '@/components/ComplianceChatbot';
import { useUser } from '@clerk/nextjs';
import { jsPDF } from 'jspdf';

interface Risk {
  id: number;
  title: string;
  description: string;
  severity: number;
  category: string;
  regulation: string;
  potentialFine: string;
  fix: string;
}

interface Fix {
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

interface ActionPlanDay {
  day: number;
  title: string;
  tasks: string[] | Array<{ task: string; owner?: string; time?: string; dependencies?: string[]; legalReview?: boolean }>;
  totalTime?: string;
}

interface Analysis {
  summary: string;
  overallRiskScore: number;
  risks: Risk[];
  fixes?: Fix[];
  policyUpdates: { section: string; currentIssue: string; suggestedLanguage: string }[];
  actionPlan?: ActionPlanDay[] | { day1: string; day2_3: string; day4_5: string; day6_7: string };
  positiveFindings: string[];
  generatedDocuments?: string;
  separateDocuments?: Record<string, string>; // Separate documents for individual downloads
  businessInfo?: any;
  isGeneratedDocument?: boolean; // Flag for documents created from scratch
  needsMoreInfo?: boolean; // Flag if more information is needed
}

interface Report {
  id: string;
  fileName: string;
  analysis: Analysis & {
    generatedDocuments?: string;
    businessInfo?: any;
  };
  createdAt: string;
}

function getSeverityColor(severity: number): { bg: string; text: string } {
  if (severity >= 9) return { bg: 'bg-[#ff3b30]/20', text: 'text-[#ff3b30]' };
  if (severity >= 7) return { bg: 'bg-[#ff9500]/20', text: 'text-[#ff9500]' };
  if (severity >= 5) return { bg: 'bg-[#ffcc00]/20', text: 'text-[#966a00]' };
  return { bg: 'bg-[#34c759]/20', text: 'text-[#34c759]' };
}

function getSeverityLabel(severity: number): string {
  if (severity >= 9) return 'Critical';
  if (severity >= 7) return 'High';
  if (severity >= 5) return 'Medium';
  return 'Low';
}

// Split generated documents by type (Employee Handbook, Safety Manual, etc.)
function splitDocumentsByType(text: string): Record<string, string> {
  const documents: Record<string, string> = {};
  
  // Patterns to identify different document types
  const patterns = [
    { name: 'Employee Handbook', regex: /(?:^|\n)(?:EMPLOYEE\s+HANDBOOK|EMPLOYEE\s+MANUAL|HANDBOOK)/i },
    { name: 'Safety Manual', regex: /(?:^|\n)(?:SAFETY\s+MANUAL|WORKPLACE\s+SAFETY|OSHA\s+MANUAL)/i },
    { name: 'Compliance Policies', regex: /(?:^|\n)(?:COMPLIANCE\s+POLICIES|POLICY\s+MANUAL|POLICIES)/i },
    { name: 'Code of Conduct', regex: /(?:^|\n)(?:CODE\s+OF\s+CONDUCT|ETHICS\s+POLICY|BUSINESS\s+CONDUCT)/i },
    { name: 'HR Policies', regex: /(?:^|\n)(?:HR\s+POLICIES|HUMAN\s+RESOURCES|HR\s+MANUAL)/i },
  ];
  
  // Find all document sections
  const sections: Array<{ name: string; start: number; end?: number }> = [];
  
  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match && match.index !== undefined) {
      sections.push({ name: pattern.name, start: match.index });
    }
  }
  
  // Sort by position
  sections.sort((a, b) => a.start - b.start);
  
  // Extract content for each section
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const nextSection = sections[i + 1];
    const end = nextSection ? nextSection.start : text.length;
    const content = text.substring(section.start, end).trim();
    
    if (content.length > 50) {
      documents[section.name] = content;
    }
  }
  
  // If no sections found, return the whole document as "Compliance Documents"
  if (Object.keys(documents).length === 0) {
    documents['Compliance Documents'] = text;
  }
  
  return documents;
}

// Helper function to parse document sections (used by both single and separate PDFs)
// IMPROVED: Groups paragraphs together and better detects structure
function parseDocument(text: string) {
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  const lines = text.split('\n');
  const sections: Array<{ type: 'title' | 'heading' | 'subheading' | 'paragraph' | 'list'; content: string; level?: number }> = [];
  let currentParagraph: string[] = [];
  let currentList: string[] = [];
  
  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paraText = currentParagraph.join(' ').trim();
      if (paraText.length > 0) {
        sections.push({ type: 'paragraph', content: paraText });
      }
      currentParagraph = [];
    }
  };
  
  const flushList = () => {
    if (currentList.length > 0) {
      for (const item of currentList) {
        sections.push({ type: 'list', content: item.trim() });
      }
      currentList = [];
    }
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Empty line - flush current paragraph/list
    if (!line) {
      flushList();
      flushParagraph();
      continue;
    }
    
    // Detect titles (markdown headers or all caps short lines)
    if (line.match(/^#{1,3}\s/)) {
      flushList();
      flushParagraph();
      const level = line.match(/^#+/)?.[0]?.length || 1;
      sections.push({ 
        type: level === 1 ? 'title' : level === 2 ? 'heading' : 'subheading', 
        content: line.replace(/^#+\s*/, '').trim(),
        level 
      });
    }
    // Detect titles (all caps, short lines)
    else if (line.length < 60 && line === line.toUpperCase() && line.length > 5 && !line.match(/^[A-Z][A-Z\s]{10,}$/)) {
      flushList();
      flushParagraph();
      sections.push({ type: 'title', content: line });
    }
    // Detect headings (numbered sections like "1. Title" or "1) Title")
    else if (line.match(/^\d+[\.\)]\s+[A-Z]/)) {
      flushList();
      flushParagraph();
      sections.push({ type: 'heading', content: line.replace(/^\d+[\.\)]\s+/, '').trim() });
    }
    // Detect headings (all caps longer lines)
    else if (line.match(/^[A-Z][A-Z\s]{10,50}$/) && line.length > 10 && line.length < 60) {
      flushList();
      flushParagraph();
      sections.push({ type: 'heading', content: line });
    }
    // Detect subheadings (lines ending with colon, short)
    else if (line.endsWith(':') && line.length < 80 && !line.match(/^[-•*]/)) {
      flushList();
      flushParagraph();
      sections.push({ type: 'subheading', content: line });
    }
    // Detect list items
    else if (line.match(/^[-•*]\s/) || (line.match(/^\d+[\.\)]\s/) && line.length < 100)) {
      flushParagraph(); // Flush paragraph before starting list
      currentList.push(line);
    }
    // Regular paragraph text - accumulate
    else {
      flushList(); // Flush list before starting paragraph
      currentParagraph.push(line);
    }
  }
  
  // Flush any remaining content
  flushList();
  flushParagraph();
  
  // If no sections were found, treat entire text as paragraphs
  if (sections.length === 0) {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    for (const para of paragraphs) {
      sections.push({ type: 'paragraph', content: para.trim() });
    }
  }
  
  return sections;
}

// Professional document formatter component
function DocumentFormatter({ content }: { content: string }) {
  const parseContent = (text: string) => {
    const lines = text.split('\n');
    const elements: Array<{ type: 'title' | 'heading' | 'subheading' | 'paragraph' | 'list' | 'empty'; content: string; level?: number }> = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        elements.push({ type: 'empty', content: '' });
        continue;
      }
      
      // Titles (markdown # or all caps short lines)
      if (line.match(/^#{1,3}\s/)) {
        const level = line.match(/^#+/)?.[0]?.length || 1;
        elements.push({
          type: level === 1 ? 'title' : level === 2 ? 'heading' : 'subheading',
          content: line.replace(/^#+\s*/, '').trim(),
          level
        });
      }
      // Headings (numbered sections, bold, or short capitalized)
      else if (line.match(/^\d+[\.\)]\s/) || line.match(/^[A-Z][A-Z\s]{3,50}$/) || line.match(/\*\*.*\*\*/)) {
        elements.push({ type: 'heading', content: line.replace(/\*\*/g, '').trim() });
      }
      // Subheadings (ending with colon)
      else if (line.endsWith(':') && line.length < 80 && !line.match(/^[-•*]/)) {
        elements.push({ type: 'subheading', content: line });
      }
      // List items
      else if (line.match(/^[-•*]\s/) || (line.match(/^\d+[\.\)]\s/) && line.length < 100)) {
        elements.push({ type: 'list', content: line });
      }
      // Paragraphs
      else {
        elements.push({ type: 'paragraph', content: line });
      }
    }
    
    return elements;
  };
  
  const elements = parseContent(content);
  
  // Group consecutive list items
  const groupedElements: Array<{ type: string; content?: string; items?: string[] }> = [];
  let currentList: string[] = [];
  
  for (const element of elements) {
    if (element.type === 'list') {
      currentList.push(element.content);
    } else {
      if (currentList.length > 0) {
        groupedElements.push({ type: 'list-group', items: currentList });
        currentList = [];
      }
      groupedElements.push(element);
    }
  }
  if (currentList.length > 0) {
    groupedElements.push({ type: 'list-group', items: currentList });
  }
  
  return (
    <div className="prose prose-lg max-w-none">
      {groupedElements.map((element, index) => {
        if (element.type === 'list-group' && 'items' in element) {
          return (
            <ul key={index} className="list-disc list-outside ml-6 mb-4 space-y-2">
              {element.items?.map((item, itemIndex) => (
                <li key={itemIndex} className="text-[#1d1d1f] text-[15px] leading-relaxed">
                  {item.replace(/^[-•*]\s/, '').replace(/^\d+[\.\)]\s/, '')}
                </li>
              ))}
            </ul>
          );
        }
        
        switch (element.type) {
          case 'title':
            return (
              <h1 key={index} className="text-3xl font-bold text-[#1d1d1f] mt-8 mb-4 first:mt-0">
                {element.content}
              </h1>
            );
          case 'heading':
            return (
              <h2 key={index} className="text-xl font-semibold text-[#1d1d1f] mt-6 mb-3">
                {element.content}
              </h2>
            );
          case 'subheading':
            return (
              <h3 key={index} className="text-base font-semibold text-[#1d1d1f] mt-4 mb-2">
                {element.content}
              </h3>
            );
          case 'paragraph':
            return (
              <p key={index} className="text-[#1d1d1f] text-[15px] leading-relaxed mb-4">
                {element.content}
              </p>
            );
          case 'empty':
            return <div key={index} className="h-2" />;
          default:
            return null;
        }
      })}
    </div>
  );
}

export default function ReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const id = params.id as string;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'risks' | 'fixes' | 'plan' | 'documents'>('risks');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatbotMode, setChatbotMode] = useState<'chat' | 'improve'>('chat');
  
  // Get subscription tier
  const subscription = user?.publicMetadata?.subscription as { tier?: string } | undefined;
  const tier = subscription?.tier || 'free';
  const isFreeUser = tier === 'free';
  
  // Check if this is a generated document (not an audit)
  const isGeneratedDoc = report?.analysis?.isGeneratedDocument;
  
  // Don't auto-open - only open when user clicks the button
  
  // Set default tab based on document type
  useEffect(() => {
    if (report && isGeneratedDoc) {
      setActiveTab('documents');
    }
  }, [report, isGeneratedDoc]);

  const downloadPdf = async () => {
    if (!report || !report.analysis) {
      alert('Report data is missing. Please refresh the page and try again.');
      return;
    }
    
    setGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let y = 20;

      // Helper function to add wrapped text with error handling and proper spacing
      const addWrappedText = (text: string | undefined, x: number, startY: number, maxWidth: number, lineHeight: number = 7): number => {
        if (!text || text.trim() === '') {
          return startY;
        }
        
        // Check if we need a new page before adding text
        const estimatedLines = Math.ceil(text.length / (maxWidth / 3)); // Rough estimate
        const estimatedHeight = estimatedLines * lineHeight;
        if (startY + estimatedHeight > doc.internal.pageSize.getHeight() - margin - 20) {
          doc.addPage();
          return margin; // Return new page top position
        }
        
        try {
          const lines = doc.splitTextToSize(text, maxWidth);
          let currentY = startY;
          
          // Add each line with proper spacing
          for (let i = 0; i < lines.length; i++) {
            // Check if we need a new page for this line
            if (currentY + lineHeight > doc.internal.pageSize.getHeight() - margin - 20) {
              doc.addPage();
              currentY = margin;
            }
            doc.text(lines[i], x, currentY);
            currentY += lineHeight;
          }
          
          return currentY;
        } catch (e) {
          console.error('Error adding text:', e);
          // Fallback: try to add text as-is
          try {
            if (startY + lineHeight > doc.internal.pageSize.getHeight() - margin - 20) {
              doc.addPage();
              return margin;
            }
            doc.text(text.substring(0, 100), x, startY);
            return startY + lineHeight;
          } catch (e2) {
            return startY;
          }
        }
      };

      // Header
      doc.setFillColor(29, 29, 31);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('LifeØS', margin, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(isGeneratedDoc ? 'Generated Compliance Documents' : 'Compliance Analysis Report', margin, 30);
      
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, 20);

      // Only show risk score for audits, not generated documents
      if (!isGeneratedDoc) {
        const score = report.analysis.overallRiskScore || 0;
        doc.setFillColor(score >= 7 ? 255 : score >= 5 ? 255 : 52, score >= 7 ? 59 : score >= 5 ? 149 : 199, score >= 7 ? 48 : score >= 5 ? 0 : 89);
        doc.rect(pageWidth - margin - 25, 25, 25, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(score.toFixed(1), pageWidth - margin - 17, 33);
      }

      y = 55;

      // Document Name - ensure it's not empty
      const documentName = report.fileName || report.id || (isGeneratedDoc ? 'Compliance Documents' : 'Compliance Audit');
      doc.setTextColor(29, 29, 31);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      y = addWrappedText(documentName, margin, y, contentWidth, 8);
      y += 5;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(134, 134, 139);
      const dateLabel = isGeneratedDoc ? 'Generated' : 'Analyzed';
      const dateValue = report.createdAt ? new Date(report.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
      doc.text(`${dateLabel}: ${dateValue}`, margin, y);
      y += 15;

      // For generated documents, use separateDocuments if available, otherwise split generatedDocuments
      // 110% RELIABLE - Multiple validation layers to ensure PDFs always generate
      if (isGeneratedDoc && (report.analysis.separateDocuments || report.analysis.generatedDocuments)) {
        // Prioritize separateDocuments if available (more reliable)
        let documentSections = report.analysis.separateDocuments;
        
        // If separateDocuments not available, try to split generatedDocuments
        if (!documentSections || Object.keys(documentSections).length === 0) {
          console.log('[PDF] separateDocuments not found, attempting to split generatedDocuments...');
          const generatedText = report.analysis.generatedDocuments || '';
          if (generatedText.trim().length > 0) {
            documentSections = splitDocumentsByType(generatedText);
            console.log('[PDF] Split result:', Object.keys(documentSections).length, 'documents found');
          }
        }
        
        // Final validation - ensure we have actual content
        if (!documentSections || Object.keys(documentSections).length === 0) {
          console.error('[PDF] CRITICAL: No document content found after all attempts');
          alert('No document content found. Please regenerate the documents or contact support.');
          setGeneratingPdf(false);
          return;
        }
        
        // Additional validation: Check each document has substantial content
        const validDocuments: Record<string, string> = {};
        for (const [docType, content] of Object.entries(documentSections)) {
          if (content && typeof content === 'string' && content.trim().length >= 50) {
            validDocuments[docType] = content;
          } else {
            console.warn(`[PDF] Skipping ${docType} - insufficient content (${content?.length || 0} chars)`);
          }
        }
        
        if (Object.keys(validDocuments).length === 0) {
          console.error('[PDF] CRITICAL: No valid documents after content validation');
          alert('Document content is too short. Please regenerate the documents.');
          setGeneratingPdf(false);
          return;
        }
        
        documentSections = validDocuments;
        
        // Generate separate PDFs for each document type
        // 110% RELIABLE - Each document gets its own PDF with full error handling
        let pdfsGenerated = 0;
        let pdfsFailed = 0;
        
        for (const [docType, content] of Object.entries(documentSections)) {
          // Final content validation before PDF generation
          if (!content || typeof content !== 'string' || content.trim().length < 50) {
            console.warn(`[PDF] Skipping ${docType} - content too short or invalid (${content?.length || 0} chars)`);
            pdfsFailed++;
            continue;
          }
          
          console.log(`[PDF] ✅ Generating PDF for ${docType}, content length: ${content.length} characters`);
          
          try {
            // Create new PDF instance for this document
            const separateDoc = new jsPDF();
            const separatePageWidth = separateDoc.internal.pageSize.getWidth();
            const separateMargin = 20;
            const separateContentWidth = separatePageWidth - (separateMargin * 2);
            let separateY = 20;
            
            // Same helper functions
            const addWrappedTextToDoc = (text: string | undefined, x: number, startY: number, maxWidth: number, lineHeight: number = 7, targetDoc: typeof separateDoc): number => {
            if (!text || text.trim() === '') return startY;
            
            // Clean up text - remove extra whitespace but preserve structure
            const cleanText = text.trim().replace(/\s+/g, ' ');
            
            try {
              // Use splitTextToSize which handles word wrapping properly
              const lines = targetDoc.splitTextToSize(cleanText, maxWidth);
              let currentY = startY;
              
              // Ensure we have space for at least one line
              if (currentY + lineHeight > targetDoc.internal.pageSize.getHeight() - separateMargin - 20) {
                targetDoc.addPage();
                currentY = separateMargin;
              }
              
              for (let i = 0; i < lines.length; i++) {
                // Check if we need a new page before adding this line
                if (currentY + lineHeight > targetDoc.internal.pageSize.getHeight() - separateMargin - 20) {
                  targetDoc.addPage();
                  currentY = separateMargin;
                }
                
                // Add the line
                targetDoc.text(lines[i], x, currentY);
                currentY += lineHeight;
              }
              
              return currentY;
            } catch (e) {
              console.error('Error adding text to PDF:', e, 'Text length:', text.length);
              // Fallback: try to add text in chunks
              try {
                const chunks = cleanText.match(/.{1,80}/g) || [cleanText];
                let currentY = startY;
                
                for (const chunk of chunks) {
                  if (currentY + lineHeight > targetDoc.internal.pageSize.getHeight() - separateMargin - 20) {
                    targetDoc.addPage();
                    currentY = separateMargin;
                  }
                  targetDoc.text(chunk, x, currentY);
                  currentY += lineHeight;
                }
                return currentY;
              } catch (e2) {
                console.error('Complete failure adding text:', e2);
                return startY;
              }
            }
          };
          
            const checkPageBreak = (requiredSpace: number = 20, targetDoc: typeof separateDoc, currentY: number): number => {
              if (currentY + requiredSpace > targetDoc.internal.pageSize.getHeight() - separateMargin) {
                targetDoc.addPage();
                return separateMargin;
              }
              return currentY;
            };
            
            // Header for this document
            separateDoc.setFillColor(29, 29, 31);
            separateDoc.rect(0, 0, separatePageWidth, 50, 'F');
            
            separateDoc.setTextColor(255, 255, 255);
            separateDoc.setFontSize(24);
            separateDoc.setFont('helvetica', 'bold');
            separateDoc.text('LifeØS', separateMargin, 25);
            
            separateDoc.setFontSize(11);
            separateDoc.setFont('helvetica', 'normal');
            separateDoc.setTextColor(255, 255, 255, 0.7);
            separateDoc.text(docType, separateMargin, 38);
            
            separateDoc.setFontSize(9);
            separateDoc.setTextColor(255, 255, 255, 0.5);
            separateDoc.text(`Generated: ${new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, separatePageWidth - separateMargin - 80, 25);
            
            separateY = 70;
            
            // Document name
            const documentName = report.fileName.replace(/\.[^/.]+$/, '') || 'Compliance Documents';
            separateDoc.setTextColor(29, 29, 31);
            separateDoc.setFontSize(18);
            separateDoc.setFont('helvetica', 'bold');
            separateY = addWrappedTextToDoc(documentName, separateMargin, separateY, separateContentWidth, 10, separateDoc);
            separateY += 10;
            
            // Introduction
            separateDoc.setFontSize(10);
            separateDoc.setFont('helvetica', 'normal');
            separateDoc.setTextColor(134, 134, 139);
            separateY = addWrappedTextToDoc(
              'This document was generated specifically for your business based on the information you provided. Review and customize it as needed for your organization.',
              separateMargin,
              separateY,
              separateContentWidth,
              6,
              separateDoc
            );
            separateY += 20;
            
            // Add divider
            separateDoc.setDrawColor(200, 200, 200);
            separateDoc.setLineWidth(0.5);
            separateDoc.line(separateMargin, separateY, separatePageWidth - separateMargin, separateY);
            separateY += 15;
            
            // Parse and render content - ensure we have actual content
            const contentToParse = content as string;
            if (!contentToParse || contentToParse.trim().length === 0) {
              console.warn(`No content to parse for ${docType}`);
              continue;
            }
            
            console.log(`[PDF] Generating ${docType} - Content length: ${contentToParse.length} characters`);
            
            const sections = parseDocument(contentToParse);
            console.log(`[PDF] Parsed ${sections.length} sections for ${docType}`);
            
            // If no sections parsed, render entire content as paragraphs
            if (sections.length === 0) {
              console.warn(`[PDF] No sections parsed for ${docType}, rendering as continuous text`);
              separateY = checkPageBreak(30, separateDoc, separateY);
              separateDoc.setFontSize(10);
              separateDoc.setFont('helvetica', 'normal');
              separateDoc.setTextColor(50, 50, 50);
              
              // Split by double newlines for paragraphs
              const paragraphs = contentToParse.split(/\n\n+/).filter(p => p.trim().length > 0);
              for (const para of paragraphs) {
                separateY = checkPageBreak(20, separateDoc, separateY);
                separateY = addWrappedTextToDoc(para.trim(), separateMargin, separateY, separateContentWidth, 6, separateDoc);
                separateY += 8; // Space between paragraphs
              }
            } else {
              // Render parsed sections
              for (const section of sections) {
                separateY = checkPageBreak(30, separateDoc, separateY);
                
                switch (section.type) {
                  case 'title':
                    separateY += 15;
                    separateDoc.setFontSize(20);
                    separateDoc.setFont('helvetica', 'bold');
                    separateDoc.setTextColor(29, 29, 31);
                    separateY = addWrappedTextToDoc(section.content, separateMargin, separateY, separateContentWidth, 12, separateDoc);
                    separateY += 10;
                    break;
                    
                  case 'heading':
                    separateY += 12;
                    separateDoc.setFontSize(14);
                    separateDoc.setFont('helvetica', 'bold');
                    separateDoc.setTextColor(29, 29, 31);
                    separateY = addWrappedTextToDoc(section.content, separateMargin, separateY, separateContentWidth, 9, separateDoc);
                    separateY += 8;
                    break;
                    
                  case 'subheading':
                    separateY += 8;
                    separateDoc.setFontSize(11);
                    separateDoc.setFont('helvetica', 'bold');
                    separateDoc.setTextColor(50, 50, 50);
                    separateY = addWrappedTextToDoc(section.content, separateMargin, separateY, separateContentWidth, 7, separateDoc);
                    separateY += 5;
                    break;
                    
                  case 'list':
                    separateY = checkPageBreak(15, separateDoc, separateY);
                    separateDoc.setFontSize(10);
                    separateDoc.setFont('helvetica', 'normal');
                    separateDoc.setTextColor(50, 50, 50);
                    const listContent = section.content.replace(/^[-•*]\s/, '• ').replace(/^\d+[\.\)]\s/, '');
                    separateY = addWrappedTextToDoc(listContent, separateMargin + 10, separateY, separateContentWidth - 10, 6, separateDoc);
                    separateY += 4;
                    break;
                    
                  case 'paragraph':
                    if (section.content && section.content.trim().length > 0) {
                      separateY = checkPageBreak(20, separateDoc, separateY);
                      separateDoc.setFontSize(10);
                      separateDoc.setFont('helvetica', 'normal');
                      separateDoc.setTextColor(50, 50, 50);
                      separateY = addWrappedTextToDoc(section.content, separateMargin, separateY, separateContentWidth, 6, separateDoc);
                      separateY += 8; // Space after paragraph
                    } else {
                      separateY += 4; // Small space for empty paragraphs
                    }
                    break;
                }
              }
            }
            
            console.log(`[PDF] Completed ${docType} - Total pages: ${separateDoc.internal.pages.length - 1}`);
            
            // Footer
            const pageCount = separateDoc.internal.pages.length - 1;
            for (let i = 1; i <= pageCount; i++) {
              separateDoc.setPage(i);
              separateDoc.setFontSize(8);
              separateDoc.setFont('helvetica', 'normal');
              separateDoc.setTextColor(134, 134, 139);
              separateDoc.text(
                `Page ${i} of ${pageCount}`,
                separatePageWidth / 2,
                separateDoc.internal.pageSize.getHeight() - 15,
                { align: 'center' }
              );
              separateDoc.text(
                'Generated by LifeØS • lifeos.app',
                separatePageWidth - separateMargin,
                separateDoc.internal.pageSize.getHeight() - 15,
                { align: 'right' }
              );
            }
            
            // Save this PDF with 110% reliable error handling
            try {
              const baseFileName = report.fileName.replace(/\.[^/.]+$/, '') || 'Compliance_Documents';
              const dateStr = new Date(report.createdAt).toISOString().split('T')[0];
              const docTypeFileName = docType.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
              const fileName = `${baseFileName}_${docTypeFileName}_${dateStr}.pdf`;
              separateDoc.save(fileName);
              pdfsGenerated++;
              console.log(`[PDF] ✅ Successfully saved: ${fileName}`);
            } catch (saveError) {
              console.error(`[PDF] ❌ Failed to save PDF for ${docType}:`, saveError);
              pdfsFailed++;
              // Try alternative save method (blob download)
              try {
                const blob = separateDoc.output('blob');
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${docType.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                pdfsGenerated++;
                console.log(`[PDF] ✅ Saved via blob method: ${docType}`);
              } catch (blobError) {
                console.error(`[PDF] ❌ Complete failure saving ${docType}:`, blobError);
                pdfsFailed++;
              }
            }
          } catch (docError) {
            console.error(`[PDF] ❌ Critical error generating PDF for ${docType}:`, docError);
            pdfsFailed++;
            // Continue with next document instead of failing completely
          }
        }
        
        // Final status report - 110% reliable feedback
        console.log(`[PDF] ✅ Generation complete: ${pdfsGenerated} PDFs generated, ${pdfsFailed} failed`);
        if (pdfsGenerated === 0 && pdfsFailed > 0) {
          alert('Failed to generate PDFs. Please try again or contact support.');
        } else if (pdfsFailed > 0) {
          alert(`Generated ${pdfsGenerated} PDF(s). ${pdfsFailed} document(s) could not be generated.`);
        } else if (pdfsGenerated > 0) {
          console.log(`[PDF] ✅ Successfully generated ${pdfsGenerated} PDF(s)`);
        }
        
        setGeneratingPdf(false);
        return;
      }
      
      // NO FALLBACK - If separateDocuments is not available, we should not generate a single PDF
      // This ensures users always get properly separated documents
      if (isGeneratedDoc && !report.analysis.separateDocuments && report.analysis.generatedDocuments) {
        // If we have generatedDocuments but no separateDocuments, try to split it
        const documentSections = splitDocumentsByType(report.analysis.generatedDocuments || '');
        
        if (!documentSections || Object.keys(documentSections).length === 0) {
          alert('Document structure not found. Please regenerate the documents or contact support.');
          setGeneratingPdf(false);
          return;
        }
        
        // Generate separate PDFs for each document type (same logic as above)
        for (const [docType, content] of Object.entries(documentSections)) {
          if (!content || typeof content !== 'string' || content.trim().length < 100) {
            console.warn(`Skipping ${docType} - content too short or invalid`);
            continue;
          }
          
          console.log(`[PDF] Generating PDF for ${docType}, content length: ${content.length} characters`);
          
          const separateDoc = new jsPDF();
          const separatePageWidth = separateDoc.internal.pageSize.getWidth();
          const separateMargin = 20;
          const separateContentWidth = separatePageWidth - (separateMargin * 2);
          let separateY = 20;
          
          // Use the same helper functions and rendering logic as the main separate PDF generation
          const addWrappedTextToDoc = (text: string | undefined, x: number, startY: number, maxWidth: number, lineHeight: number = 7, targetDoc: typeof separateDoc): number => {
            if (!text || text.trim() === '') return startY;
            const cleanText = text.trim().replace(/\s+/g, ' ');
            try {
              const lines = targetDoc.splitTextToSize(cleanText, maxWidth);
              let currentY = startY;
              if (currentY + lineHeight > targetDoc.internal.pageSize.getHeight() - separateMargin - 20) {
                targetDoc.addPage();
                currentY = separateMargin;
              }
              for (let i = 0; i < lines.length; i++) {
                if (currentY + lineHeight > targetDoc.internal.pageSize.getHeight() - separateMargin - 20) {
                  targetDoc.addPage();
                  currentY = separateMargin;
                }
                targetDoc.text(lines[i], x, currentY);
                currentY += lineHeight;
              }
              return currentY;
            } catch (e) {
              console.error('Error adding text to PDF:', e);
              return startY;
            }
          };
          
          const checkPageBreak = (requiredSpace: number = 20, targetDoc: typeof separateDoc, currentY: number): number => {
            if (currentY + requiredSpace > targetDoc.internal.pageSize.getHeight() - separateMargin) {
              targetDoc.addPage();
              return separateMargin;
            }
            return currentY;
          };
          
          // Header
          separateDoc.setFillColor(29, 29, 31);
          separateDoc.rect(0, 0, separatePageWidth, 50, 'F');
          separateDoc.setTextColor(255, 255, 255);
          separateDoc.setFontSize(24);
          separateDoc.setFont('helvetica', 'bold');
          separateDoc.text('LifeØS', separateMargin, 25);
          separateDoc.setFontSize(11);
          separateDoc.setFont('helvetica', 'normal');
          separateDoc.setTextColor(255, 255, 255, 0.7);
          separateDoc.text(docType, separateMargin, 38);
          separateDoc.setFontSize(9);
          separateDoc.setTextColor(255, 255, 255, 0.5);
          separateDoc.text(`Generated: ${new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, separatePageWidth - separateMargin - 80, 25);
          
          separateY = 70;
          
          // Document name
          const documentName = report.fileName.replace(/\.[^/.]+$/, '') || 'Compliance Documents';
          separateDoc.setTextColor(29, 29, 31);
          separateDoc.setFontSize(18);
          separateDoc.setFont('helvetica', 'bold');
          separateY = addWrappedTextToDoc(documentName, separateMargin, separateY, separateContentWidth, 10, separateDoc);
          separateY += 10;
          
          // Introduction
          separateDoc.setFontSize(10);
          separateDoc.setFont('helvetica', 'normal');
          separateDoc.setTextColor(134, 134, 139);
          separateY = addWrappedTextToDoc(
            'This document was generated specifically for your business based on the information you provided. Review and customize it as needed for your organization.',
            separateMargin,
            separateY,
            separateContentWidth,
            6,
            separateDoc
          );
          separateY += 20;
          
          // Divider
          separateDoc.setDrawColor(200, 200, 200);
          separateDoc.setLineWidth(0.5);
          separateDoc.line(separateMargin, separateY, separatePageWidth - separateMargin, separateY);
          separateY += 15;
          
          // Parse and render content
          const sections = parseDocument(content as string);
          if (sections.length === 0) {
            const paragraphs = (content as string).split(/\n\n+/).filter(p => p.trim().length > 0);
            for (const para of paragraphs) {
              separateY = checkPageBreak(20, separateDoc, separateY);
              separateDoc.setFontSize(10);
              separateDoc.setFont('helvetica', 'normal');
              separateDoc.setTextColor(50, 50, 50);
              separateY = addWrappedTextToDoc(para.trim(), separateMargin, separateY, separateContentWidth, 6, separateDoc);
              separateY += 8;
            }
          } else {
            for (const section of sections) {
              separateY = checkPageBreak(30, separateDoc, separateY);
              switch (section.type) {
                case 'title':
                  separateY += 15;
                  separateDoc.setFontSize(20);
                  separateDoc.setFont('helvetica', 'bold');
                  separateDoc.setTextColor(29, 29, 31);
                  separateY = addWrappedTextToDoc(section.content, separateMargin, separateY, separateContentWidth, 12, separateDoc);
                  separateY += 10;
                  break;
                case 'heading':
                  separateY += 12;
                  separateDoc.setFontSize(14);
                  separateDoc.setFont('helvetica', 'bold');
                  separateDoc.setTextColor(29, 29, 31);
                  separateY = addWrappedTextToDoc(section.content, separateMargin, separateY, separateContentWidth, 9, separateDoc);
                  separateY += 8;
                  break;
                case 'subheading':
                  separateY += 8;
                  separateDoc.setFontSize(11);
                  separateDoc.setFont('helvetica', 'bold');
                  separateDoc.setTextColor(50, 50, 50);
                  separateY = addWrappedTextToDoc(section.content, separateMargin, separateY, separateContentWidth, 7, separateDoc);
                  separateY += 5;
                  break;
                case 'list':
                  separateY = checkPageBreak(15, separateDoc, separateY);
                  separateDoc.setFontSize(10);
                  separateDoc.setFont('helvetica', 'normal');
                  separateDoc.setTextColor(50, 50, 50);
                  const listContent = section.content.replace(/^[-•*]\s/, '• ').replace(/^\d+[\.\)]\s/, '');
                  separateY = addWrappedTextToDoc(listContent, separateMargin + 10, separateY, separateContentWidth - 10, 6, separateDoc);
                  separateY += 4;
                  break;
                case 'paragraph':
                  if (section.content && section.content.trim().length > 0) {
                    separateY = checkPageBreak(20, separateDoc, separateY);
                    separateDoc.setFontSize(10);
                    separateDoc.setFont('helvetica', 'normal');
                    separateDoc.setTextColor(50, 50, 50);
                    separateY = addWrappedTextToDoc(section.content, separateMargin, separateY, separateContentWidth, 6, separateDoc);
                    separateY += 8;
                  } else {
                    separateY += 4;
                  }
                  break;
              }
            }
          }
          
          // Footer
          const pageCount = separateDoc.internal.pages.length - 1;
          for (let i = 1; i <= pageCount; i++) {
            separateDoc.setPage(i);
            separateDoc.setFontSize(8);
            separateDoc.setFont('helvetica', 'normal');
            separateDoc.setTextColor(134, 134, 139);
            separateDoc.text(
              `Page ${i} of ${pageCount}`,
              separatePageWidth / 2,
              separateDoc.internal.pageSize.getHeight() - 15,
              { align: 'center' }
            );
            separateDoc.text(
              'Generated by LifeØS • lifeos.app',
              separatePageWidth - separateMargin,
              separateDoc.internal.pageSize.getHeight() - 15,
              { align: 'right' }
            );
          }
          
          // Save this PDF
          const baseFileName = report.fileName.replace(/\.[^/.]+$/, '') || 'Compliance_Documents';
          const dateStr = new Date(report.createdAt).toISOString().split('T')[0];
          const docTypeFileName = docType.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
          separateDoc.save(`${baseFileName}_${docTypeFileName}_${dateStr}.pdf`);
        }
        
        setGeneratingPdf(false);
        return;
      }

      // Executive Summary (only for audits)
      doc.setTextColor(29, 29, 31);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', margin, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      y = addWrappedText(report.analysis.summary || 'No summary available.', margin, y, contentWidth, 6);
      y += 15;

      // Risks
      doc.setTextColor(29, 29, 31);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Identified Risks', margin, y);
      y += 10;

      const risks = report.analysis.risks || [];
      if (risks.length === 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        y = addWrappedText('No risks identified in this analysis.', margin, y, contentWidth, 6);
      }

      for (const risk of risks) {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        // Severity indicator
        const severityColor = risk.severity >= 9 ? [255, 59, 48] : 
                             risk.severity >= 7 ? [255, 149, 0] : 
                             risk.severity >= 5 ? [255, 204, 0] : [52, 199, 89];
        doc.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
        doc.rect(margin, y - 3, 3, 20, 'F');

        doc.setTextColor(29, 29, 31);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        const riskTitle = risk.title || risk.issue || `Risk ${risk.id || 'Unknown'}`;
        doc.text(riskTitle, margin + 8, y);
        
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const severity = risk.severity || 0;
        doc.text(`${getSeverityLabel(severity)} (${severity}/10)`, pageWidth - margin - 30, y);
        y += 6;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        y = addWrappedText(risk.description || 'No description available.', margin + 8, y, contentWidth - 8, 5);
        
        doc.setFontSize(8);
        doc.setTextColor(134, 134, 139);
        const regulation = risk.regulation || 'Not specified';
        const fine = risk.potentialFine || 'Not specified';
        doc.text(`Regulation: ${regulation} | Potential Fine: ${fine}`, margin + 8, y);
        y += 12;
      }

      // Fixes Section
      if (y > 220) {
        doc.addPage();
        y = 20;
      }
      y += 10;
      doc.setTextColor(29, 29, 31);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recommended Fixes', margin, y);
      y += 10;

      const fixes = report.analysis.fixes || [];
      if (fixes.length === 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        y = addWrappedText('No fixes available. Fixes are generated based on identified risks.', margin, y, contentWidth, 6);
      } else {
        for (const fix of fixes.slice(0, 10)) { // Limit to first 10 fixes
          if (y > 260) {
            doc.addPage();
            y = 20;
          }

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(29, 29, 31);
          doc.text(`${fix.title || 'Recommended Fix'}`, margin, y);
          y += 6;

          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          y = addWrappedText(fix.description || '', margin, y, contentWidth, 5);
          
          if (fix.priority) {
            doc.setFontSize(8);
            doc.setTextColor(134, 134, 139);
            doc.text(`Priority: ${fix.priority} | Timeframe: ${fix.timeframe || 'Not specified'}`, margin, y);
            y += 8;
          } else {
            y += 5;
          }
        }
      }

      // Action Plan
      if (y > 220) {
        doc.addPage();
        y = 20;
      }
      y += 5;
      doc.setTextColor(29, 29, 31);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('7-Day Action Plan', margin, y);
      y += 10;

      const actionPlan = report.analysis.actionPlan;
      if (Array.isArray(actionPlan) && actionPlan.length > 0) {
        // New format: array of days with tasks
        for (const day of actionPlan) {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 113, 227);
          doc.text(`Day ${day.day || 'N/A'}: ${day.title || ''}`, margin, y);
          y += 6;
          
          if (Array.isArray(day.tasks) && day.tasks.length > 0) {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(9);
            for (const task of day.tasks.slice(0, 5)) {
              const taskText = typeof task === 'string' ? task : (task.task || String(task));
              y = addWrappedText(`• ${taskText}`, margin + 10, y, contentWidth - 10, 5);
            }
          }
          y += 5;
        }
      } else if (actionPlan && typeof actionPlan === 'object' && (actionPlan.day1 || actionPlan.day2_3 || actionPlan.day4_5 || actionPlan.day6_7)) {
        // Old format: object with day1, day2_3, etc.
        const days = [
          { label: 'Day 1', value: actionPlan.day1 },
          { label: 'Days 2-3', value: actionPlan.day2_3 },
          { label: 'Days 4-5', value: actionPlan.day4_5 },
          { label: 'Days 6-7', value: actionPlan.day6_7 },
        ].filter(day => day.value);

        if (days.length > 0) {
          for (const day of days) {
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 113, 227);
            doc.text(day.label, margin, y);
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            y = addWrappedText(day.value || '', margin + 25, y, contentWidth - 25, 5);
            y += 5;
          }
        } else {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          y = addWrappedText('No action plan available.', margin, y, contentWidth, 6);
        }
      } else {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        y = addWrappedText('No action plan available.', margin, y, contentWidth, 6);
      }

      // Footer
      doc.addPage();
      doc.setFontSize(8);
      doc.setTextColor(134, 134, 139);
      doc.setFont('helvetica', 'bold');
      doc.text('LEGAL DISCLAIMER', margin, 20);
      doc.setFont('helvetica', 'normal');
      const disclaimer = 'This compliance analysis report is generated by LifeØS AI for informational purposes only. This report does not constitute legal advice and should not be relied upon as such. Always consult with qualified legal counsel before making decisions related to regulatory compliance.';
      addWrappedText(disclaimer, margin, 28, contentWidth, 5);

      // Save with proper naming
      const fileName = report.fileName.replace(/\.[^/.]+$/, '') || 'Compliance_Audit';
      const dateStr = new Date(report.createdAt).toISOString().split('T')[0];
      doc.save(`${fileName}_Compliance_Audit_${dateStr}.pdf`);
      
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('PDF generation error details:', {
        error,
        errorMessage,
        report: report ? {
          id: report.id,
          fileName: report.fileName,
          hasAnalysis: !!report.analysis,
          analysisKeys: report.analysis ? Object.keys(report.analysis) : [],
        } : null,
      });
      alert(`Failed to generate PDF: ${errorMessage}. Please check the console for details.`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  useEffect(() => {
    async function fetchReport() {
      try {
        console.log('Fetching report with ID:', id);
        
        // First, check sessionStorage for recently created report (only on client)
        if (typeof window !== 'undefined') {
          const sessionKey = `report_${id}`;
          const sessionData = sessionStorage.getItem(sessionKey);
          console.log('SessionStorage check:', sessionKey, sessionData ? 'Found' : 'Not found');
          
          if (sessionData) {
            try {
              const data = JSON.parse(sessionData);
              console.log('Parsed session data:', data);
              
              // Verify we have the required fields
              if (data.analysis) {
                const report = {
                  id: data.reportId || id,
                  fileName: data.fileName || 'Document',
                  analysis: data.analysis,
                  createdAt: data.createdAt || new Date().toISOString(),
                };
                console.log('Setting report from sessionStorage:', report);
                setReport(report);
                setLoading(false);
                return;
              } else {
                console.warn('Session data missing analysis field:', data);
              }
            } catch (e) {
              console.error('Failed to parse session data:', e, sessionData);
            }
          }
        }

        // Check if report data was passed via URL params (from recent analysis)
        const dataParam = searchParams.get('data');
        if (dataParam) {
          try {
          const data = JSON.parse(decodeURIComponent(dataParam));
            // Store in sessionStorage for future visits
            if (typeof window !== 'undefined') {
              const sessionKey = `report_${id}`;
              sessionStorage.setItem(sessionKey, JSON.stringify(data));
            }
          setReport({
              id: data.reportId || id,
            fileName: data.fileName || 'Document',
            analysis: data.analysis,
            createdAt: new Date().toISOString(),
          });
          setLoading(false);
          return;
          } catch (e) {
            console.error('Failed to parse URL data:', e);
          }
        }

        // Check local storage as backup
        if (typeof window !== 'undefined' && user?.id) {
          try {
            const localReportsKey = `lifeos_reports_${user.id}`;
            const localData = localStorage.getItem(localReportsKey);
            if (localData) {
              const localReports = JSON.parse(localData);
              const foundReport = localReports.find((r: Report) => r.id === id);
              if (foundReport) {
                console.log('Found report in local storage');
                setReport(foundReport);
                setLoading(false);
                // Still try to fetch from API to sync
              }
            }
          } catch (e) {
            console.warn('Error checking local storage:', e);
          }
        }

        // Fetch specific report by ID from API (Supabase primary, Firestore backup)
        const response = await fetch(`/api/report/${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.report) {
            // Save to local storage for backup
            if (typeof window !== 'undefined' && user?.id) {
              try {
                const localReportsKey = `lifeos_reports_${user.id}`;
                const existing = localStorage.getItem(localReportsKey);
                const reports: Report[] = existing ? JSON.parse(existing) : [];
                const filtered = reports.filter(r => r.id !== data.report.id);
                const updated = [data.report, ...filtered].slice(0, 100);
                localStorage.setItem(localReportsKey, JSON.stringify(updated));
              } catch (e) {
                console.warn('Error saving to local storage:', e);
              }
            }
            setReport(data.report);
            setLoading(false);
            return;
          }
        }

        // Fallback: try fetching all reports and finding by ID
        const allReportsResponse = await fetch('/api/get-reports');
        if (allReportsResponse.ok) {
          const allData = await allReportsResponse.json();
          const foundReport = allData.reports?.find((r: Report) => r.id === id);
          if (foundReport) {
            // Save to local storage
            if (typeof window !== 'undefined' && user?.id) {
              try {
                const localReportsKey = `lifeos_reports_${user.id}`;
                const existing = localStorage.getItem(localReportsKey);
                const reports: Report[] = existing ? JSON.parse(existing) : [];
                const filtered = reports.filter(r => r.id !== foundReport.id);
                const updated = [foundReport, ...filtered].slice(0, 100);
                localStorage.setItem(localReportsKey, JSON.stringify(updated));
              } catch (e) {
                console.warn('Error saving to local storage:', e);
              }
            }
            setReport(foundReport);
            setLoading(false);
            return;
          }
        }

        // If we get here, report not found
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch report:', err);
        setLoading(false);
      }
    }

    if (id) {
    fetchReport();
    }
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <NavBar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <NavBar />
        <main className="pt-24 pb-20 px-6">
          <div className="max-w-[600px] mx-auto text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-white mb-4">Report Not Found</h1>
            <p className="text-white/60 mb-8">This report may have been deleted or doesn&apos;t exist.</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { analysis } = report;
  // Check if this is a generated document (not an audit) - use the one from state
  const scoreColor = analysis.overallRiskScore >= 7 ? 'text-[#ff3b30]' : 
                     analysis.overallRiskScore >= 5 ? 'text-[#ff9500]' : 'text-[#34c759]';

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <NavBar />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-[1000px] mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#0071e3] hover:text-[#0077ed] mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-[28px] md:text-[36px] font-semibold text-white mb-2">
                  {report.fileName}
                </h1>
                <p className="text-white/50">
                  Analyzed {new Date(report.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex flex-col items-end gap-4">
                {/* Make it Even Better Button - Show for both generated AND uploaded documents */}
                {(isGeneratedDoc || report?.analysis) && (
                  <button
                    onClick={() => {
                      setChatbotMode('improve');
                      setShowChatbot(true);
                    }}
                    className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-[#ff9500] to-[#ff8800] text-white rounded-full font-semibold hover:from-[#ff8800] hover:to-[#ff9500] transition-all shadow-lg shadow-[#ff9500]/20 hover:shadow-[#ff9500]/30"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                    Make it Even Better
                  </button>
                )}

                <div className="flex items-center gap-3">
                  {/* Chat with JC Button - Main button */}
                  {(isGeneratedDoc || report?.analysis) && (
                    <button
                      onClick={() => {
                        setChatbotMode('chat');
                        setShowChatbot(true);
                      }}
                      className="flex items-center gap-2.5 px-6 py-3 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors shadow-md shadow-[#0071e3]/20"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Chat with JC
                    </button>
                  )}
                  
                  {/* Continue with JC Chatbot Button (only for needsMoreInfo) */}
                  {report?.analysis?.needsMoreInfo && !isGeneratedDoc && (
                    <button
                      onClick={() => {
                        setChatbotMode('chat');
                        setShowChatbot(true);
                      }}
                      className="flex items-center gap-2.5 px-6 py-3 bg-[#34c759] text-white rounded-full font-semibold hover:bg-[#30d158] transition-colors shadow-md shadow-[#34c759]/20"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Continue with JC
                    </button>
                  )}

                  {/* Download PDF Button - different text for generated vs audited */}
                  <button
                    onClick={downloadPdf}
                    disabled={generatingPdf}
                    className="flex items-center gap-2.5 px-6 py-3 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors disabled:opacity-50 border border-white/10"
                  >
                    {generatingPdf ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {isGeneratedDoc ? 'Download Documents PDF' : 'Download Audit Report PDF'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Risk Score Badge - only show for audits, not generated documents */}
              {!isGeneratedDoc && (
                <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center ${
                  analysis.overallRiskScore >= 7 ? 'bg-[#ff3b30]/20' :
                  analysis.overallRiskScore >= 5 ? 'bg-[#ff9500]/20' : 'bg-[#34c759]/20'
                }`}>
                  <span className={`text-3xl font-bold ${scoreColor}`}>
                    {analysis.overallRiskScore}
                  </span>
                  <span className="text-white/50 text-[10px]">Risk Score</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Paywall for Free Users - Show after analysis completes */}
          {isFreeUser && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-gradient-to-br from-[#0071e3]/20 to-[#0077ed]/20 border-2 border-[#0071e3]/50 rounded-3xl p-8 mb-8 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#0071e3]/10 to-transparent" />
              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#0071e3] rounded-2xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">Analysis Complete!</h2>
                    <p className="text-white/80 text-lg leading-relaxed mb-4">
                      Your document has been analyzed. Sign up to view the full results, risk assessment, fixes, and action plan.
                    </p>
                  </div>
                </div>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-[#0071e3] text-white rounded-full font-semibold text-lg hover:bg-[#0077ed] transition-all shadow-lg shadow-[#0071e3]/30 hover:shadow-[#0071e3]/50 hover:scale-105"
                >
                  <span>Sign Up to Continue</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Summary - only show for audits and paid users */}
          {!isGeneratedDoc && !isFreeUser && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8 mb-8"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Executive Summary</h2>
              <p className="text-white/70 leading-relaxed">{analysis.summary}</p>
            </motion.div>
          )}

          {/* Info Banner for Generated Documents */}
          {isGeneratedDoc && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#34c759]/10 border border-[#34c759]/30 rounded-3xl p-6 mb-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#34c759]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white mb-2">Documents Generated Successfully</h2>
                  <p className="text-white/70 leading-relaxed">
                    Your compliance documents have been created from scratch based on the information you provided. 
                    These are ready-to-use documents tailored specifically for your business. Review and customize them as needed.
                  </p>
                  {analysis.needsMoreInfo && (
                    <div className="mt-4 p-4 bg-[#ff9500]/10 border border-[#ff9500]/30 rounded-xl">
                      <p className="text-white/80 text-sm">
                        <strong className="text-[#ff9500]">Note:</strong> We may need more information to make these documents even more specific. 
                        Click "Continue with JC" to provide additional details.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tabs - only show relevant tabs (hide for free users) */}
          {!isFreeUser && (
            <div className="flex gap-2 mb-6">
              {[
                // For generated documents, only show documents tab
                ...(isGeneratedDoc 
                  ? [{ id: 'documents' as const, label: 'Generated Documents' }]
                  : [
                      { id: 'risks' as const, label: 'Risks', count: analysis.risks?.length || 0 },
                      { id: 'fixes' as const, label: 'Fixes' },
                      { id: 'plan' as const, label: '7-Day Plan' },
                      ...(analysis.generatedDocuments ? [{ id: 'documents' as const, label: 'Generated Documents' }] : []),
                    ]
                ),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#0071e3] text-white'
                      : 'bg-[#1d1d1f] text-white/60 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 opacity-60">({tab.count})</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Tab Content - Hide for free users */}
          {!isFreeUser && (
            <AnimatePresence mode="wait">
              {activeTab === 'risks' && (
              <motion.div
                key="risks"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {analysis.risks?.map((risk, i) => {
                  const colors = getSeverityColor(risk.severity);
                  return (
                    <motion.div
                      key={risk.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-6"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-white/40 text-sm">{risk.category}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                              {getSeverityLabel(risk.severity)} ({risk.severity}/10)
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-white">{risk.title}</h3>
                        </div>
                      </div>
                      <p className="text-white/60 mb-4">{risk.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-white/40">Regulation: </span>
                          <span className="text-white/80">{risk.regulation}</span>
                        </div>
                        <div>
                          <span className="text-white/40">Potential Fine: </span>
                          <span className="text-[#ff3b30] font-semibold">{risk.potentialFine}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === 'fixes' && (
              <motion.div
                key="fixes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {analysis.fixes && analysis.fixes.length > 0 ? (
                  analysis.fixes.map((fix, i) => (
                    <motion.div
                      key={fix.id || i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-6"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-[#0071e3]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-[#0071e3] font-semibold text-sm">{i + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-white font-semibold">{fix.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              fix.priority === 'Critical' ? 'bg-[#ff3b30]/20 text-[#ff3b30]' :
                              fix.priority === 'High' ? 'bg-[#ff9500]/20 text-[#ff9500]' :
                              fix.priority === 'Medium' ? 'bg-[#ffcc00]/20 text-[#966a00]' :
                              'bg-[#34c759]/20 text-[#34c759]'
                            }`}>
                              {fix.priority}
                            </span>
                            {fix.timeframe && (
                              <span className="text-white/40 text-xs">{fix.timeframe}</span>
                            )}
                          </div>
                          <p className="text-white/60 mb-3">{fix.description}</p>
                          {fix.suggestedLanguage && (
                            <div className="bg-white/5 rounded-xl p-4 mb-3">
                              <p className="text-white/40 text-xs mb-2 font-semibold">Suggested Policy Language:</p>
                              <p className="text-white/80 text-sm whitespace-pre-wrap">{fix.suggestedLanguage}</p>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm">
                            {fix.implementationTime && (
                              <div>
                                <span className="text-white/40">Time: </span>
                                <span className="text-white/80">{fix.implementationTime}</span>
                              </div>
                            )}
                            {fix.legalReviewRequired && (
                              <div>
                                <span className="text-[#ff9500] font-semibold">⚠ Legal Review Required</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-8 text-center">
                    <p className="text-white/60">No fixes available. Fixes are generated based on identified risks.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'documents' && analysis.generatedDocuments && (
              <motion.div
                key="documents"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-8"
              >
                <h2 className="text-xl font-semibold text-white mb-6">Generated Compliance Documents</h2>
                <div className="bg-white/5 rounded-2xl p-6 mb-6">
                  <p className="text-white/60 text-sm mb-4">
                    These documents were generated specifically for your business based on the information you provided.
                    Review and customize them as needed for your organization.
                  </p>
                  
                  {/* Separate Documents with Individual Download Links */}
                  {analysis.separateDocuments && Object.keys(analysis.separateDocuments).length > 0 ? (
                    <div className="space-y-6">
                      {Object.entries(analysis.separateDocuments).map(([docName, docContent]) => (
                        <div key={docName} className="bg-white/5 rounded-xl p-6 border border-white/10">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">{docName}</h3>
                            <button
                              onClick={async () => {
                                setGeneratingPdf(true);
                                try {
                                  // Generate PDF for this specific document
                                  const doc = new jsPDF();
                                  const pageWidth = doc.internal.pageSize.getWidth();
                                  const margin = 20;
                                  const contentWidth = pageWidth - (margin * 2);
                                  let y = 20;

                                  const addWrappedText = (text: string | undefined, x: number, startY: number, maxWidth: number, lineHeight: number = 7): number => {
                                    if (!text || text.trim() === '') return startY;
                                    try {
                                      const lines = doc.splitTextToSize(text, maxWidth);
                                      let currentY = startY;
                                      for (let i = 0; i < lines.length; i++) {
                                        if (currentY + lineHeight > doc.internal.pageSize.getHeight() - margin - 20) {
                                          doc.addPage();
                                          currentY = margin;
                                        }
                                        doc.text(lines[i], x, currentY);
                                        currentY += lineHeight;
                                      }
                                      return currentY;
                                    } catch (e) {
                                      return startY;
                                    }
                                  };

                                  // Header
                                  doc.setFillColor(29, 29, 31);
                                  doc.rect(0, 0, pageWidth, 50, 'F');
                                  doc.setTextColor(255, 255, 255);
                                  doc.setFontSize(24);
                                  doc.setFont('helvetica', 'bold');
                                  doc.text('LifeØS', margin, 25);
                                  doc.setFontSize(11);
                                  doc.setFont('helvetica', 'normal');
                                  doc.setTextColor(255, 255, 255, 0.7);
                                  doc.text(docName, margin, 38);
                                  doc.setFontSize(9);
                                  doc.setTextColor(255, 255, 255, 0.5);
                                  doc.text(`Generated: ${new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - margin - 80, 25);

                                  y = 70;
                                  const documentName = report.fileName.replace(/\.[^/.]+$/, '') || 'Compliance Documents';
                                  doc.setTextColor(29, 29, 31);
                                  doc.setFontSize(18);
                                  doc.setFont('helvetica', 'bold');
                                  y = addWrappedText(documentName, margin, y, contentWidth, 10);
                                  y += 20;

                                  // Parse and render document content
                                  const sections = parseDocument(docContent as string);
                                  for (const section of sections) {
                                    if (y + 30 > doc.internal.pageSize.getHeight() - margin) {
                                      doc.addPage();
                                      y = margin;
                                    }
                                    
                                    switch (section.type) {
                                      case 'title':
                                        y += 15;
                                        doc.setFontSize(20);
                                        doc.setFont('helvetica', 'bold');
                                        doc.setTextColor(29, 29, 31);
                                        y = addWrappedText(section.content, margin, y, contentWidth, 12);
                                        y += 10;
                                        break;
                                      case 'heading':
                                        y += 12;
                                        doc.setFontSize(14);
                                        doc.setFont('helvetica', 'bold');
                                        doc.setTextColor(29, 29, 31);
                                        y = addWrappedText(section.content, margin, y, contentWidth, 9);
                                        y += 8;
                                        break;
                                      case 'subheading':
                                        y += 8;
                                        doc.setFontSize(11);
                                        doc.setFont('helvetica', 'bold');
                                        doc.setTextColor(50, 50, 50);
                                        y = addWrappedText(section.content, margin, y, contentWidth, 7);
                                        y += 5;
                                        break;
                                      case 'list':
                                        doc.setFontSize(10);
                                        doc.setFont('helvetica', 'normal');
                                        doc.setTextColor(50, 50, 50);
                                        const listContent = section.content.replace(/^[-•*]\s/, '• ').replace(/^\d+[\.\)]\s/, '');
                                        y = addWrappedText(listContent, margin + 10, y, contentWidth - 10, 6);
                                        y += 4;
                                        break;
                                      case 'paragraph':
                                        if (section.content) {
                                          doc.setFontSize(10);
                                          doc.setFont('helvetica', 'normal');
                                          doc.setTextColor(50, 50, 50);
                                          y = addWrappedText(section.content, margin, y, contentWidth, 6);
                                          y += 6;
                                        } else {
                                          y += 4;
                                        }
                                        break;
                                    }
                                  }

                                  // Footer
                                  const pageCount = doc.internal.pages.length - 1;
                                  for (let i = 1; i <= pageCount; i++) {
                                    doc.setPage(i);
                                    doc.setFontSize(8);
                                    doc.setFont('helvetica', 'normal');
                                    doc.setTextColor(134, 134, 139);
                                    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: 'center' });
                                    doc.text('Generated by LifeØS • lifeos.app', pageWidth - margin, doc.internal.pageSize.getHeight() - 15, { align: 'right' });
                                  }

                                  const baseFileName = report.fileName.replace(/\.[^/.]+$/, '') || 'Compliance_Documents';
                                  const dateStr = new Date(report.createdAt).toISOString().split('T')[0];
                                  const docTypeFileName = docName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                                  doc.save(`${baseFileName}_${docTypeFileName}_${dateStr}.pdf`);
                                } catch (error) {
                                  console.error('Failed to generate PDF:', error);
                                  alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                } finally {
                                  setGeneratingPdf(false);
                                }
                              }}
                              disabled={generatingPdf}
                              className="px-6 py-2.5 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              {generatingPdf ? 'Generating...' : 'Download PDF'}
                            </button>
                          </div>
                          <div className="bg-white rounded-xl p-6 max-h-[400px] overflow-y-auto shadow-inner">
                            <DocumentFormatter content={docContent as string} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Fallback to combined view if separate documents not available
                    <>
                      <div className="bg-white rounded-xl p-8 max-h-[600px] overflow-y-auto shadow-inner">
                        <DocumentFormatter content={analysis.generatedDocuments} />
                      </div>
                      <div className="flex gap-4 mt-6">
                        <button
                          onClick={() => {
                            const blob = new Blob([analysis.generatedDocuments || ''], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${report.fileName}_Compliance_Documents.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="px-6 py-3 bg-[#0071e3] text-white rounded-full font-semibold hover:bg-[#0077ed] transition-colors"
                        >
                          Download as Text
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'plan' && (
              <motion.div
                key="plan"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {(() => {
                  // Handle both new format (array) and old format (object with day1, day2_3, etc.)
                  if (Array.isArray(analysis.actionPlan) && analysis.actionPlan.length > 0) {
                    return analysis.actionPlan.map((day, i) => (
                      <motion.div
                        key={day.day || i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-6"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-10 bg-[#0071e3]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-[#0071e3] font-semibold text-sm">Day {day.day || i + 1}</span>
                          </div>
                          <div className="flex-1">
                            {day.title && (
                              <h3 className="text-white font-semibold mb-2">{day.title}</h3>
                            )}
                            {Array.isArray(day.tasks) ? (
                              <ul className="space-y-2">
                                {day.tasks.map((task, taskIndex) => {
                                  const taskText = typeof task === 'string' ? task : task.task;
                                  const taskOwner = typeof task === 'object' ? task.owner : undefined;
                                  const taskTime = typeof task === 'object' ? task.time : undefined;
                                  return (
                                    <li key={taskIndex} className="text-white/70 flex items-start gap-2">
                                      <span className="text-[#0071e3] mt-1">•</span>
                                      <div className="flex-1">
                                        <span>{taskText}</span>
                                        {(taskOwner || taskTime) && (
                                          <span className="text-white/40 text-xs ml-2">
                                            {taskOwner && `(${taskOwner})`}
                                            {taskTime && ` - ${taskTime}`}
                                          </span>
                                        )}
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <p className="text-white/70">{day.title || 'No tasks specified'}</p>
                            )}
                            {day.totalTime && (
                              <p className="text-white/40 text-xs mt-2">Total time: {day.totalTime}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ));
                  } else if (analysis.actionPlan && typeof analysis.actionPlan === 'object' && 'day1' in analysis.actionPlan) {
                    // Old format with day1, day2_3, etc.
                    const oldPlan = analysis.actionPlan as { day1?: string; day2_3?: string; day4_5?: string; day6_7?: string };
                    return [
                      { label: 'Day 1', value: oldPlan.day1 },
                      { label: 'Days 2-3', value: oldPlan.day2_3 },
                      { label: 'Days 4-5', value: oldPlan.day4_5 },
                      { label: 'Days 6-7', value: oldPlan.day6_7 },
                    ].filter(day => day.value).map((day, i) => (
                      <motion.div
                        key={day.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-6"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-10 bg-[#0071e3]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-[#0071e3] font-semibold text-sm">{day.label}</span>
                          </div>
                          <p className="text-white/70 pt-2">{day.value}</p>
                        </div>
                      </motion.div>
                    ));
                  } else {
                    return (
                      <div className="bg-[#1d1d1f] rounded-2xl border border-white/10 p-8 text-center">
                        <p className="text-white/60">No action plan available. The AI will generate a detailed 7-day action plan based on identified risks.</p>
                      </div>
                    );
                  }
                })()}
              </motion.div>
            )}
          </AnimatePresence>
          )}

          {/* Help CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 p-8 bg-gradient-to-r from-[#0071e3] to-[#5856d6] rounded-3xl text-center"
          >
            <h2 className="text-xl font-bold text-white mb-2">Need Expert Help?</h2>
            <p className="text-white/80 mb-6">Our compliance team can help you implement these fixes.</p>
            <a
              href="mailto:neville@rayze.xyz?subject=[LifeØS] Compliance Help Request"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#0071e3] rounded-full font-semibold hover:bg-white/90 transition-colors"
            >
              Contact Expert
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </motion.div>
        </div>
      </main>

      {/* JC Chatbot */}
      {report && (
        <ComplianceChatbot
          analysis={report.analysis}
          fileName={report.fileName}
          isOpen={showChatbot}
          onClose={() => setShowChatbot(false)}
          reportId={report.id}
          isImprovementMode={chatbotMode === 'improve'}
          onImproveComplete={async (improvedAnalysis) => {
            // Update report with improved documents
            setReport({
              ...report,
              analysis: improvedAnalysis,
            });
            setShowChatbot(false);
            // Refresh the page to show improved documents
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
