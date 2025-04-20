import { WheelData } from "@/types/userTypes";

// Translate text to English using OpenAI
export const translateToEnglish = async (
  text: string,
  apiKey: string
): Promise<string> => {
  try {
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
            content: "You are a helpful assistant that translates any text to English. Only return the translated text with no additional commentary."
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI API error:", data.error);
      throw new Error(data.error.message || "Error translating text");
    }
    
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
};

// Generate wheel of life analysis based on user data
export const generateWheelAnalysis = async (
  wheelData: WheelData,
  username: string,
  apiKey: string
): Promise<string> => {
  try {
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
    
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
};
