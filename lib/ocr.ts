// Use OpenAI Vision API instead of Google Cloud Vision
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Lazy import PDF to image converter to avoid blocking server startup
let convertPdfPageToImage: any;
async function getPdfConverter() {
  if (!convertPdfPageToImage) {
    const module = await import('./pdf-to-image');
    convertPdfPageToImage = module.convertPdfPageToImage;
  }
  return convertPdfPageToImage;
}

export interface OCRResult {
  text: string;
  confidence: number;
  pageCount: number;
}

// Progress callback type
export type ProgressCallback = (progress: number, message: string) => void;

/**
 * Extract text from an image or PDF URL using OpenAI Vision API
 * Note: OpenAI Vision only supports images, so PDFs are converted to images first
 */
export async function extractText(fileUrl: string, onProgress?: ProgressCallback): Promise<OCRResult> {
  try {
    // Check if it's a PDF by MIME type or extension
    const isPdf = fileUrl.includes('application/pdf') || 
                  fileUrl.toLowerCase().includes('.pdf') ||
                  fileUrl.toLowerCase().match(/\.pdf/);
    
    if (isPdf) {
      // For PDFs, we need to convert to image first
      // Since we can't do that server-side easily, we'll extract text from the first page
      // by treating it as an image (if it's a data URL, we can try)
      return await extractTextFromPdf(fileUrl, onProgress);
    } else {
      // For images, use OpenAI Vision directly
      return await extractTextFromImage(fileUrl);
    }
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from an image using OpenAI Vision API
 */
async function extractTextFromImage(imageUrl: string): Promise<OCRResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  // For data URLs, validate MIME type and extract base64
  let imageUrlForAPI: string;
  if (imageUrl.startsWith('data:')) {
    // Validate it's an image MIME type
    const mimeMatch = imageUrl.match(/^data:([^;]+);base64,/);
    if (mimeMatch) {
      const mimeType = mimeMatch[1];
      // OpenAI Vision supports: image/jpeg, image/png, image/gif, image/webp
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!supportedTypes.includes(mimeType.toLowerCase())) {
        throw new Error(`Unsupported image type: ${mimeType}. Supported: ${supportedTypes.join(', ')}`);
      }
    }
    imageUrlForAPI = imageUrl;
  } else {
    // For regular URLs, we'll use them directly (must be image URLs)
    imageUrlForAPI = imageUrl;
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this image/document. Return ONLY the text content, no explanations or formatting. Preserve the structure and layout as much as possible.',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrlForAPI,
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Vision API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  
  if (!text || text.trim().length < 10) {
    return {
      text: '',
      confidence: 0,
      pageCount: 1,
    };
  }

  // OpenAI doesn't provide confidence scores, so we estimate based on text length
  const wordCount = text.split(/\s+/).length;
  const confidence = Math.min(0.95, 0.7 + (wordCount / 1000) * 0.25);

  return {
    text: text.trim(),
    confidence,
    pageCount: 1, // OpenAI processes the whole image at once
  };
}

/**
 * Extract text from a PDF by converting it to an image first, then using OpenAI Vision
 */
async function extractTextFromPdf(pdfUrl: string, onProgress?: ProgressCallback): Promise<OCRResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  try {
    onProgress?.(5, 'Extracting text from PDF...');
    
    // Method 1: Try pdf-parse for text-based PDFs (fastest and most reliable - extracts ALL pages)
    const pdfParse = require('pdf-parse');
    const base64Match = pdfUrl.match(/^data:application\/pdf;base64,(.+)$/);
    
    if (base64Match) {
      const pdfBuffer = Buffer.from(base64Match[1], 'base64');
      
      try {
        onProgress?.(10, 'Parsing PDF structure (processing all pages)...');
        const pdfData = await pdfParse(pdfBuffer);
        const extractedText = pdfData.text.trim();
        const pageCount = pdfData.numpages || 1;
        
        console.log(`[PDF Extraction] 📄 PDF has ${pageCount} pages, extracted ${extractedText.length} characters`);
        
        // CRITICAL: For multi-page PDFs, verify we actually got text from multiple pages
        // pdf-parse extracts ALL pages by default, but we need to verify
        const wordCount = extractedText.split(/\s+/).length;
        const avgWordsPerPage = wordCount / pageCount;
        
        // For multi-page PDFs, we need at least 20 words per page on average
        // If we have 28 pages but only 50 words total, that's clearly wrong (should be ~560+ words minimum)
        const minWordsPerPage = 20;
        const minTotalWords = pageCount > 1 ? (pageCount * minWordsPerPage) : 10;
        
        console.log(`[PDF Extraction] 📊 Word count: ${wordCount} words, Average: ${avgWordsPerPage.toFixed(1)} words/page`);
        console.log(`[PDF Extraction] 📊 Minimum expected: ${minTotalWords} words for ${pageCount} page(s)`);
        
        if (wordCount >= minTotalWords && extractedText.length > 50) {
          // We have sufficient text - pdf-parse successfully extracted from all pages
          onProgress?.(70, `✅ Extracted text from all ${pageCount} pages successfully! (${wordCount} words)`);
          const confidence = Math.min(0.95, 0.7 + (wordCount / 1000) * 0.25);
          
          onProgress?.(100, `PDF processing complete! Processed ${pageCount} pages, ${wordCount} words`);
          console.log(`[PDF Extraction] ✅ SUCCESS: Extracted ${wordCount} words from ALL ${pageCount} pages`);
          return {
            text: extractedText,
            confidence,
            pageCount: pageCount,
          };
        } else {
          // Insufficient text - likely scanned PDF or pdf-parse only got page 1
          console.log(`[PDF Extraction] ⚠️ WARNING: Only extracted ${wordCount} words from ${pageCount} page(s)`);
          console.log(`[PDF Extraction] ⚠️ Expected at least ${minTotalWords} words. This PDF is likely scanned or image-based.`);
          console.log(`[PDF Extraction] 🔄 Proceeding to image conversion to process ALL ${pageCount} pages...`);
          // Continue to image conversion to process ALL pages
        }
      } catch (parseError) {
        console.log('PDF parse failed (may be scanned PDF), trying image conversion for all pages...', parseError);
      }
  }

    // Method 2: For scanned PDFs, convert ALL pages to images and use OpenAI Vision
    // This handles image-based PDFs - processes every page automatically
    onProgress?.(20, 'PDF appears to be scanned. Automatically converting to images...');
    try {
      const { convertPdfPageToImage, getPdfPageCount } = await import('./pdf-to-image');
      
      // First, get the total number of pages - CRITICAL: Must detect ALL pages
      let totalPages = 1; // Default to 1 page
      try {
        totalPages = await getPdfPageCount(pdfUrl);
        if (totalPages === 0 || isNaN(totalPages) || totalPages < 1) {
          console.log('[PDF Extraction] ⚠️ Could not determine page count, will try to process up to 50 pages');
          // If we can't determine, try up to 50 pages (better safe than sorry for large documents)
          totalPages = 50;
        }
        console.log(`[PDF Extraction] ✅ Detected ${totalPages} pages in PDF - will process ALL pages`);
      } catch (pageCountError) {
        console.log('[PDF Extraction] ⚠️ Page count detection failed, will process up to 50 pages:', pageCountError);
        // Default to 50 pages if we can't determine (better safe than sorry for large documents)
        totalPages = 50;
      }
      
      console.log(`[PDF Extraction] Processing PDF with ${totalPages} page(s)...`);
      
      // Process ALL pages - CRITICAL: Process every single page, don't skip any
      const allTexts: string[] = [];
      const maxPages = Math.min(totalPages, 500); // Cap at 500 pages for performance, but process ALL detected pages
      const pagesToTry = maxPages > 0 ? maxPages : 50; // Try at least 50 pages if count unknown
      
      console.log(`[PDF Extraction] 🔄 CRITICAL: Will process ALL ${pagesToTry} pages - NO pages will be skipped`);
      console.log(`[PDF Extraction] 📋 Processing pages 1 through ${pagesToTry} sequentially...`);
      
      let successfulPages = 0;
      let failedPages = 0;
      
      for (let pageNum = 1; pageNum <= pagesToTry; pageNum++) {
        const pageProgress = 20 + ((pageNum / pagesToTry) * 70); // 20% to 90%
        onProgress?.(pageProgress, `Processing page ${pageNum} of ${pagesToTry}...`);
        
        try {
          console.log(`[PDF Extraction] 📄 Processing page ${pageNum}/${pagesToTry}...`);
          
          const imageDataUrl = await convertPdfPageToImage(pdfUrl, pageNum, (progress, message) => {
            // Map page conversion progress to overall progress
            const overallProgress = pageProgress + (progress * 0.7 / pagesToTry);
            onProgress?.(overallProgress, `Page ${pageNum}/${pagesToTry}: ${message}`);
          });
          
          onProgress?.(pageProgress + 5, `Extracting text from page ${pageNum}/${pagesToTry}...`);
          
          // Extract text from this page
          const pageResult = await extractTextFromImage(imageDataUrl);
          if (pageResult.text && pageResult.text.trim().length > 10) {
            allTexts.push(`\n\n--- PAGE ${pageNum} OF ${pagesToTry} ---\n\n${pageResult.text}`);
            successfulPages++;
            console.log(`[PDF Extraction] ✅ Page ${pageNum}/${pagesToTry} processed successfully (${pageResult.text.split(/\s+/).length} words)`);
          } else {
            console.log(`[PDF Extraction] ⚠️ Page ${pageNum}/${pagesToTry} returned little/no text (${pageResult.text?.length || 0} chars)`);
            // Still add it with a note, so we know we tried
            allTexts.push(`\n\n--- PAGE ${pageNum} OF ${pagesToTry} (NO TEXT DETECTED) ---\n\n`);
            failedPages++;
          }
          
          // Small delay to avoid rate limiting
          if (pageNum < pagesToTry) {
            await new Promise(r => setTimeout(r, 100));
          }
        } catch (pageError) {
          console.error(`[PDF Extraction] ❌ Failed to process page ${pageNum}/${pagesToTry}:`, pageError);
          failedPages++;
          // CRITICAL: Continue processing remaining pages - don't stop!
          // Add a placeholder so we know we tried this page
          allTexts.push(`\n\n--- PAGE ${pageNum} OF ${pagesToTry} (PROCESSING FAILED) ---\n\n`);
          
          // Continue with next page - NEVER stop early
          continue;
        }
      }
      
      console.log(`[PDF Extraction] 📊 Processing complete: ${successfulPages} successful, ${failedPages} failed out of ${pagesToTry} pages`);
      
      // CRITICAL: Verify we processed enough pages
      if (allTexts.length === 0) {
        throw new Error(`Failed to extract text from any of the ${pagesToTry} pages. This PDF may be corrupted, password-protected, or all pages are blank.`);
      }
      
      // CRITICAL: Warn if we didn't process all expected pages
      if (totalPages > 1 && successfulPages < totalPages) {
        console.warn(`[PDF Extraction] ⚠️ WARNING: Only processed ${successfulPages} out of ${totalPages} pages!`);
        console.warn(`[PDF Extraction] ⚠️ Some pages may have been skipped. Analysis may be incomplete.`);
      }
      
      const combinedText = allTexts.join('\n');
      const wordCount = combinedText.split(/\s+/).length;
      const confidence = Math.min(0.95, 0.7 + (wordCount / 1000) * 0.25);
      
      // CRITICAL: Report actual pages processed
      const pagesWithText = allTexts.filter(t => !t.includes('NO TEXT DETECTED') && !t.includes('PROCESSING FAILED')).length;
      
      onProgress?.(100, `✅ Successfully processed ${pagesWithText} page(s) with text (${wordCount} words total)`);
      console.log(`[PDF Extraction] ✅ FINAL: Extracted ${wordCount} words from ${pagesWithText} page(s) (attempted ${allTexts.length} pages)`);
      
      if (totalPages > pagesWithText) {
        console.warn(`[PDF Extraction] ⚠️ ATTENTION: PDF has ${totalPages} pages but only ${pagesWithText} had extractable text.`);
      }

  return {
        text: combinedText,
        confidence,
        pageCount: allTexts.length,
      };
    } catch (conversionError) {
      const errorMsg = conversionError instanceof Error ? conversionError.message : String(conversionError);
      console.error('PDF to image conversion failed:', errorMsg);
      
      throw new Error(
        'Could not extract text from this PDF. The system attempted to automatically convert it but encountered an error. ' +
        'Please ensure the PDF is not password-protected or corrupted. ' +
        `Error: ${errorMsg}`
      );
    }
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from base64-encoded image or PDF data using OpenAI Vision
 */
export async function extractTextFromBase64(
  base64Data: string,
  mimeType: string
): Promise<OCRResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  // Validate MIME type
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (!supportedTypes.includes(mimeType.toLowerCase())) {
    throw new Error(`Unsupported file type: ${mimeType}. Supported types: ${supportedTypes.join(', ')}`);
  }

  // If it's a PDF, convert to image first
  if (mimeType.toLowerCase() === 'application/pdf') {
    const pdfDataUrl = `data:${mimeType};base64,${base64Data}`;
    return await extractTextFromPdf(pdfDataUrl);
  }

  // Create data URL from base64 for images
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this image/document. Return ONLY the text content, no explanations or formatting. Preserve the structure and layout as much as possible.',
            },
            {
              type: 'image_url',
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI Vision API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  
  if (!text || text.trim().length < 10) {
    return {
      text: '',
      confidence: 0,
      pageCount: 1,
    };
  }

  // Estimate confidence based on text length
  const wordCount = text.split(/\s+/).length;
  const confidence = Math.min(0.95, 0.7 + (wordCount / 1000) * 0.25);

  return {
    text: text.trim(),
    confidence,
    pageCount: 1,
  };
}

/**
 * Check if extracted text is sufficient for analysis
 */
export function isTextSufficient(text: string, minWords: number = 20): boolean {
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  return wordCount >= minWords;
}

