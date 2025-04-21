import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { updateWheelWithOpenAI, processOpenAIResponse } from "./utils/openai.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.6";
import { getOpenAIKey, getFeedbackProvider } from "./utils/supabase.ts";
import { getWheelCategories } from "./utils/wheel.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

// Create Supabase client
function createSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

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
    
  } catch (error: any) {
    console.error("Error in update-wheel-from-feedback function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

// Process feedback and update wheel
async function processFeedbackUpdate(
  supabaseClient: ReturnType<typeof createClient>,
  baseWheelData: any,
  feedback: any,
  wheelCategories: string[]
) {
  // If no categories were classified, return the base wheel data unchanged
  if (!feedback.categories || feedback.categories.length === 0) {
    return baseWheelData;
  }

  const apiKey = await getOpenAIKey();
  const fromUser = await getFeedbackProvider(supabaseClient, feedback.from);
  
  console.log("Calling OpenAI API to update wheel data");
  const openAIData = await updateWheelWithOpenAI(apiKey, wheelCategories, baseWheelData, feedback, fromUser);
  return processOpenAIResponse(openAIData, wheelCategories, baseWheelData);
}
