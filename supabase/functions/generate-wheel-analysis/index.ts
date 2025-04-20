
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get request body
    const { wheelData, username } = await req.json();
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Get OpenAI API key from secrets
    const { data: secretData, error: secretError } = await supabaseClient
      .from("secrets")
      .select("value")
      .eq("name", "OPENAI_API_KEY")
      .limit(1)
      .single();
      
    if (secretError || !secretData) {
      throw new Error("Could not retrieve OpenAI API key");
    }
    
    const apiKey = secretData.value;
    
    // Call OpenAI API for analysis
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
            content: `You are a life coach assistant that provides insightful analysis of a user's Wheel of Life.
            You'll be given scores for various life categories, and your task is to:
            1. Identify areas of strength (highest scores)
            2. Identify areas that need improvement (lowest scores)
            3. Provide a brief, encouraging analysis
            4. Suggest one simple action to improve the lowest scoring area
            
            Keep your response concise, positive, and action-oriented. Maximum 4 short paragraphs.`
          },
          {
            role: "user",
            content: `Here is ${username}'s Wheel of Life scores (out of 10):
            ${Object.entries(wheelData)
              .map(([category, score]) => `${category}: ${score}`)
              .join("\n")}`
          }
        ],
        temperature: 0.7,
        max_tokens: 350
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI API error:", data.error);
      throw new Error(data.error.message || "Error generating analysis");
    }
    
    const analysis = data.choices[0].message.content.trim();
    
    return new Response(
      JSON.stringify({
        analysis,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
