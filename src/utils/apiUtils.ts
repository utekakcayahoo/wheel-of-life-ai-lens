
import { supabase } from './supabase';
import { WheelData } from '@/context/UserContext';
import { translateToEnglish as directTranslate, generateWheelAnalysis as directAnalysis } from './api';

// Translate text to English using OpenAI via Supabase Edge Function or fallback
export const translateToEnglish = async (text: string): Promise<string> => {
  try {
    // Try using Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('translate-text', {
      body: { text }
    });
    
    if (error) {
      throw error;
    }
    
    return data.translatedText;
  } catch (error) {
    console.warn('Error calling translate function via Supabase, using fallback method:', error);
    // Fallback to direct API call
    return directTranslate(text, 'REPLACE_WITH_YOUR_API_KEY');
  }
};

// Classify feedback using OpenAI via Supabase Edge Function or fallback
export const classifyFeedback = async (text: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('classify-feedback', {
      body: { text }
    });
    
    if (error) {
      throw error;
    }
    
    return data.categories;
  } catch (error) {
    console.warn('Error calling classify function via Supabase:', error);
    // Simple fallback - just return some generic categories
    console.log('Using fallback classification method');
    return ['Personal Growth', 'Mental Health'];
  }
};

// Generate wheel of life analysis based on user data
export const generateWheelAnalysis = async (
  wheelData: WheelData,
  username: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-wheel-analysis', {
      body: { wheelData, username }
    });
    
    if (error) {
      throw error;
    }
    
    return data.analysis;
  } catch (error) {
    console.warn('Error calling analysis function via Supabase, using fallback method:', error);
    // Fallback to direct API call
    return directAnalysis(wheelData, username, 'REPLACE_WITH_YOUR_API_KEY');
  }
};

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
    const { data, error } = await supabase.functions.invoke('update-wheel-from-feedback', {
      body: {
        baseWheelData,
        feedback
      }
    });
    
    if (error) {
      throw error;
    }
    
    return data.updatedWheelData;
  } catch (error) {
    console.warn('Error calling update wheel function via Supabase:', error);
    
    // Simple fallback - adjust categories mentioned in feedback slightly
    const updatedData = { ...baseWheelData };
    feedback.categories.forEach(category => {
      if (updatedData[category] !== undefined) {
        // Simple logic: Slightly increase the score for mentioned categories
        updatedData[category] = Math.min(10, updatedData[category] + 0.5);
      }
    });
    
    return updatedData;
  }
};
