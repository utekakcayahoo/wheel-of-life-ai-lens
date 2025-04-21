
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Get OpenAI API key directly from environment variable
export const getOpenAIKey = async () => {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("Could not retrieve OpenAI API key from Supabase Secrets.");
  return apiKey;
};

export const createSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
};

export const getFeedbackProvider = async (supabaseClient: ReturnType<typeof createClient>, userId: string) => {
  const { data: userData, error: userError } = await supabaseClient
    .from("users")
    .select("username")
    .eq("id", userId)
    .single();

  if (userError) {
    console.error("Error getting username:", userError);
  }

  return userData ? userData.username : userId;
};
