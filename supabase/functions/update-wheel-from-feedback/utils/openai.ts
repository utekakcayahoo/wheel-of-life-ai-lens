
export const updateWheelWithOpenAI = async (apiKey: string, wheelCategories: string[], baseWheelData: any, feedback: any, fromUser: string) => {
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
};

export const processOpenAIResponse = (data: any, wheelCategories: string[], baseWheelData: any) => {
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
};

