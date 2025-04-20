
import { createClient } from "https://esm.sh/@supabase/supabase-js";

export const createSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
};

export const getOpenAIKey = async (supabaseClient: ReturnType<typeof createClient>) => {
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
