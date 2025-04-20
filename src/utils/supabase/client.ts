
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with environment variables
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Flag to check if we have valid credentials
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseUrl.includes('supabase.co') &&
  supabaseAnonKey && 
  supabaseAnonKey.length > 10
);

if (!isSupabaseConfigured) {
  console.warn('Supabase is not properly configured. Please make sure your Supabase credentials are set correctly.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

