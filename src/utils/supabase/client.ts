
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://xnssbbxobfahdmwyqqme.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhuc3NiYnhvYmZhaGRtd3lxcW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNzcyMjgsImV4cCI6MjA2MDY1MzIyOH0.drCPt6Cn7qDpBn4IOB1RcDI6pRzF6iWH4LDAyS70cpo';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Flag to check if we have valid credentials (always true now since we have real credentials)
export const isSupabaseConfigured = true;

