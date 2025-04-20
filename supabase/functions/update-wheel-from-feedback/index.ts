import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "./utils/cors.ts";
import { createSupabaseClient, getOpenAIKey, getFeedbackProvider } from "./utils/supabase.ts";
import { updateWheelWithOpenAI, processOpenAIResponse } from "./utils/openai.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    console.log("Starting update-wheel-from-feedback function");
    
    const { baseWheelData, feedback } = await req.json();
    
    console.log("Request data:", { 
      baseWheelDataCategories: Object.keys(baseWheelData),
      feedbackText: feedback.text,
      feedbackCategories: feedback.categories
    });
    
    const supabaseClient = createSupabaseClient();
    
    // Get wheel categories
    const { data: categoryData, error: categoryError } = await supabaseClient
      .from("wheel_categories")
      .select("name");
      
    if (categoryError) {
      throw new Error("Could not retrieve wheel categories: " + categoryError.message);
    }
    
    const wheelCategories = categoryData?.map(cat => cat.name) || [];
    console.log("Retrieved wheel categories:", categoryData);
    
    // If no categories were classified, return the base wheel data unchanged
    if (!feedback.categories || feedback.categories.length === 0) {
      return new Response(
        JSON.stringify({ updatedWheelData: baseWheelData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    const apiKey = await getOpenAIKey(supabaseClient);
    const fromUser = await getFeedbackProvider(supabaseClient, feedback.from);
    
    console.log("Calling OpenAI API to update wheel data");
    const openAIData = await updateWheelWithOpenAI(apiKey, wheelCategories, baseWheelData, feedback, fromUser);
    const updatedWheelData = processOpenAIResponse(openAIData, wheelCategories, baseWheelData);
    
    return new Response(
      JSON.stringify({ updatedWheelData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error("Error in update-wheel-from-feedback function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
