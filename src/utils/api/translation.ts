
import { supabase, isSupabaseConfigured } from '../supabase';
import { toast } from 'sonner';

// Translate text to English using OpenAI via Supabase Edge Function or fallback
export const translateToEnglish = async (text: string): Promise<string> => {
  try {
    // If Supabase is not configured properly, use fallback immediately
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }
    
    console.log('Invoking translate-text function with text:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
    
    // Try using Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('translate-text', {
      body: { text }
    });
    
    if (error) {
      console.error('Error calling translate function:', error);
      throw error;
    }
    
    return data.translatedText;
  } catch (error) {
    console.warn('Error calling translate function via Supabase, using simple fallback:', error);
    // Simple fallback - just return the original text
    toast.warning('Translation service unavailable. Using original text.');
    return text;
  }
};
