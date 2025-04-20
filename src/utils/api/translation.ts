
import { supabase, isSupabaseConfigured } from '../supabase';
import { toast } from 'sonner';

// Translate text to English using OpenAI via Supabase Edge Function or fallback
export const translateToEnglish = async (text: string): Promise<string> => {
  try {
    // If Supabase is not configured properly, use fallback immediately
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, using original text');
      throw new Error('Supabase not configured');
    }
    
    console.log('Invoking translate-text function with text:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    
    // Add a timeout to prevent the function from hanging indefinitely
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Translation function timed out after 8 seconds'));
      }, 8000);
    });

    // Try using Supabase Edge Function
    const functionPromise = supabase.functions.invoke('translate-text', {
      body: { text }
    });
    
    // Race between the function call and the timeout
    const { data, error } = await Promise.race([functionPromise, timeoutPromise]);
    
    if (error) {
      console.error('Error calling translate function:', error);
      throw error;
    }

    if (!data || !data.translatedText) {
      console.error('Invalid response from translate function:', data);
      throw new Error('Invalid response from translate function');
    }
    
    console.log('Translation function responded successfully');
    return data.translatedText;
  } catch (error) {
    console.warn('Error calling translate function via Supabase, using simple fallback:', error);
    // Simple fallback - just return the original text
    toast.warning('Translation service unavailable. Using original text.');
    return text;
  }
};
