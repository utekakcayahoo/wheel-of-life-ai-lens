import { WheelData } from './types.ts';
import { updateWheelWithOpenAI, processOpenAIResponse } from './openai.ts';
import { getOpenAIKey, getFeedbackProvider } from './supabase.ts';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

export type FeedbackData = {
  text: string;
  from: string;
  categories: string[];
};

export const processFeedbackUpdate = async (
  supabaseClient: SupabaseClient,
  baseWheelData: WheelData,
  feedback: FeedbackData,
  wheelCategories: string[]
): Promise<WheelData> => {
  // If no categories were classified, return the base wheel data unchanged
  if (!feedback.categories || feedback.categories.length === 0) {
    return baseWheelData;
  }

  const apiKey = await getOpenAIKey();
  const fromUser = await getFeedbackProvider(supabaseClient, feedback.from);
  
  console.log("Calling OpenAI API to update wheel data");
  const openAIData = await updateWheelWithOpenAI(apiKey, wheelCategories, baseWheelData, feedback, fromUser);
  return processOpenAIResponse(openAIData, wheelCategories, baseWheelData);
};
