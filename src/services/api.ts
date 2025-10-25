import { Module } from '../types';
import { sanitizeUrl, isValidImageUrl, sanitizePrompt } from '../utils/security';

const WEBHOOK_BASE_URL = 'https://wtfrank.app.n8n.cloud/webhook/image';

interface ApiResponse {
  success: boolean;
  output_url?: string;
  output_urls?: string[]; // Çoklu görsel desteği için
  error?: string;
  processing_time?: number;
  model_version?: string;
  status?: string;
  web_url?: string;
  predict_time?: number;
  raw_response?: any;
}

/**
 * Safe fetch wrapper that handles response body reading correctly
 * Prevents "body stream already read" errors by using res.clone()
 */
async function fetchSafeJson(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const type = res.headers.get("content-type") || "";
  let data: any;

  // Read the response body only once
  try {
    if (type.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }
  } catch (parseError) {
    // If JSON parsing fails, try as text
    try {
      const textData = await res.text();
      data = textData;
    } catch {
      data = null;
    }
  }

  // Log the response data (already parsed, no body stream reading)
  console.log('📨 API Response Status:', res.status, res.statusText);
  console.log('📨 API Response Data:', data);

  if (!res.ok) {
    const errorMsg = typeof data === "string" ? data : (data ? JSON.stringify(data) : `HTTP ${res.status}: ${res.statusText}`);
    throw new Error(errorMsg);
  }
  
  if (!data) {
    throw new Error(`Empty response from API (HTTP ${res.status})`);
  }
  
  // Clean up newline characters from string fields
  if (typeof data === 'object' && data !== null) {
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string') {
        data[key] = data[key].trim();
      }
    });
  }
  
  // Check for actual errors (ignore empty strings or whitespace)
  if (data?.error && data.error.trim()) {
    const errorMessage = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
    
    // Handle specific error types with user-friendly messages
    if (errorMessage.toLowerCase().includes('nsfw')) {
      throw new Error('⚠️ Content Safety Filter Triggered\n\nThe AI model flagged this image for safety reasons. This can happen with:\n• Certain types of content\n• Unclear or low-quality images\n• Specific artistic styles\n\nSuggestions:\n• Try a different image\n• Use a more descriptive prompt\n• Crop or edit the original image');
    }
    
    throw new Error(errorMessage);
  }

  return data;
}

/**
 * Upscale an image using the n8n webhook
 */
async function upscale(imageUrl: string, scale = 2, faceEnhance = true) {
  // Security: Validate image URL
  if (!isValidImageUrl(imageUrl)) {
    throw new Error('Invalid image URL');
  }
  
  const sanitizedUrl = sanitizeUrl(imageUrl);
  if (!sanitizedUrl) {
    throw new Error('Failed to sanitize image URL');
  }

  const endpoint = `${WEBHOOK_BASE_URL}/upscale`;
  const payload = { image_url: sanitizedUrl, scale, face_enhance: faceEnhance };

  const data = await fetchSafeJson(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return data; // {status, output_url, prediction_id, predict_time, web_url, error}
}

export async function processImage(
  module: Module,
  imageUrl: string,
  params: any
): Promise<ApiResponse> {
  const startTime = Date.now();

  // Security: Validate image URL
  if (!isValidImageUrl(imageUrl)) {
    throw new Error('Invalid image URL');
  }
  
  const sanitizedUrl = sanitizeUrl(imageUrl);
  if (!sanitizedUrl) {
    throw new Error('Failed to sanitize image URL');
  }

  try {
    let endpoint = '';
    let payload: any = { image_url: sanitizedUrl };

    switch (module) {
      case 'upscale':
        endpoint = `${WEBHOOK_BASE_URL}/upscale`;
        payload = {
          ...payload,
          scale: params.scale,
          face_enhance: params.face_enhance,
        };
        break;

      case 'remove-bg':
        endpoint = `${WEBHOOK_BASE_URL}/remove-bg`;
        payload = {
          ...payload,
          threshold: params.threshold ?? 0,
        };
        console.log('🎭 Remove BG Request:', payload);
        break;

      case 'pixel-change':
        endpoint = `${WEBHOOK_BASE_URL}/pixel-change`;
        payload = {
          ...payload,
          prompt: sanitizePrompt(params.prompt),
          strength: params.strength,
        };
        break;

      default:
        throw new Error('Invalid module');
    }

    // Use the safe fetch wrapper
    const data = await fetchSafeJson(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const processingTime = (Date.now() - startTime) / 1000;

    // Parse predict_time to number (handle empty strings or invalid values)
    let predictTime: number | undefined;
    if (data.predict_time) {
      const parsed = parseFloat(data.predict_time);
      if (!isNaN(parsed)) {
        predictTime = parsed;
      }
    }

    // Handle multiple output URLs (for operations that may return multiple images)
    let outputUrls: string[] | undefined;
    if (data.output_urls && Array.isArray(data.output_urls)) {
      outputUrls = data.output_urls;
    }

    return {
      success: true,
      output_url: data.output_url || data.result_url || data.image_url || (outputUrls && outputUrls[0]),
      output_urls: outputUrls,
      processing_time: processingTime,
      model_version: data.model_version || 'n8n-replicate',
      status: data.status,
      web_url: data.web_url,
      predict_time: predictTime,
      raw_response: data,
    };
  } catch (error) {
    const processingTime = (Date.now() - startTime) / 1000;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      processing_time: processingTime,
    };
  }
}

/**
 * Upload image to cloud storage and return public HTTPS URL
 * 
 * IMPORTANT: For the n8n webhook to work, you need a public HTTPS URL.
 * Data URLs (base64) won't work with n8n webhooks!
 * 
 * Options:
 * 1. Use Supabase (recommended): Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
 * 2. Use ImgBB (free): Set VITE_IMGBB_API_KEY in .env (get key from https://api.imgbb.com/)
 * 3. Use your own image hosting service
 */
export async function uploadImage(file: File): Promise<string> {
  console.log('🔄 Starting image upload...', file.name, file.size, 'bytes');
  
  try {
    // Try to use cloud upload services if configured
    const { uploadToSupabase, uploadToImgbb, supabase } = await import('./supabase');
    
    console.log('✅ Cloud storage module loaded');
    console.log('🔍 Supabase configured?', !!supabase);
    console.log('🔍 ImgBB configured?', !!import.meta.env.VITE_IMGBB_API_KEY);
    
    // Priority 1: Try Supabase if configured
    if (supabase) {
      console.log('📤 Attempting Supabase upload...');
      try {
        const url = await uploadToSupabase(file);
        console.log('✅ Supabase upload successful!', url);
        return url;
      } catch (error) {
        // Quietly fall back to ImgBB if Supabase bucket doesn't exist
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('Bucket not found')) {
          console.warn('⚠️ Supabase storage bucket not configured, using ImgBB fallback');
        } else {
          console.error('❌ Supabase upload failed:', errorMessage);
        }
      }
    }
    
    // Priority 2: Try ImgBB if API key is set
    if (import.meta.env.VITE_IMGBB_API_KEY) {
      console.log('📤 Attempting ImgBB upload...');
      try {
        const url = await uploadToImgbb(file);
        console.log('✅ ImgBB upload successful!', url);
        return url;
      } catch (error) {
        console.error('❌ ImgBB upload failed:', error);
        console.error('Full error:', error instanceof Error ? error.message : error);
      }
    }
    
    // Fallback: Return data URL (for preview only - won't work with n8n webhooks)
    console.warn('⚠️ No cloud storage configured! Using data URL (won\'t work with n8n webhooks)');
    console.warn('💡 Configure VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY or VITE_IMGBB_API_KEY in .env');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('💥 Upload module error:', error);
    // Fallback to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

// Export upscale function for direct use if needed
export { upscale };
