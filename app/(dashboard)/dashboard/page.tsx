'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '@/components/NavBar';
import { useUser } from '@clerk/nextjs';
import { useOwnerUpgrade } from '@/lib/useOwnerUpgrade';
import PrivacyAgreementModal from '@/components/PrivacyAgreementModal';

interface Report {
  id: string;
  fileName: string;
  fileSize: number;
  analysis: {
    overallRiskScore: number;
    risks: any[];
    summary: string;
  };
  createdAt: string;
}

type UploadStatus = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

// Helper function to interpolate between colors smoothly
function interpolateColor(progress: number): string {
  // Progress from 0-100, map to smooth color transition
  // Blue (#0071e3) -> Cyan (#00c7ff) -> Green (#34c759)
  const p = Math.max(0, Math.min(100, progress)) / 100;
  
  // RGB values for smooth transition
  // Start: #0071e3 (0, 113, 227) - Blue
  // Mid: #00c7ff (0, 199, 255) - Cyan
  // End: #34c759 (52, 199, 89) - Green
  
  let r, g, b;
  if (p < 0.4) {
    // Blue to Cyan (0-40%)
    const t = p / 0.4;
    r = 0;
    g = Math.round(113 + t * (199 - 113));
    b = Math.round(227 + t * (255 - 227));
  } else if (p < 0.7) {
    // Cyan (40-70%) - stay at cyan longer
    r = 0;
    g = 199;
    b = 255;
  } else {
    // Cyan to Green (70-100%)
    const t = (p - 0.7) / 0.3;
    r = Math.round(0 + t * 52);
    g = Math.round(199 + t * (199 - 199));
    b = Math.round(255 + t * (89 - 255));
  }
  
  return `rgb(${r}, ${g}, ${b})`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [subscription, setSubscription] = useState({ tier: 'free', uploadsUsed: 0 });
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState('');
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showAlertNotification, setShowAlertNotification] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ fileName: string; riskScore: number } | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Auto-upgrade owner account
  useOwnerUpgrade();

  // Check if user is owner/dev from metadata
  const userSubscription = user?.publicMetadata?.subscription as {
    tier?: string;
    isOwner?: boolean;
    isDev?: boolean;
    uploadsUsed?: number;
  } | undefined;
  
  const userEmail = user?.emailAddresses?.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || 
                   user?.emailAddresses?.[0]?.emailAddress;
  const isOwnerEmail = userEmail?.toLowerCase() === 'neville@rayze.xyz';
  const isOwner = isOwnerEmail || userSubscription?.isOwner || userSubscription?.isDev;

  const tierLimits: Record<string, number> = {
    free: 1, starter: 5, growth: 20, pro: Infinity,
  };
  
  // If owner, force pro tier with unlimited
  const effectiveTier = isOwner ? 'pro' : (subscription.tier || 'free');
  const maxUploads = isOwner ? Infinity : (tierLimits[effectiveTier] || 1);
  const uploadsUsed = subscription.uploadsUsed || 0;
  const canUpload = maxUploads === Infinity || uploadsUsed < maxUploads;
  
  // Display logic for analyses counter - fix the display
  const getAnalysesDisplay = () => {
    if (isOwner || maxUploads === Infinity) {
      // For owner/dev or unlimited plans, show count with infinity
      return uploadsUsed > 0 ? `${uploadsUsed}/∞` : '0/∞';
    } else {
      // For limited tiers, show actual limit
      return `${uploadsUsed}/${maxUploads}`;
    }
  };

  // Immediately update subscription if owner
  useEffect(() => {
    if (isLoaded && user && isOwnerEmail) {
      setSubscription(prev => ({
        ...prev,
        tier: 'pro',
        isOwner: true,
        isDev: true,
        uploadsLimit: -1,
      }));
    }
  }, [isLoaded, user, isOwnerEmail]);

  // Load reports, user profile, and restore analysis state on mount
  useEffect(() => {
    if (isLoaded && user) {
      // FIRST: Load reports from localStorage immediately (no waiting for API)
      const localReportsKey = `lifeos_reports_${user.id}`;
      try {
        const localData = localStorage.getItem(localReportsKey);
        if (localData) {
          const localReports = JSON.parse(localData);
          setReports(localReports);
          setLoading(false);
          console.log('[Dashboard] Loaded', localReports.length, 'reports from localStorage immediately');
        }
      } catch (e) {
        console.warn('[Dashboard] Error loading local reports:', e);
      }
      
      // Load user profile from Supabase (for cross-device sync)
      const loadUserProfile = async () => {
        try {
          const res = await fetch('/api/user-profile');
          if (res.ok) {
            const data = await res.json();
            if (data.profile) {
              console.log('[Dashboard] ✅ Loaded user profile from Supabase (cross-device sync)');
              // Profile data can be used for preferences, settings, etc.
            }
          }
        } catch (e) {
          console.warn('[Dashboard] Error loading user profile:', e);
        }
      };
      loadUserProfile();
      
      // THEN: Fetch fresh reports from API (will update if different)
      fetchReports();
      
      // Check for ongoing analysis that needs to be resumed
      try {
        const ongoingAnalysisKey = `lifeos_ongoing_analysis_${user.id}`;
        const ongoingData = sessionStorage.getItem(ongoingAnalysisKey);
        if (ongoingData) {
          const analysisState = JSON.parse(ongoingData);
          console.log('[Dashboard] Found ongoing analysis, restoring state...', analysisState);
          
          // Restore analysis state
          if (analysisState.status === 'uploading' || analysisState.status === 'analyzing') {
            setUploadStatus(analysisState.status);
            setUploadProgress(analysisState.progress || 0);
            setProgressMessage(analysisState.message || 'Resuming analysis...');
            setCurrentFileName(analysisState.fileName);
            setEstimatedTimeRemaining(analysisState.estimatedTimeRemaining);
            
            // Note: We can't resume the actual stream, but we can show the state
            // The analysis will complete on the server side
            console.log('[Dashboard] Analysis state restored. Analysis continues on server.');
          }
        }
      } catch (e) {
        console.warn('[Dashboard] Error restoring analysis state:', e);
      }
      
      // Check privacy agreement status from Supabase FIRST, then localStorage/Clerk
      const checkPrivacyAgreement = async () => {
        try {
          // Check Supabase for agreement status
          const agreementRes = await fetch('/api/get-privacy-agreements');
          if (agreementRes.ok) {
            const agreementData = await agreementRes.json();
            const hasAgreedInSupabase = agreementData.agreements && agreementData.agreements.length > 0 && 
              agreementData.agreements.some((a: any) => a.agreed === true);
            
            if (hasAgreedInSupabase) {
              // Check if "don't show again" was checked and if it's been a year
              const latestAgreement = agreementData.agreements[0];
              if (latestAgreement.dontShowAgain) {
                const agreementDate = new Date(latestAgreement.agreementDate);
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                
                // If agreed more than a year ago with "don't show again", show again
                if (agreementDate < oneYearAgo) {
                  console.log('[Dashboard] Privacy agreement is over 1 year old, showing again...');
                  setShowPrivacyModal(true);
                  return;
                }
              }
              
              // User has agreed in Supabase - update localStorage
              localStorage.setItem('privacyPolicyAgreed', 'true');
              localStorage.setItem('privacyPolicyAgreedDate', latestAgreement.agreementDate);
              return; // Don't show modal
            }
          }
        } catch (e) {
          console.warn('[Dashboard] Error checking Supabase privacy agreement:', e);
        }
        
        // Fallback: Check localStorage and Clerk metadata
        const hasAgreed = localStorage.getItem('privacyPolicyAgreed') === 'true';
        const metadata = user.publicMetadata as { privacyPolicyAgreed?: boolean };
        
        // Check if agreement is old (over 1 year)
        const agreementDateStr = localStorage.getItem('privacyPolicyAgreedDate');
        if (agreementDateStr) {
          const agreementDate = new Date(agreementDateStr);
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          if (agreementDate < oneYearAgo) {
            console.log('[Dashboard] Privacy agreement is over 1 year old, showing again...');
            setShowPrivacyModal(true);
            return;
          }
        }
        
        // Show modal if not agreed
        if (!hasAgreed && !metadata.privacyPolicyAgreed) {
          console.log('[Dashboard] User has not agreed to privacy policy, showing modal...');
          setShowPrivacyModal(true);
        }
      };
      
      checkPrivacyAgreement();
    }
  }, [isLoaded, user]);

  // Refresh reports when returning to dashboard (ensures reports never disappear)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLoaded && user) {
        console.log('[Dashboard] Page visible, refreshing reports to ensure they never disappear...');
        fetchReports();
      }
    };
    
    const handleFocus = () => {
      if (isLoaded && user) {
        console.log('[Dashboard] Window focused, refreshing reports...');
        fetchReports();
      }
    };
      
    // Refresh when page becomes visible (e.g., navigating back from report)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isLoaded, user]);

  const fetchReports = async () => {
    // Declare localReports outside try block so it's accessible in catch
    const localReportsKey = `lifeos_reports_${user?.id}`;
    let localReports: Report[] = [];
    
    try {
      console.log('[Dashboard] Fetching reports for user:', user?.id);
      
      // First, load from local storage IMMEDIATELY (so reports show instantly, even before API call)
      try {
        const localData = localStorage.getItem(localReportsKey);
        if (localData) {
          localReports = JSON.parse(localData);
          // Set reports immediately so they show right away
          setReports(localReports);
          setLoading(false);
          console.log('[Dashboard] Loaded', localReports.length, 'reports from local storage (displayed immediately)');
        }
      } catch (e) {
        console.warn('[Dashboard] Error loading local reports:', e);
      }
      
      // Then fetch from API (Supabase primary, Firestore backup)
      const res = await fetch('/api/get-reports', {
        cache: 'no-store', // Always fetch fresh data
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      console.log('[Dashboard] Response status:', res.status);
      
      // If API fails, still show local reports (they won't disappear)
      if (!res.ok) {
        console.warn('[Dashboard] API call failed, using local storage reports');
        if (localReports.length > 0) {
          setReports(localReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          setLoading(false);
          return; // Don't continue - use local reports
        }
      }
      
      let firestoreReports: Report[] = [];
      let subscriptionData: any = null;
      
      if (res.ok) {
        // Read response body ONCE and store it
        const data = await res.json();
        console.log('[Dashboard] Received data:', { 
          reportsCount: data.reports?.length || 0, 
          reports: data.reports,
          subscription: data.subscription 
        });
        
        // Store subscription data
        subscriptionData = data.subscription;
        
        // Ensure reports is an array
        firestoreReports = Array.isArray(data.reports) ? data.reports : [];
        
        // Filter out any invalid reports and ensure they have required fields
        firestoreReports = firestoreReports.filter((r: any) => {
          const isValid = r && r.id && (r.fileName || r.id);
          if (!isValid) {
            console.warn('[Dashboard] Invalid report filtered out:', r);
          }
          return isValid;
        });
        
        // Save to local storage as backup
        try {
          localStorage.setItem(localReportsKey, JSON.stringify(firestoreReports));
          console.log('[Dashboard] Saved', firestoreReports.length, 'reports to local storage');
        } catch (e) {
          console.warn('[Dashboard] Error saving to local storage:', e);
        }
      } else {
        // Try to read error response (but don't fail if it fails)
        try {
          const errorData = await res.json();
          console.error('[Dashboard] Failed to fetch reports:', res.status, errorData);
        } catch (e) {
          console.error('[Dashboard] Failed to fetch reports:', res.status);
        }
      }
      
      // Merge Firestore and local storage reports (Firestore takes priority, but include any local-only reports)
      const reportMap = new Map<string, Report>();
      
      // Add Firestore reports first (they're the source of truth)
      firestoreReports.forEach(r => {
        if (r.id) reportMap.set(r.id, r);
      });
      
      // Add local reports that aren't in Firestore (backup/offline reports)
      localReports.forEach(r => {
        if (r.id && !reportMap.has(r.id)) {
          console.log('[Dashboard] Adding local-only report:', r.id);
          reportMap.set(r.id, r);
        }
      });
        
      const mergedReports = Array.from(reportMap.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log('[Dashboard] Merged reports:', mergedReports.length, 'total (', firestoreReports.length, 'from API,', localReports.length, 'from local)');
      setReports(mergedReports);
      
      // Handle subscription data
      if (subscriptionData) {
        const sub = subscriptionData || { tier: 'free', uploadsUsed: 0 };
        
        // Ensure uploadsUsed is a number (not undefined or null)
        if (typeof sub.uploadsUsed !== 'number' || isNaN(sub.uploadsUsed)) {
          sub.uploadsUsed = 0;
        }
        
        // If owner, override with pro tier and dev flags
        if (isOwnerEmail) {
          sub.tier = 'pro';
          sub.isOwner = true;
          sub.isDev = true;
        } else if (userSubscription) {
          // Merge user metadata
          sub.isOwner = userSubscription.isOwner;
          sub.isDev = userSubscription.isDev;
          if (userSubscription.tier) sub.tier = userSubscription.tier;
        }
        
        console.log('[Dashboard] Setting subscription:', sub);
        setSubscription(sub);
      } else if (res.ok === false) {
        // On error, still use local storage reports
        if (localReports.length > 0) {
          console.log('[Dashboard] Using local storage reports as fallback');
          setReports(localReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else {
        setReports([]);
        }
      }
    } catch (error) {
      console.error('[Dashboard] Error fetching reports:', error);
      // On error, try to use local storage reports
      if (localReports.length > 0) {
        console.log('[Dashboard] Using local storage reports as fallback');
        setReports(localReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else {
      setReports([]);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to save report to local storage
  const saveReportToLocal = useCallback((report: Report) => {
    if (!user?.id) return;
    try {
      const localReportsKey = `lifeos_reports_${user.id}`;
      const existing = localStorage.getItem(localReportsKey);
      const reports: Report[] = existing ? JSON.parse(existing) : [];
      
      // Remove if exists, then add at beginning
      const filtered = reports.filter(r => r.id !== report.id);
      const updated = [report, ...filtered].slice(0, 100); // Keep max 100 reports
      
      localStorage.setItem(localReportsKey, JSON.stringify(updated));
      console.log('[Dashboard] Saved report to local storage:', report.id);
    } catch (e) {
      console.warn('[Dashboard] Error saving to local storage:', e);
    }
  }, [user?.id]);

  // Calculate stats
  const stats = {
    totalReports: reports.length,
    avgRiskScore: reports.length > 0 
      ? (reports.reduce((sum, r) => sum + (r.analysis?.overallRiskScore || 0), 0) / reports.length).toFixed(1)
      : '-',
    highRiskCount: reports.filter(r => (r.analysis?.overallRiskScore || 0) >= 7).length,
    totalRisksFound: reports.reduce((sum, r) => sum + (r.analysis?.risks?.length || 0), 0),
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        processFile(file);
      }
    }
  }, [canUpload]);

  const validateFile = useCallback((file: File): boolean => {
    console.log('Validating file:', file.name, file.type, file.size);
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError(`Please upload an image file (PNG, JPG, WEBP, GIF) or PDF. File type "${file.type}" is not supported.`);
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be under 10MB');
      return false;
    }
    setUploadError(null);
    return true;
  }, []);

  const processFile = useCallback(async (file: File) => {
    // CRITICAL: Check privacy agreement from Supabase FIRST before allowing upload
    let hasAgreed = false;
    
    try {
      const agreementRes = await fetch('/api/get-privacy-agreements');
      if (agreementRes.ok) {
        const agreementData = await agreementRes.json();
        hasAgreed = agreementData.agreements && agreementData.agreements.length > 0 && 
          agreementData.agreements.some((a: any) => a.agreed === true);
        
        if (hasAgreed) {
          // User has agreed - update localStorage for quick access
          const latestAgreement = agreementData.agreements[0];
          localStorage.setItem('privacyPolicyAgreed', 'true');
          localStorage.setItem('privacyPolicyAgreedDate', latestAgreement.agreementDate);
        }
      }
    } catch (e) {
      console.warn('[Dashboard] Error checking Supabase privacy agreement:', e);
    }
    
    // If not found in Supabase, check localStorage and Clerk metadata as fallback
    if (!hasAgreed) {
    const privacyAgreed = localStorage.getItem('privacyPolicyAgreed') === 'true';
    const userMetadata = user?.publicMetadata as any;
    const metadataAgreed = userMetadata?.privacyPolicyAgreed === true;
      hasAgreed = privacyAgreed || metadataAgreed;
    }
    
    if (!hasAgreed) {
      // User has NOT agreed - BLOCK upload and show modal
      console.log('[Dashboard] User has not agreed to privacy policy, blocking upload...');
      setPendingFile(file);
      setShowPrivacyModal(true);
      return;
    }
    
    if (!canUpload) {
      setUploadError(`You've reached your ${maxUploads} analysis limit this month.`);
      return;
    }

    // Save analysis state to sessionStorage so it persists across refreshes
    const ongoingAnalysisKey = `lifeos_ongoing_analysis_${user?.id}`;
    const saveAnalysisState = (status: UploadStatus, progress: number, message: string, estimatedTime?: number | null) => {
      if (!user?.id) return;
      try {
        sessionStorage.setItem(ongoingAnalysisKey, JSON.stringify({
          status,
          progress,
          message,
          fileName: file.name,
          estimatedTimeRemaining: estimatedTime,
          startedAt: Date.now(),
        }));
      } catch (e) {
        console.warn('Failed to save analysis state:', e);
      }
    };
    
    const clearAnalysisState = () => {
      if (!user?.id) return;
      try {
        sessionStorage.removeItem(ongoingAnalysisKey);
      } catch (e) {
        console.warn('Failed to clear analysis state:', e);
      }
    };

      setUploadStatus('analyzing');
      setUploadProgress(0);
      saveAnalysisState('analyzing', 0, 'Preparing document...', 600);
      setUploadError(null);
      setCurrentFileName(file.name);
      setSelectedFile(file);

      try {
        // Convert file directly to base64 in the browser (works for both images and PDFs)
        const reader = new FileReader();
        
        const fileDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Start progress simulation with better tracking
        setUploadStatus('analyzing');
        setUploadProgress(0);
        const processStartTime = Date.now();
        setStartTime(processStartTime);
        setEstimatedTimeRemaining(null); // Reset estimated time
        setProgressMessage('Preparing document...');
        
        // Set initial estimate - start at 10 minutes, will count down based on real progress
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        // Start at 10 minutes (600 seconds) - will count down, never go up
        const initialEstimateSeconds = 600; // 10 minutes
        setEstimatedTimeRemaining(initialEstimateSeconds);
      
      // Use streaming API for REAL progress updates (not fake simulation!)
      setProgressMessage('Connecting to analysis engine...');
      setUploadProgress(0);
      
      let analyzeData: any = null;
      let analyzeError: Error | null = null;
      let countdownInterval: NodeJS.Timeout | null = null;
      
      try {
        const response = await fetch('/api/analyze-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl: fileDataUrl,
            fileName: file.name,
          }),
        });

        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.statusText}`);
        }

        // Read the stream and update progress in real-time from ACTUAL work
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          throw new Error('Failed to get response stream');
        }

        let buffer = '';
        let currentProgress = 0; // Track progress locally (not from state)
        let currentEstimate = initialEstimateSeconds; // Start at 10 minutes
        
        // Countdown timer - starts at 10 minutes, ALWAYS counts down, NEVER goes up
        countdownInterval = setInterval(() => {
          const now = Date.now();
          const elapsedSeconds = (now - processStartTime) / 1000;
          
          // Calculate new estimate based on real progress (but only if we have progress)
          if (currentProgress > 0 && currentProgress < 100 && elapsedSeconds > 2) {
            // Calculate REAL progress rate from actual work
            const progressRate = currentProgress / elapsedSeconds; // % per second
            if (progressRate > 0) {
              const remainingProgress = 100 - currentProgress;
              const newEstimate = remainingProgress / progressRate;
              
              // ONLY update if new estimate is LESS than current (never go up!)
              // And only if it's reasonable (not way off)
              if (newEstimate >= 0 && newEstimate < currentEstimate && newEstimate < currentEstimate * 1.5) {
                currentEstimate = newEstimate;
              }
            }
              }
              
          // ALWAYS count down by 1 second each interval (simple countdown)
              if (currentEstimate > 0) {
                currentEstimate = Math.max(0, currentEstimate - 1);
                setEstimatedTimeRemaining(Math.ceil(currentEstimate));
          } else if (currentProgress >= 100) {
            setEstimatedTimeRemaining(0);
            if (countdownInterval) clearInterval(countdownInterval);
          }
        }, 1000); // Update every second
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            clearInterval(countdownInterval);
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (!line.trim()) continue;
            
            try {
              const data = JSON.parse(line);
              
              if (data.type === 'progress') {
                // REAL progress update from the API - actual work being done!
                const realProgress = Math.min(data.progress, 100);
                currentProgress = realProgress; // Update local tracker
                setUploadProgress(realProgress);
                setProgressMessage(data.message || 'Processing...');
                setUploadStatus('analyzing');
                saveAnalysisState('analyzing', realProgress, data.message || 'Processing...', currentEstimate);
                
                // Recalculate estimate immediately when we get real progress
                const now = Date.now();
                const elapsedSeconds = (now - processStartTime) / 1000;
                
                if (realProgress > 0 && realProgress < 100 && elapsedSeconds > 1) {
                  // Calculate REAL progress rate from actual work
                  const progressRate = realProgress / elapsedSeconds; // % per second
                  if (progressRate > 0) {
                    const remainingProgress = 100 - realProgress;
                    const newEstimate = remainingProgress / progressRate;
                    
                    // ONLY update if new estimate is LESS than current (never go up!)
                    // This ensures the timer only counts down, never up
                    if (newEstimate >= 0 && newEstimate < currentEstimate) {
                      currentEstimate = newEstimate;
                      // Don't set it here - let the interval handle the countdown
                    }
                  }
                }
              } else if (data.type === 'complete') {
                // Analysis complete
                clearInterval(countdownInterval);
                analyzeData = data;
                setUploadProgress(100);
                setProgressMessage('Complete!');
                setEstimatedTimeRemaining(0);
                clearAnalysisState(); // Clear ongoing analysis state on success
              } else if (data.type === 'error') {
                // Error occurred
                clearInterval(countdownInterval);
                analyzeError = new Error(data.error || 'Analysis failed');
                clearAnalysisState(); // Clear ongoing analysis state on error
                break;
              }
            } catch (parseError) {
              console.error('Failed to parse progress update:', parseError, line);
            }
          }
          
          if (analyzeError) {
            clearInterval(countdownInterval);
            break;
          }
        }
        
        if (analyzeError) {
          throw analyzeError;
        }
        
        if (!analyzeData) {
          throw new Error('Analysis completed but no data received');
        }
      } catch (fetchError) {
        // Clean up any intervals
        if (countdownInterval) {
          clearInterval(countdownInterval);
        }
        setUploadProgress(0);
        setProgressMessage('');
        setEstimatedTimeRemaining(null);
        setStartTime(null);
        if (typeof clearAnalysisState === 'function') {
          clearAnalysisState(); // Clear ongoing analysis state on error
        }
        throw fetchError;
      }

      const data = analyzeData;
      
      // Report is already saved to Firestore by the streaming endpoint
      // But we need to ensure it's saved and update subscription tracking
      try {
        // Wait a moment for Firestore to propagate
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const reportData = {
            id: data.reportId,
            fileName: file.name,
            fileSize: file.size,
            analysis: data.analysis,
            createdAt: new Date().toISOString(),
        };
        
        // Save to local storage immediately
        saveReportToLocal(reportData as Report);
        
        const saveResponse = await fetch('/api/save-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData),
        });
        
        if (!saveResponse.ok) {
          const errorText = await saveResponse.text();
          console.error('Failed to save report via save-report endpoint:', errorText);
          // Don't fail completely - report might already be saved from analyze-stream
          // The report is already in local storage, so it won't be lost
          console.warn('⚠️ Report save warning, but report is saved locally and may already be in database');
        } else {
          const saveData = await saveResponse.json();
          
          // Update subscription state with new count
          if (saveData.subscription) {
            setSubscription(prev => ({
              ...prev,
              uploadsUsed: saveData.subscription.uploadsUsed || prev.uploadsUsed,
            }));
          }
          
          // Show alert notification if triggered
          if (saveData.alertTriggered && saveData.alertInfo) {
            setAlertInfo({
              fileName: saveData.alertInfo.fileName,
              riskScore: saveData.alertInfo.riskScore,
            });
            setShowAlertNotification(true);
            
            // Auto-hide after 10 seconds
            setTimeout(() => setShowAlertNotification(false), 10000);
          }
        }
      } catch (saveError) {
        console.error('Failed to update subscription:', saveError);
        // Continue anyway - report was analyzed and saved successfully
      }

      // Store report in sessionStorage for immediate access
      const reportData = {
        reportId: data.reportId,
        fileName: file.name,
        analysis: data.analysis,
        createdAt: new Date().toISOString(),
      };
      
      const sessionKey = `report_${data.reportId}`;
      sessionStorage.setItem(sessionKey, JSON.stringify(reportData));
      
      // Progress is already at 100% from streaming, so navigate immediately
      setUploadStatus('success');
      clearAnalysisState(); // Clear ongoing analysis state on success
      
      // Save user profile with recent files (for cross-device sync)
      if (user?.id && user?.emailAddresses?.[0]?.emailAddress) {
        try {
          const recentFiles = reports.slice(0, 9).map(r => ({
            id: r.id,
            fileName: r.fileName,
            createdAt: r.createdAt,
          }));
          // Add the new report to the top
          const updatedRecentFiles = [
            { id: data.reportId, fileName: file?.name || data.fileName || 'Untitled Document', createdAt: new Date().toISOString() },
            ...recentFiles.filter(f => f.id !== data.reportId),
          ].slice(0, 10);
          
          fetch('/api/user-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              preferences: {},
              settings: {},
              recentFiles: updatedRecentFiles,
            }),
          }).catch(e => console.warn('Failed to save user profile:', e));
        } catch (e) {
          console.warn('Error preparing user profile save:', e);
        }
      }
      
      // Wait a bit longer for Firestore to be ready, then refresh reports list
      setTimeout(async () => {
        await fetchReports();
        
        // Navigate after reports are refreshed
        setTimeout(() => {
          router.push(`/reports/${data.reportId}`);
        }, 500);
      }, 1000);

    } catch (err) {
      console.error('File processing error:', err);
      setUploadStatus('error');
      setUploadError(err instanceof Error ? err.message : 'Something went wrong');
      setUploadProgress(0);
      setProgressMessage('');
      setEstimatedTimeRemaining(null);
      setStartTime(null);
      // Clear analysis state on error
      try {
        const ongoingAnalysisKey = `lifeos_ongoing_analysis_${user?.id}`;
        if (user?.id) {
          sessionStorage.removeItem(ongoingAnalysisKey);
        }
      } catch (e) {
        console.warn('Failed to clear analysis state:', e);
      }
    }
  }, [canUpload, maxUploads, fetchReports, user?.id]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.log('File selected:', file.name, file.type, file.size);
      if (validateFile(file)) {
        processFile(file);
      }
    } else {
      console.log('No file selected');
    }
    // Reset input so same file can be selected again
    if (e.target) {
      e.target.value = '';
    }
  }, [validateFile, processFile]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <NavBar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-4 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <NavBar />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-[1100px] mx-auto">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-[32px] md:text-[40px] font-semibold text-white mb-2">
              {user?.firstName ? `Welcome, ${user.firstName}` : 'Dashboard'}
            </h1>
            <p className="text-white/50">
              {getAnalysesDisplay()} analyses used · {isOwner ? 'DEV' : effectiveTier.charAt(0).toUpperCase() + effectiveTier.slice(1)} plan
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-[1fr_380px] gap-8">
            
            {/* Main Area */}
            <div className="space-y-6">
              
              {/* Upload Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#1d1d1f] rounded-3xl border border-white/10 overflow-hidden"
              >
                <div className="p-6 border-b border-white/5">
                  <h2 className="text-xl font-semibold text-white">Analyze Document</h2>
                </div>

                <AnimatePresence mode="wait">
                  {uploadStatus === 'idle' && (
                    <motion.div
                      key="upload-idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-6"
                    >
                      {!canUpload ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-[#ff9500]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-[#ff9500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                          </div>
                          <p className="text-white font-medium mb-2">You&apos;ve used all {maxUploads} analyses</p>
                          <p className="text-white/50 text-sm mb-6">Get more to continue analyzing compliance documents</p>
                          
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <a 
                              href={`mailto:neville@rayze.xyz?subject=[LifeØS] Purchase Extra Analyses&body=Hi, I'd like to purchase 5 extra analyses ($10) for my account: ${user?.primaryEmailAddress?.emailAddress || ''}`}
                              className="px-6 py-3 bg-white text-[#1d1d1f] rounded-full font-medium hover:bg-white/90 transition-colors text-sm"
                            >
                              Buy 5 Analyses · $10
                            </a>
                            <Link 
                              href="/pricing" 
                              className="px-6 py-3 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors text-sm"
                            >
                              Upgrade Plan
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => {
                            // Allow clicking anywhere in the drop zone to trigger file picker
                            if (fileInputRef.current && !isDragging) {
                              fileInputRef.current.click();
                            }
                          }}
                          className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer ${
                            isDragging
                              ? 'border-[#0071e3] bg-[#0071e3]/10'
                              : uploadError 
                                ? 'border-[#ff3b30] bg-[#ff3b30]/5'
                                : 'border-white/20 hover:border-white/30'
                          }`}
                        >
                          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors ${
                            isDragging ? 'bg-[#0071e3]' : 'bg-[#0071e3]/20'
                          }`}>
                            <svg className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-[#0071e3]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                          </div>
                          <p className="text-white font-medium mb-2">
                            {isDragging ? 'Drop your file here' : 'Upload a document to analyze'}
                          </p>
                          <p className="text-white/40 text-sm mb-6">PNG, JPG, WEBP, GIF, PDF up to 10MB</p>
                          
                          {/* Buttons side by side */}
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering parent click
                                console.log('Button clicked, fileInputRef:', fileInputRef.current);
                                if (fileInputRef.current) {
                                  fileInputRef.current.click();
                                } else {
                                  console.error('File input ref is null!');
                                  setUploadError('File input not available. Please refresh the page.');
                                }
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0071e3] text-white rounded-full font-medium hover:bg-[#0077ed] transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                              Upload File
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push('/dashboard/build-from-scratch');
                              }}
                              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-colors text-sm"
                            >
                              Build from Scratch
                            </button>
                          </div>
                          
                          <p className="text-white/50 text-xs text-center mt-3">
                            Don't have documents? Build them from scratch
                          </p>
                          
                          {/* File input - hidden but accessible */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                            aria-label="Choose file to analyze"
                          />
                          
                          {uploadError && (
                            <p className="mt-4 text-[#ff3b30] text-sm">{uploadError}</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {(uploadStatus === 'uploading' || uploadStatus === 'analyzing') && (
                    <motion.div
                      key="upload-progress"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-8"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-[#0071e3]/20 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#0071e3]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{currentFileName}</p>
                          <p className="text-white/50 text-sm">
                            {progressMessage || (uploadStatus === 'uploading' ? 'Uploading...' : 'Analyzing with AI...')}
                            {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
                              <span className="ml-2">~{Math.floor(estimatedTimeRemaining / 60)}:{(estimatedTimeRemaining % 60).toString().padStart(2, '0')} remaining</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="relative w-full bg-white/10 rounded-full h-4 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full relative"
                          style={{
                            width: `${uploadProgress}%`,
                            background: `linear-gradient(to right, ${interpolateColor(uploadProgress)}, ${interpolateColor(Math.min(100, uploadProgress + 5))})`,
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                          {/* Animated shimmer effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{
                              x: ['-100%', '200%'],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                            style={{ width: '50%' }}
                          />
                        </motion.div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
                          <p className="text-white/80 text-sm font-medium">
                            {progressMessage || `${Math.round(uploadProgress)}% complete`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/60 text-sm">
                            {Math.round(uploadProgress)}%
                          </p>
                          {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
                            <p className="text-white/40 text-xs mt-1">
                              ~{Math.floor(estimatedTimeRemaining / 60)}:{(estimatedTimeRemaining % 60).toString().padStart(2, '0')} remaining
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {uploadStatus === 'success' && (
                    <motion.div
                      key="upload-success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-8 text-center"
                    >
                      <div className="w-16 h-16 bg-[#34c759] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-white font-medium">Analysis complete!</p>
                      <p className="text-white/50 text-sm">Redirecting to report...</p>
                    </motion.div>
                  )}

                  {uploadStatus === 'error' && (
                    <motion.div
                      key="upload-error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-8 text-center"
                    >
                      <div className="w-16 h-16 bg-[#ff3b30]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-[#ff3b30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                      </div>
                      <p className="text-white font-medium mb-2">{uploadError}</p>
                      <button
                        onClick={() => { setUploadStatus('idle'); setUploadError(null); }}
                        className="text-[#0071e3] hover:underline text-sm font-medium"
                      >
                        Try again
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Recent Reports */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#1d1d1f] rounded-3xl border border-white/10 overflow-hidden"
              >
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                  <h2 className="text-xl font-semibold text-white">Recent Reports</h2>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setLoading(true);
                        fetchReports().finally(() => {
                          setLoading(false);
                        });
                      }}
                      disabled={loading}
                      className="text-sm text-[#0071e3] hover:text-[#0077ed] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                      title="Refresh reports"
                    >
                      <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                    <span className="text-sm text-white/40">{reports.length} {reports.length === 1 ? 'report' : 'reports'}</span>
                    {reports.length > 0 && (
                      <Link 
                        href="/reports" 
                        className="text-sm text-[#0071e3] hover:text-[#0077ed] font-medium transition-colors"
                      >
                        View All Reports →
                      </Link>
                    )}
                    <Link 
                      href="/privacy-agreement" 
                      className="text-sm text-white/40 hover:text-white/60 font-medium transition-colors"
                      title="View Privacy Policy Agreements"
                    >
                      Privacy
                    </Link>
                  </div>
                </div>

                {reports.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <p className="text-white/50">No reports yet</p>
                    <p className="text-white/30 text-sm mt-1">Upload a document above to get started</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {/* Show only first 5-10 reports in Recent Reports */}
                    {reports.slice(0, 5).map((report, i) => {
                      const score = report.analysis?.overallRiskScore || 0;
                      return (
                        <Link
                          key={report.id}
                          href={`/reports/${report.id}`}
                          className="flex items-center gap-4 p-5 hover:bg-white/5 transition-colors group"
                        >
                          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-[#0071e3]/20 transition-colors">
                            <svg className="w-6 h-6 text-[#0071e3]" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate group-hover:text-[#0071e3] transition-colors">{report.fileName}</p>
                            <p className="text-white/40 text-sm">
                              {new Date(report.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                            score >= 7 ? 'bg-[#ff3b30]/20 text-[#ff3b30]' :
                            score >= 5 ? 'bg-[#ff9500]/20 text-[#ff9500]' :
                            'bg-[#34c759]/20 text-[#34c759]'
                          }`}>
                            {score.toFixed(1)}
                          </div>
                        </Link>
                      );
                    })}
                    {reports.length > 5 && (
                      <div className="p-5 text-center">
                        <p className="text-white/50 text-sm mb-3">Showing {Math.min(reports.length, 5)} of {reports.length} reports</p>
                        <Link 
                          href="/reports" 
                          className="inline-flex items-center gap-2 text-sm text-[#0071e3] hover:text-[#0077ed] font-medium transition-colors"
                        >
                          View All Reports with Filters →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Reports', value: stats.totalReports, color: 'text-white' },
                    { label: 'Avg Score', value: stats.avgRiskScore, color: 'text-[#ff9500]' },
                    { label: 'High Risk', value: stats.highRiskCount, color: 'text-[#ff3b30]' },
                    { label: 'Risks Found', value: stats.totalRisksFound, color: 'text-white' },
                  ].map((stat, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-xl">
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-white/40">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Quick Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#1d1d1f] rounded-3xl border border-white/10 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/insights" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#0071e3] to-[#5856d6] rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">Insights</p>
                      <p className="text-xs text-white/40">Digest & alerts</p>
                    </div>
                  </Link>

                  <Link href="/benefits" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#ff9500] to-[#ff3b30] rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">Your Benefits</p>
                      <p className="text-xs text-white/40">View & use perks</p>
                    </div>
                  </Link>

                  <Link href="/team" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 bg-[#5856d6]/20 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#5856d6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">Team</p>
                      <p className="text-xs text-white/40">Manage members</p>
                    </div>
                  </Link>

                  <Link href="/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">Settings</p>
                      <p className="text-xs text-white/40">Account & billing</p>
                    </div>
                  </Link>

                  <a href="mailto:neville@rayze.xyz?subject=[LifeØS] Help" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 bg-[#34c759]/20 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">Get Help</p>
                      <p className="text-xs text-white/40">neville@rayze.xyz</p>
                    </div>
                  </a>
                </div>
              </motion.div>

              {/* Pro Tools - Only show for Pro users */}
              {subscription.tier === 'pro' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-gradient-to-br from-[#1d1d1f] to-[#2d2d2f] rounded-3xl border border-[#ff9500]/30 p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="px-2 py-1 bg-gradient-to-r from-[#ff9500] to-[#ff3b30] text-white text-[10px] font-bold rounded">PRO</div>
                    <h3 className="text-lg font-semibold text-white">Pro Tools</h3>
                  </div>
                  <div className="space-y-2">
                    <Link href="/api-keys" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="w-10 h-10 bg-[#0071e3]/20 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">API Keys</p>
                        <p className="text-xs text-white/40">Integrate LifeØS</p>
                      </div>
                    </Link>
                    <Link href="/sla" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="w-10 h-10 bg-[#34c759]/20 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#34c759]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">SLA Status</p>
                        <p className="text-xs text-white/40">99.9% uptime</p>
                      </div>
                    </Link>
                    <Link href="/branding" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="w-10 h-10 bg-[#af52de]/20 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#af52de]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">Branding</p>
                        <p className="text-xs text-white/40">White-label reports</p>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* Upgrade CTA - Only show for non-Pro users */}
              {subscription.tier !== 'pro' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="p-6 bg-gradient-to-br from-[#0071e3] to-[#5856d6] rounded-3xl"
                >
                  <h3 className="text-lg font-bold text-white mb-2">Upgrade Your Plan</h3>
                  <p className="text-white/80 text-sm mb-4">Get more analyses, team access, and premium features.</p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0071e3] rounded-full text-sm font-semibold hover:bg-white/90 transition-colors"
                  >
                    View Plans
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* High Risk Alert Notification */}
      <AnimatePresence>
        {showAlertNotification && alertInfo && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 max-w-md z-50"
          >
            <div className="bg-gradient-to-r from-[#ff3b30] to-[#ff453a] rounded-2xl shadow-2xl p-5 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-bold">High Risk Alert</h3>
                    <button 
                      onClick={() => setShowAlertNotification(false)}
                      className="text-white/60 hover:text-white"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-white/90 text-sm mb-2">
                    <span className="font-semibold">{alertInfo.fileName}</span> scored <span className="font-bold">{alertInfo.riskScore}/10</span>
                  </p>
                  <p className="text-white/70 text-xs mb-3">
                    An alert email has been queued. Check Settings → Predictive Alerts to manage notifications.
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href="/settings"
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full transition-colors"
                    >
                      View Settings
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Agreement Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <PrivacyAgreementModal
            isBlocking={true} // Block all usage until agreed
            onAgree={async () => {
              setShowPrivacyModal(false);
              // Wait a moment for the save to complete
              await new Promise(resolve => setTimeout(resolve, 500));
              if (pendingFile) {
                processFile(pendingFile);
                setPendingFile(null);
              }
            }}
            onCancel={() => {
              // If blocking, don't allow cancel - they must agree
              alert('You must agree to the Privacy Policy and Terms of Service to use LifeØS. If you do not agree, please close this browser window.');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
