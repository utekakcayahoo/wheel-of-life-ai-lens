
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

export const getWheelCategories = async (supabaseClient: SupabaseClient): Promise<string[]> => {
  const { data: categoryData, error: categoryError } = await supabaseClient
    .from("wheel_categories")
    .select("name");
    
  if (categoryError) {
    throw new Error("Could not retrieve wheel categories: " + categoryError.message);
  }
  
  return categoryData?.map(cat => cat.name) || [];
};
