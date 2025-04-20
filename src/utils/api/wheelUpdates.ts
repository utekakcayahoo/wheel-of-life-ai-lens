
import { supabase, isSupabaseConfigured } from '../supabase';
import { WheelData } from '@/types/userTypes';
import { toast } from 'sonner';
import { checkDatabaseSetup } from '../supabase/databaseCheck';

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
      console.log('Supabase not configured, using fallback');
      throw new Error('Supabase not configured');
    }
    
    const isDatabaseSetup = await checkDatabaseSetup();
    if (!isDatabaseSetup) {
      throw new Error('Database tables not set up properly');
    }
    
    console.log('Attempting to update wheel from feedback');
    
    const timeoutPromise = new Promise<{error: {message: string}}>((_, reject) => {
      setTimeout(() => {
        reject({ error: { message: 'Function call timed out after 8 seconds' } });
      }, 8000);
    });

    const functionPromise = supabase.functions.invoke('update-wheel-from-feedback', {
      body: { baseWheelData, feedback }
    });

    const response = await Promise.race([functionPromise, timeoutPromise]);
    
    if ('error' in response) {
      console.error('Wheel update function error:', response.error);
      toast.warning('Wheel update service encountered an issue.', {
        description: response.error?.message || 'Unable to update wheel automatically'
      });
      throw response.error;
    }
    
    // Fix the type issue by using type assertion to tell TypeScript what the response structure is
    const typedResponse = response as { data?: { updatedWheelData: WheelData } };
    
    if (!typedResponse.data?.updatedWheelData) {
      console.warn('No valid wheel data returned from update function');
      throw new Error('Invalid wheel data update response');
    }
    
    return typedResponse.data.updatedWheelData;
  } catch (error) {
    console.warn('Fallback wheel update triggered:', error);
    
    toast.warning('Wheel update service unavailable. Using simple update logic.', {
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    
    const updatedData = { ...baseWheelData };
    feedback.categories.forEach(category => {
      if (updatedData[category] !== undefined) {
        const text = feedback.text.toLowerCase();
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'positive', 'better', 'improve'];
        const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'negative', 'worse', 'decline', 'struggle'];
        
        let adjustment = 0.5;
        
        if (positiveWords.some(word => text.includes(word))) {
          adjustment = 0.8;
        }
        if (negativeWords.some(word => text.includes(word))) {
          adjustment = -0.5;
        }
        
        updatedData[category] = Math.max(1, Math.min(10, updatedData[category] + adjustment));
      }
    });
    
    return updatedData;
  }
};
