import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to handle CORS
function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

// Create Supabase client
function createSupabaseClient() {
  const { createClient } = require("https://esm.sh/@supabase/supabase-js@2.39.6");
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

// Function to get wheel categories from database
async function getWheelCategories(supabaseClient: any) {
  const { data: categoryData, error: categoryError } = await supabaseClient
    .from("wheel_categories")
    .select("name");
    
  if (categoryError) {
    throw new Error("Could not retrieve wheel categories: " + categoryError.message);
  }
  
  return categoryData?.map((cat: any) => cat.name) || [];
}

// Get OpenAI API key from secrets
async function getOpenAIKey(supabaseClient: any) {
  const { data: secretData, error: secretError } = await supabaseClient
    .from("secrets")
    .select("value")
    .eq("name", "OPENAI_API_KEY")
    .limit(1)
    .single();
    
  if (secretError || !secretData?.value) {
    throw new Error("Could not retrieve OpenAI API key: " + (secretError?.message || "No data returned"));
  }
  
  return secretData.value;
}

// Get feedback provider username
async function getFeedbackProvider(supabaseClient: any, userId: string) {
  const { data: userData, error: userError } = await supabaseClient
    .from("users")
    .select("username")
    .eq("id", userId)
    .single();
    
  if (userError) {
    console.error("Error getting username:", userError);
  }
  
  return userData ? userData.username : userId;
}

// Update wheel data using OpenAI
async function updateWheelWithOpenAI(apiKey: string, wheelCategories: string[], baseWheelData: any, feedback: any, fromUser: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that analyzes feedback and determines how it should affect a person's Wheel of Life scores.

          The Wheel of Life categories are: ${wheelCategories.join(", ")}.
          
          The current Wheel of Life scores (out of 10) are:
          ${Object.entries(baseWheelData)
            .map(([category, score]) => `${category}: ${score}`)
            .join("\n")}
          
          Based on the feedback text, analyze only the following categories: ${feedback.categories.join(", ")}.
          For each category, determine if the feedback is positive, negative, or neutral, and how much the score should change.
          
          Return your analysis as a JSON object with the updated scores for only the affected categories.
          Scores should be between 1 and 10, and changes should be reasonable (typically ±0.5 to ±2 points).
          Do not include categories that were not mentioned in the feedback.`
        },
        {
          role: "user",
          content: `Feedback from ${fromUser}: "${feedback.text}"`
        }
      ],
      temperature: 0.4,
      max_tokens: 300
    }),
  });
  
  return await response.json();
}

// Process the OpenAI response
function processOpenAIResponse(data: any, wheelCategories: string[], baseWheelData: any) {
  if (data.error) {
    throw new Error(data.error.message || "Error updating wheel data");
  }

  const updatedWheelData = { ...baseWheelData };
  
  try {
    const content = data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const updatedScores = JSON.parse(jsonMatch[0]);
      
      Object.entries(updatedScores).forEach(([category, score]) => {
        if (wheelCategories.includes(category)) {
          updatedWheelData[category] = Math.max(1, Math.min(10, Number(score)));
        }
      });
    }
  } catch (error) {
    console.error("Error parsing updated wheel data:", error);
  }
  
  return updatedWheelData;
}

// Process feedback and update wheel
async function processFeedbackUpdate(
  supabaseClient: any,
  baseWheelData: any,
  feedback: any,
  wheelCategories: string[]
) {
  // If no categories were classified, return the base wheel data unchanged
  if (!feedback.categories || feedback.categories.length === 0) {
    return baseWheelData;
  }

  const apiKey = await getOpenAIKey(supabaseClient);
  const fromUser = await getFeedbackProvider(supabaseClient, feedback.from);
  
  console.log("Calling OpenAI API to update wheel data");
  const openAIData = await updateWheelWithOpenAI(apiKey, wheelCategories, baseWheelData, feedback, fromUser);
  return processOpenAIResponse(openAIData, wheelCategories, baseWheelData);
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
