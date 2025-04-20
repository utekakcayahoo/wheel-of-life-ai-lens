
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors } from "./utils/cors.ts";
import { createSupabaseClient } from "./utils/supabase.ts";
import { processFeedbackUpdate } from "./utils/feedback.ts";
import { getWheelCategories } from "./utils/wheel.ts";
import type { WheelData } from "./utils/types.ts";

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
    const wheelCategories = await getWheelCategories(supabaseClient);
    console.log("Retrieved wheel categories:", wheelCategories);
    
    const updatedWheelData = await processFeedbackUpdate(
      supabaseClient,
      baseWheelData,
      feedback,
      wheelCategories
    );
    
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
