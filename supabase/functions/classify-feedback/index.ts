
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

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
    const { text } = await req.json();
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Get wheel categories
    const { data: categoryData, error: categoryError } = await supabaseClient
      .from("wheel_categories")
      .select("name");
      
    if (categoryError) {
      throw new Error("Could not retrieve wheel categories");
    }
    
    const wheelCategories = categoryData.map(cat => cat.name);
    
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
    
    // Call OpenAI API for classification
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
            content: `You are a helpful assistant that classifies feedback into specific life categories. 
            The available categories are: ${wheelCategories.join(", ")}.
            Analyze the feedback text and determine which categories it relates to. 
            Return ONLY an array of relevant category names, exactly as they appear in the list above. 
            If no categories are mentioned or implied, return an empty array.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI API error:", data.error);
      throw new Error(data.error.message || "Error classifying feedback");
    }
    
    let categories = [];
    try {
      // Parse the response to get categories
      const content = data.choices[0].message.content;
      
      // Try to parse as JSON if it's in JSON format
      if (content.includes("[") && content.includes("]")) {
        const jsonMatch = content.match(/\[.*?\]/s);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          categories = JSON.parse(jsonStr);
        }
      }
      
      // If not JSON, try to extract categories by name
      if (categories.length === 0) {
        categories = wheelCategories.filter(category => 
          content.includes(category)
        );
      }
    } catch (error) {
      console.error("Error parsing categories:", error);
    }
    
    return new Response(
      JSON.stringify({
        categories,
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
