
import { supabase, isSupabaseConfigured } from '../supabase';
import { WheelData } from '@/types/userTypes';
import { toast } from 'sonner';

// Generate wheel of life analysis based on user data
export const generateWheelAnalysis = async (
  wheelData: WheelData,
  username: string
): Promise<string> => {
  try {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, using fallback analysis');
      throw new Error('Supabase not configured');
    }
    
    console.log('Invoking generate-wheel-analysis function with data:', { 
      wheelDataKeys: Object.keys(wheelData), 
      username 
    });
    
    const { data, error } = await supabase.functions.invoke('generate-wheel-analysis', {
      body: { wheelData, username }
    });
    
    if (error) {
      console.error('Error calling analysis function:', error);
      throw error;
    }
    
    if (!data || !data.analysis) {
      console.error('Invalid response from analysis function:', data);
      throw new Error('Invalid response from analysis function');
    }
    
    console.log('Analysis function responded successfully');
    return data.analysis;
  } catch (error) {
    console.warn('Error calling analysis function via Supabase, using simple fallback:', error);
    // Simple fallback - generate a basic analysis
    toast.warning('Analysis service unavailable. Using simple analysis template.');
    
    // Find highest and lowest categories
    const entries = Object.entries(wheelData);
    const sorted = [...entries].sort((a, b) => Number(b[1]) - Number(a[1]));
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
  const values = Object.values(wheelData).map(val => Number(val));
  const max = Math.max(...values);
  const min = Math.min(...values);
  const difference = max - min;
  
  if (difference <= 2) return "good";
  if (difference <= 4) return "moderate";
  return "significant imbalance in";
}
