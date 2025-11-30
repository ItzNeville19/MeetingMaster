'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ComplianceChatbotProps {
  analysis?: any;
  fileName?: string;
  isOpen: boolean;
  onClose: () => void;
  reportId?: string;
  isImprovementMode?: boolean;
  onImproveComplete?: (improvedAnalysis: any) => void;
}

export default function ComplianceChatbot({ analysis, fileName, isOpen, onClose, reportId, isImprovementMode, onImproveComplete }: ComplianceChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showAllDone, setShowAllDone] = useState(false);
  
  // Initialize messages on mount
  useEffect(() => {
    if (isImprovementMode) {
      setMessages([{
        role: 'assistant',
        content: `Hey! I'm JC. I'm here to help make your documents even better. 

Tell me what you'd like to improve: more detail, additional sections, better formatting, or anything else. I'll work with you to make these documents stronger. What should we improve first?`,
      }]);
    } else if (analysis && fileName) {
      setMessages([{
        role: 'assistant',
        content: `Hey! I'm JC. I'm here to help you understand your compliance audit for "${fileName}". 

I've reviewed the analysis and I'm happy to answer any questions you have about the risks, fixes, regulations, or anything else. What's on your mind?`,
      }]);
    } else {
      setMessages([{
        role: 'assistant',
        content: `Hey! I'm JC. I'm here to help with anything you need - compliance questions, account help, or just general questions about LifeØS. What can I help you with?`,
      }]);
    }
    setShowAllDone(false);
  }, [analysis, fileName, isImprovementMode]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const trimmedInput = input.trim();
    setInput('');
    
    // Add user message with animation
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);

    // Simulate typing delay to make it feel more human (1-2 seconds)
    const typingDelay = Math.random() * 1000 + 1000;
    await new Promise(resolve => setTimeout(resolve, typingDelay));

    try {
      const response = await fetch('/api/chat-compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          analysis: analysis || null,
          fileName: fileName || null,
          conversationHistory: messages.map(msg => ({ role: msg.role, content: msg.content })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.limitReached) {
          throw new Error(errorData.error || 'Daily message limit reached');
        }
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      
      if (!data || !data.response) {
        throw new Error('No response received from server');
      }
      
      // Check if user said "all done" or similar
      const userSaidDone = /^(all done|done|finished|that's all|that's it|complete|ready|good to go)$/i.test(trimmedInput);
      if (isImprovementMode && (userSaidDone || messages.length >= 4)) {
        // Show "All Done" button after user says done or after 4+ messages
        setShowAllDone(true);
      }
      
      // Simulate typing the response character by character for realism
      setIsTyping(false);
      const responseText = data.response;
      
      // Add empty message first
      const assistantMessage: Message = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Type out the response character by character (fast typing)
      let currentIndex = 0;
      let typingInterval: NodeJS.Timeout | null = null;
      
      typingInterval = setInterval(() => {
        if (currentIndex < responseText.length) {
          const newContent = responseText.substring(0, currentIndex + 1);
          setMessages(prev => {
            const newMessages = [...prev];
            // Update the last message (which should be the assistant message we just added)
            const lastIndex = newMessages.length - 1;
            if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
              newMessages[lastIndex] = { role: 'assistant', content: newContent };
            }
            return newMessages;
          });
          currentIndex++;
        } else {
          if (typingInterval) {
            clearInterval(typingInterval);
            typingInterval = null;
          }
          setIsLoading(false);
        }
      }, 15); // Fast typing speed (15ms per character for natural feel)
      
    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
      const errorMessage: Message = {
        role: 'assistant',
        content: error instanceof Error && error.message.includes('limit') 
          ? 'You\'ve reached your daily limit of 5 messages. Upgrade to Starter or above for unlimited messages!'
          : 'Hmm, I ran into an issue there. Mind trying again? Sometimes the connection gets a bit wonky.',
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
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
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#34c759]/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Jamshed Cooper (JC)</h2>
                <p className="text-sm text-white/50">CEO, Rayze.xyz • Online now</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {messages.map((message, index) => (
              <motion.div
                key={`${message.role}-${index}-${message.content.substring(0, 20)}`}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.3,
                  ease: [0.25, 0.1, 0.25, 1], // iOS-like easing
                }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.2,
                    delay: 0.05,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-[#0071e3] text-white rounded-br-md'
                      : 'bg-white/5 text-white/90 border border-white/10 rounded-bl-md'
                  }`}
                  style={{
                    boxShadow: message.role === 'user' 
                      ? '0 1px 2px rgba(0, 0, 0, 0.1)' 
                      : '0 1px 2px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </motion.div>
              </motion.div>
            ))}
            {(isLoading || isTyping) && (
              <div className="flex justify-start">
                <div className="bg-white/5 text-white/90 border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50 mr-2">JC is typing</span>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-white/10">
            {isImprovementMode && (showAllDone || messages.length >= 4) && (
              <div className="mb-4 flex justify-center">
                <button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const response = await fetch('/api/improve-documents', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          reportId,
                          currentDocuments: analysis,
                          conversationHistory: messages,
                          improvementRequests: messages.filter(m => m.role === 'user').map(m => m.content).join(' | '),
                          isGeneratedDocument: analysis?.isGeneratedDocument,
                          businessInfo: analysis?.businessInfo,
                        }),
                      });

                      if (!response.ok) {
                        throw new Error('Failed to improve documents');
                      }

                      const data = await response.json();
                      
                      if (onImproveComplete) {
                        onImproveComplete(data.analysis);
                        onClose(); // Close chat after improvement
                      }
                    } catch (error) {
                      console.error('Improve documents error:', error);
                      setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: 'Sorry, I ran into an issue improving the documents. Please try again.',
                      }]);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-[#0071e3] to-[#0077ed] text-white rounded-full font-semibold hover:from-[#0077ed] hover:to-[#0071e3] transition-all shadow-lg shadow-[#0071e3]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Improving Documents...' : 'All Done - Improve Documents Now'}
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={isImprovementMode ? "Tell me what to improve..." : "Ask about risks, fixes, regulations, or anything else..."}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-white/40 mt-2 text-center">
              {isImprovementMode ? "Tell me what to improve, then say 'all done' when ready" : "Ask JC about risks, fixes, regulations, action plans, or anything else"}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

