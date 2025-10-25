/**
 * Security utility functions for input sanitization and XSS protection
 */

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Validate image URL
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:', 'blob:', 'data:'].includes(parsed.protocol)) {
      return false;
    }
    // Check if URL ends with image extension or is a blob/data URL
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => 
      parsed.pathname.toLowerCase().endsWith(ext)
    );
    const isBlobOrData = ['blob:', 'data:'].includes(parsed.protocol);
    
    return hasImageExtension || isBlobOrData;
  } catch {
    return false;
  }
}

/**
 * Validate file upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, GIF, WEBP, and SVG are allowed.',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 50MB.',
    };
  }

  return { valid: true };
}

/**
 * Sanitize user input for prompts and text
 */
export function sanitizePrompt(input: string): string {
  // Remove dangerous characters and patterns
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 5000); // Limit length
}

/**
 * Validate environment variables
 */
export function validateEnvVars(): { valid: boolean; missing: string[] } {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const missing = requiredVars.filter(varName => !import.meta.env[varName]);

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Rate limiter for API calls (client-side basic protection)
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the time window
    const recentRequests = requests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

/**
 * Content Security Policy helper
 */
export function setupCSP(): void {
  // This would typically be done server-side, but we can add some client-side headers
  // Note: This is limited in effectiveness on the client side
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = "default-src 'self'; img-src 'self' data: https: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';";
  
  // Only add if not already present
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    document.head.appendChild(meta);
  }
}
