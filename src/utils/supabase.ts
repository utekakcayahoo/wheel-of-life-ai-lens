
import { createClient } from '@supabase/supabase-js';

// Use environment variables if available, otherwise fall back to hardcoded values
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xnssbbxobfahdmwyqqme.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhuc3NiYnhvYmZhaGRtd3lxcW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNzcyMjgsImV4cCI6MjA2MDY1MzIyOH0.drCPt6Cn7qDpBn4IOB1RcDI6pRzF6iWH4LDAyS70cpo';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Flag to check if we have valid credentials
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

console.log('Supabase configured:', isSupabaseConfigured);
console.log('Supabase URL:', supabaseUrl);
