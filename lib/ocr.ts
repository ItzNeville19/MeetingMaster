import vision from '@google-cloud/vision';

// Initialize the Vision API client
const client = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

export interface OCRResult {
  text: string;
  confidence: number;
  pageCount: number;
}

/**
 * Extract text from an image or PDF URL using Google Cloud Vision OCR
 */
export async function extractText(fileUrl: string): Promise<OCRResult> {
  try {
    // Detect if the file is a PDF or image
    const isPdf = fileUrl.toLowerCase().includes('.pdf') || 
                  fileUrl.includes('application/pdf');
    
    if (isPdf) {
      return await extractTextFromPdf(fileUrl);
    } else {
      return await extractTextFromImage(fileUrl);
    }
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from an image using document text detection
 */
async function extractTextFromImage(imageUrl: string): Promise<OCRResult> {
  const [result] = await client.documentTextDetection({
    image: { source: { imageUri: imageUrl } },
  });

  const fullTextAnnotation = result.fullTextAnnotation;
  
  if (!fullTextAnnotation || !fullTextAnnotation.text) {
    return {
      text: '',
      confidence: 0,
      pageCount: 1,
    };
  }

  // Calculate average confidence
  let totalConfidence = 0;
  let blockCount = 0;
  
  fullTextAnnotation.pages?.forEach(page => {
    page.blocks?.forEach(block => {
      if (block.confidence) {
        totalConfidence += block.confidence;
        blockCount++;
      }
    });
  });

  return {
    text: fullTextAnnotation.text,
    confidence: blockCount > 0 ? totalConfidence / blockCount : 0.9,
    pageCount: fullTextAnnotation.pages?.length || 1,
  };
}

/**
 * Extract text from a PDF using async document text detection
 */
async function extractTextFromPdf(pdfUrl: string): Promise<OCRResult> {
  // For PDFs, we use the async batch annotation
  // This requires GCS bucket for output, so we'll use a simpler approach
  // by treating the first page as an image
  
  const [result] = await client.documentTextDetection({
    image: { source: { imageUri: pdfUrl } },
  });

  const fullTextAnnotation = result.fullTextAnnotation;
  
  if (!fullTextAnnotation || !fullTextAnnotation.text) {
    return {
      text: '',
      confidence: 0,
      pageCount: 1,
    };
  }

  // Calculate average confidence
  let totalConfidence = 0;
  let blockCount = 0;
  
  fullTextAnnotation.pages?.forEach(page => {
    page.blocks?.forEach(block => {
      if (block.confidence) {
        totalConfidence += block.confidence;
        blockCount++;
      }
    });
  });

  return {
    text: fullTextAnnotation.text,
    confidence: blockCount > 0 ? totalConfidence / blockCount : 0.9,
    pageCount: fullTextAnnotation.pages?.length || 1,
  };
}

/**
 * Extract text from base64-encoded image data
 */
export async function extractTextFromBase64(
  base64Data: string,
  mimeType: string
): Promise<OCRResult> {
  const [result] = await client.documentTextDetection({
    image: { content: base64Data },
  });

  const fullTextAnnotation = result.fullTextAnnotation;
  
  if (!fullTextAnnotation || !fullTextAnnotation.text) {
    return {
      text: '',
      confidence: 0,
      pageCount: 1,
    };
  }

  let totalConfidence = 0;
  let blockCount = 0;
  
  fullTextAnnotation.pages?.forEach(page => {
    page.blocks?.forEach(block => {
      if (block.confidence) {
        totalConfidence += block.confidence;
        blockCount++;
      }
    });
  });

  return {
    text: fullTextAnnotation.text,
    confidence: blockCount > 0 ? totalConfidence / blockCount : 0.9,
    pageCount: fullTextAnnotation.pages?.length || 1,
  };
}

/**
 * Check if extracted text is sufficient for analysis
 */
export function isTextSufficient(text: string, minWords: number = 20): boolean {
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  return wordCount >= minWords;
}

