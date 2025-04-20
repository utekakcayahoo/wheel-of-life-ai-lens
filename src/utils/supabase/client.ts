
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with fallback values to prevent crashes
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if proper Supabase credentials are available
export const hasValidSupabaseCredentials = 
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_URL.includes('supabase.co') &&
  import.meta.env.VITE_SUPABASE_ANON_KEY && 
  import.meta.env.VITE_SUPABASE_ANON_KEY.length > 10;

// Create client (will use fallback values if real credentials aren't available)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Flag to check if we have valid credentials
export const isSupabaseConfigured = hasValidSupabaseCredentials;

if (!hasValidSupabaseCredentials) {
  console.warn('Supabase is not properly configured. Using mock data mode. To enable Supabase functionality, please set the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

