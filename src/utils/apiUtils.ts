
import { supabase } from './supabase';
import { WheelData } from '@/context/UserContext';

// Translate text to English using OpenAI via Supabase Edge Function
export const translateToEnglish = async (text: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('translate-text', {
      body: { text }
    });
    
    if (error) {
      console.error('Error translating text:', error);
      throw error;
    }
    
    return data.translatedText;
  } catch (error) {
    console.error('Error calling translate function:', error);
    throw error;
  }
};

// Classify feedback using OpenAI via Supabase Edge Function
export const classifyFeedback = async (text: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('classify-feedback', {
      body: { text }
    });
    
    if (error) {
      console.error('Error classifying feedback:', error);
      throw error;
    }
    
    return data.categories;
  } catch (error) {
    console.error('Error calling classify function:', error);
    throw error;
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
      console.error('Error generating analysis:', error);
      throw error;
    }
    
    return data.analysis;
  } catch (error) {
    console.error('Error calling analysis function:', error);
    throw error;
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
      console.error('Error updating wheel from feedback:', error);
      throw error;
    }
    
    return data.updatedWheelData;
  } catch (error) {
    console.error('Error calling update wheel function:', error);
    throw error;
  }
};
