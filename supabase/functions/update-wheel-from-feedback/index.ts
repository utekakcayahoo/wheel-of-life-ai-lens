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
    console.log("Starting update-wheel-from-feedback function");
    
    // Get request body
    const { baseWheelData, feedback } = await req.json();
    
    console.log("Request data:", { 
      baseWheelDataCategories: Object.keys(baseWheelData),
      feedbackText: feedback.text,
      feedbackCategories: feedback.categories
    });
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    console.log("Supabase client created, retrieving wheel categories");
    
    // Get wheel categories
    const { data: categoryData, error: categoryError } = await supabaseClient
      .from("wheel_categories")
      .select("name");
      
    if (categoryError) {
      console.error("Error retrieving wheel categories:", categoryError);
      throw new Error("Could not retrieve wheel categories: " + categoryError.message);
    }
    
    console.log("Retrieved wheel categories:", categoryData);
    
    const wheelCategories = categoryData?.map(cat => cat.name) || [];
    
    // If no categories were classified, return the base wheel data unchanged
    if (!feedback.categories || feedback.categories.length === 0) {
      console.log("No categories classified, returning unchanged wheel data");
      return new Response(
        JSON.stringify({
          updatedWheelData: baseWheelData,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    console.log("Getting OpenAI API key");
    
    // Get OpenAI API key from secrets
    const { data: secretData, error: secretError } = await supabaseClient
      .from("secrets")
      .select("value")
      .eq("name", "OPENAI_API_KEY")
      .limit(1)
      .single();
      
    if (secretError || !secretData) {
      console.error("Error retrieving OpenAI API key:", secretError);
      throw new Error("Could not retrieve OpenAI API key: " + (secretError?.message || "No data returned"));
    }
    
    const apiKey = secretData.value;
    if (!apiKey) {
      console.error("OpenAI API key is empty");
      throw new Error("OpenAI API key is empty");
    }
    
    console.log("Getting username of feedback provider");
    
    // Get the username of the person giving feedback
    const { data: userData, error: userError } = await supabaseClient
      .from("users")
      .select("username")
      .eq("id", feedback.from)
      .single();
      
    if (userError) {
      console.error("Error getting username:", userError);
    }
    
    const fromUser = userData ? userData.username : feedback.from;
    
    console.log("Calling OpenAI API to update wheel data");
    
    // Call OpenAI API to update wheel data
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
    
    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI API error:", data.error);
      throw new Error(data.error.message || "Error updating wheel data");
    }
    
    console.log("OpenAI API response received");
    
    let updatedWheelData = { ...baseWheelData };
    
    try {
      // Get the response from OpenAI
      const content = data.choices[0].message.content;
      console.log("OpenAI response content:", content);
      
      // Extract the JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const updatedScores = JSON.parse(jsonMatch[0]);
        console.log("Parsed updated scores:", updatedScores);
        
        // Update only the categories that were mentioned in the feedback
        Object.entries(updatedScores).forEach(([category, score]) => {
          if (wheelCategories.includes(category)) {
            updatedWheelData[category] = Math.max(1, Math.min(10, Number(score)));
          }
        });
      } else {
        console.log("No JSON pattern found in the response");
      }
    } catch (error) {
      console.error("Error parsing updated wheel data:", error);
    }
    
    console.log("Final updated wheel data:", updatedWheelData);
    
    return new Response(
      JSON.stringify({
        updatedWheelData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in update-wheel-from-feedback function:", error);
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
