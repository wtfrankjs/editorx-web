import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase configuration missing! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Create Supabase client
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': 'editorx-web'
      }
    }
  }
);

// Keep connection warm with periodic lightweight queries
let warmupInterval: number | null = null;

export function initializeSupabaseWarmup() {
  if (warmupInterval) return; // Already running
  
  // Ping database every 3 minutes to prevent cold starts (Free Tier aggressively pauses)
  warmupInterval = window.setInterval(async () => {
    try {
      // Lightweight query to keep connection alive
      await supabase.from('profiles').select('id').limit(1);
      console.log('🔥 Supabase connection kept warm');
    } catch (error) {
      console.warn('Warmup ping failed:', error);
    }
  }, 3 * 60 * 1000); // 3 minutes (more aggressive than 5min)
  
  console.log('🚀 Supabase warmup initialized (3min interval)');
}

export function stopSupabaseWarmup() {
  if (warmupInterval) {
    clearInterval(warmupInterval);
    warmupInterval = null;
    console.log('❄️ Supabase warmup stopped');
  }
}

// Database types
export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  credits: number;
  total_spent: number;
  membership_tier: 'free' | 'starter' | 'pro' | 'enterprise';
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  thumbnail_url: string | null;
  layers: any[];
  created_at: string;
  updated_at: string;
};

// Auth helper functions
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Profile cache to avoid redundant queries
const profileCache = new Map<string, { profile: Profile; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minute cache (profile data rarely changes)

// Clear profile cache (useful after RLS policy changes)
export function clearProfileCache(userId?: string) {
  if (userId) {
    profileCache.delete(userId);
    console.log('🗑️ Profile cache cleared for user:', userId);
  } else {
    profileCache.clear();
    console.log('🗑️ All profile cache cleared');
  }
}

export async function getUserProfile(userId: string, bypassCache = false): Promise<Profile | null> {
  console.log('getUserProfile: Fetching profile for userId:', userId);
  
  // Check cache first (unless bypassed)
  if (!bypassCache) {
    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('getUserProfile: Returning cached profile (age:', Math.round((Date.now() - cached.timestamp) / 1000), 's)');
      return cached.profile;
    }
  }
  
  // Retry logic for slow initial connections
  const maxRetries = 2;
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`getUserProfile: Attempt ${attempt}/${maxRetries}...`);
      
      // Direct query without timeout race condition for better reliability
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      console.log(`getUserProfile: Query completed (attempt ${attempt})`);
      console.log('getUserProfile: Data received:', data);
      console.log('getUserProfile: Error received:', error);

      if (error) {
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          console.log('getUserProfile: Profile not found (PGRST116), creating new profile...');
          
          // Get user data from auth
          const { data: { user } } = await supabase.auth.getUser();
          console.log('getUserProfile: Auth user for profile creation:', user?.email);
          
          if (user) {
            // Note: Currently each OAuth provider creates separate accounts
            // To merge accounts by email, you need to:
            // 1. Enable "Confirm email" in Supabase Auth settings
            // 2. Set "Account linking" to "Automatic" for same email
            // This prevents duplicate accounts for Google/GitHub with same email
            
            const newProfile: Partial<Profile> = {
              id: userId,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
              credits: 100,
              total_spent: 0,
              membership_tier: 'free',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const { data: createdProfile, error: createError } = await supabase
              .from('profiles')
              .insert(newProfile)
              .select()
              .single();
            
            if (createError) {
              console.error('getUserProfile: Error creating profile:', createError);
              return null;
            }
            
            console.log('getUserProfile: Profile created successfully!');
            const profile = createdProfile as Profile;
            // Cache the newly created profile
            profileCache.set(userId, { profile, timestamp: Date.now() });
            return profile;
          }
        }
        
        // Store error for potential retry
        lastError = error;
        console.warn(`getUserProfile: Attempt ${attempt} failed:`, error.message);
        
        // Don't retry on PGRST116 (not found) or other non-timeout errors
        if (error.code === 'PGRST116' || !error.message?.includes('timeout')) {
          return null;
        }
        
        // Wait before retry
        if (attempt < maxRetries) {
          console.log(`getUserProfile: Retrying in 1s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      } else {
        // Success! Cache and return
        console.log('getUserProfile: Profile found successfully!');
        profileCache.set(userId, { profile: data, timestamp: Date.now() });
        return data;
      }
    } catch (error: any) {
      lastError = error;
      console.error(`getUserProfile: Attempt ${attempt} exception:`, error.message);
      
      // Retry on network errors
      if (attempt < maxRetries) {
        console.log(`getUserProfile: Retrying in 1s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
    }
  }
  
  // All retries failed
  console.error('getUserProfile: All attempts failed. Last error:', lastError);
  return null;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function deductCredits(userId: string, credits: number, description: string, processingId?: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('use_credits', {
    p_user_id: userId,
    p_credits: credits,
    p_description: description,
    p_processing_id: processingId || null,
  });

  if (error) {
    console.error('Error deducting credits:', error);
    return false;
  }

  return data as boolean;
}

export async function addCredits(userId: string, credits: number, type: 'purchase' | 'bonus' | 'refund', description: string) {
  const { error } = await supabase.rpc('add_credits', {
    p_user_id: userId,
    p_credits: credits,
    p_type: type,
    p_description: description,
  });

  if (error) {
    console.error('Error adding credits:', error);
    throw error;
  }
}

export async function saveProcessingHistory(data: {
  user_id: string;
  project_id?: string;
  module: 'upscale' | 'remove-bg' | 'pixel-change';
  input_url: string;
  output_url: string;
  params: Record<string, any>;
  credits_used: number;
  processing_time?: number;
  status: 'success' | 'failed' | 'processing';
  error_message?: string;
}) {
  const { data: result, error } = await supabase
    .from('processing_history')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error saving processing history:', error);
    throw error;
  }

  return result;
}

/**
 * Upload image to Supabase Storage and return public URL
 * Make sure you've created a 'images' bucket in Supabase with public access
 */
export async function uploadToSupabase(file: File): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  }

  // Sanitize filename and add unique identifier
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${sanitizedName}`;
  
  // First check if bucket exists and create if needed
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.warn('Could not list buckets (may need admin permissions):', listError.message);
      // Continue anyway - bucket might exist even if we can't list
    } else {
      const imagesBucket = buckets?.find(b => b.name === 'images');
      
      if (!imagesBucket) {
        console.log('Images bucket not found, attempting to create...');
        // Create bucket with public access
        const { error: createError } = await supabase.storage.createBucket('images', {
          public: true,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
        });
        
        if (createError) {
          if (createError.message.includes('already exists')) {
            console.log('Images bucket already exists');
          } else {
            console.warn('Could not create bucket (may need admin permissions):', createError.message);
            // Continue anyway - admin might need to create it manually
          }
        } else {
          console.log('✅ Images bucket created successfully');
        }
      } else {
        console.log('✅ Images bucket already exists');
      }
    }
  } catch (error) {
    console.warn('Bucket verification error:', error);
    // Continue anyway - try to upload
  }

  const { error } = await supabase.storage
    .from('images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg'
    });

  if (error) {
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('images')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Alternative: Upload to imgbb.com (free image hosting)
 * Get your API key from https://api.imgbb.com/
 */
export async function uploadToImgbb(file: File, apiKey?: string): Promise<string> {
  const key = apiKey || import.meta.env.VITE_IMGBB_API_KEY;
  
  if (!key) {
    throw new Error('ImgBB API key not configured. Set VITE_IMGBB_API_KEY environment variable.');
  }

  const formData = new FormData();
  formData.append('image', file);
  formData.append('key', key);

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`ImgBB upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error('ImgBB upload failed');
  }

  return data.data.url;
}

