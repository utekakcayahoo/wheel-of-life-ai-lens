
import { supabase, isSupabaseConfigured } from '../supabase';
import { toast } from 'sonner';

// Classify feedback using OpenAI via Supabase Edge Function or fallback
export const classifyFeedback = async (text: string): Promise<string[]> => {
  try {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }
    
    console.log('Invoking classify-feedback function with text:', text);
    
    const { data, error } = await supabase.functions.invoke('classify-feedback', {
      body: { text }
    });
    
    if (error) {
      console.error('Error calling classify function:', error);
      throw error;
    }
    
    console.log('Classification result:', data);
    return data.categories;
  } catch (error) {
    console.warn('Error calling classify function via Supabase:', error);
    // Simple fallback - just extract potential categories from text
    console.log('Using simple fallback classification method');
    toast.warning('Classification service unavailable. Using simple category extraction.');
    
    // Simple keyword matching to extract categories
    const categories = [];
    const keywordMap = {
      'career': 'Career',
      'job': 'Career',
      'work': 'Career',
      'relationship': 'Relationships',
      'family': 'Relationships',
      'friend': 'Relationships',
      'marriage': 'Relationships',
      'personal': 'Personal Growth',
      'growth': 'Personal Growth',
      'learn': 'Personal Growth',
      'health': 'Physical Health',
      'exercise': 'Physical Health',
      'fitness': 'Physical Health',
      'money': 'Finance',
      'finance': 'Finance',
      'investment': 'Finance',
      'mental': 'Mental Health',
      'stress': 'Mental Health',
      'anxiety': 'Mental Health'
    };
    
    const lowerText = text.toLowerCase();
    Object.entries(keywordMap).forEach(([keyword, category]) => {
      if (lowerText.includes(keyword) && !categories.includes(category)) {
        categories.push(category);
      }
    });
    
    return categories.length > 0 ? categories : ['Personal Growth', 'Mental Health'];
  }
};
