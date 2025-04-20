
import { supabase, isSupabaseConfigured } from './supabase';
import { WheelData } from '@/context/UserContext';
import { translateToEnglish as directTranslate, generateWheelAnalysis as directAnalysis } from './api';
import { toast } from 'sonner';

// Translate text to English using OpenAI via Supabase Edge Function or fallback
export const translateToEnglish = async (text: string): Promise<string> => {
  try {
    // If Supabase is not configured properly, use fallback immediately
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }
    
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

// Generate wheel of life analysis based on user data
export const generateWheelAnalysis = async (
  wheelData: WheelData,
  username: string
): Promise<string> => {
  try {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }
    
    console.log('Invoking generate-wheel-analysis function with data:', { wheelData, username });
    
    const { data, error } = await supabase.functions.invoke('generate-wheel-analysis', {
      body: { wheelData, username }
    });
    
    if (error) {
      console.error('Error calling analysis function:', error);
      throw error;
    }
    
    return data.analysis;
  } catch (error) {
    console.warn('Error calling analysis function via Supabase, using simple fallback:', error);
    // Simple fallback - generate a basic analysis
    toast.warning('Analysis service unavailable. Using simple analysis template.');
    
    // Find highest and lowest categories
    const entries = Object.entries(wheelData);
    const sorted = [...entries].sort((a, b) => b[1] - a[1]);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];
    
    return `Here's a simple analysis of ${username}'s Wheel of Life:

Your strongest area is ${highest[0]} with a score of ${highest[1]}/10. This shows good development and focus in this area.

Your area with the most room for improvement is ${lowest[0]} with a score of ${lowest[1]}/10. Consider dedicating some time to develop this aspect of your life.

Overall, your wheel shows a ${getBalanceAssessment(wheelData)} balance across life categories. Continue to work on maintaining or improving this balance.`;
  }
};

// Helper function to assess wheel balance
function getBalanceAssessment(wheelData: WheelData): string {
  const values = Object.values(wheelData);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const difference = max - min;
  
  if (difference <= 2) return "good";
  if (difference <= 4) return "moderate";
  return "significant imbalance in";
}

// Update wheel data based on feedback
export const updateWheelFromFeedback = async (
  baseWheelData: WheelData,
  feedback: {
    from: string;
    text: string;
    categories: string[];
  }
): Promise<WheelData> => {
  try {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }
    
    console.log('Invoking update-wheel-from-feedback function with data:', {
      baseWheelData,
      feedback
    });
    
    const { data, error } = await supabase.functions.invoke('update-wheel-from-feedback', {
      body: {
        baseWheelData,
        feedback
      }
    });
    
    if (error) {
      console.error('Error calling update wheel function:', error);
      throw error;
    }
    
    console.log('Updated wheel data:', data.updatedWheelData);
    return data.updatedWheelData;
  } catch (error) {
    console.warn('Error calling update wheel function via Supabase, using simple fallback:', error);
    toast.warning('Wheel update service unavailable. Using simple update logic.');
    
    // Simple fallback - adjust categories mentioned in feedback slightly
    const updatedData = { ...baseWheelData };
    feedback.categories.forEach(category => {
      if (updatedData[category] !== undefined) {
        // Simple logic: Analyze sentiment in a very basic way
        const text = feedback.text.toLowerCase();
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'positive', 'better', 'improve'];
        const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'negative', 'worse', 'decline', 'struggle'];
        
        let adjustment = 0.5; // Default small positive adjustment
        
        // Check for positive words
        if (positiveWords.some(word => text.includes(word))) {
          adjustment = 0.8;
        }
        // Check for negative words
        if (negativeWords.some(word => text.includes(word))) {
          adjustment = -0.5;
        }
        
        // Apply the adjustment
        updatedData[category] = Math.max(1, Math.min(10, updatedData[category] + adjustment));
      }
    });
    
    return updatedData;
  }
};
