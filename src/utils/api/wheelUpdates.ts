
import { supabase, isSupabaseConfigured } from '../supabase';
import { WheelData } from '@/types/userTypes';
import { toast } from 'sonner';

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
      console.log('Supabase not configured, using fallback');
      throw new Error('Supabase not configured');
    }
    
    console.log('Invoking update-wheel-from-feedback function with data:', {
      baseWheelData,
      feedback
    });
    
    // Set a client-side timeout
    const timeoutPromise = new Promise<{error: {message: string}}>((_, reject) => {
      setTimeout(() => {
        reject({ error: { message: 'Function call timed out after 8 seconds' } });
      }, 8000);
    });

    // Call the Supabase function
    const functionPromise = supabase.functions.invoke('update-wheel-from-feedback', {
      body: {
        baseWheelData,
        feedback
      }
    });

    // Race between the function call and the timeout
    const response = await Promise.race([functionPromise, timeoutPromise]);
    
    if ('error' in response && response.error) {
      console.error('Error calling update wheel function:', response.error);
      throw response.error;
    }
    
    // Type guard to ensure data exists and is properly typed
    if (!('data' in response) || !response.data) {
      console.error('No data returned from update wheel function');
      throw new Error('No data returned from function');
    }
    
    console.log('Updated wheel data:', response.data.updatedWheelData);
    return response.data.updatedWheelData;
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
