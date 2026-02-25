import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const BRUTAL_HONESTY_PROMPT = `You are "NGrow", a brutally honest, high-performance life coach for teenagers. 
Do NOT sugarcoat anything. If a user is being lazy, call them out. If their goals are unrealistic, tell them they are setting themselves up for failure. 
Your goal is to build mental toughness and extreme discipline. 
Use direct, sharp, and intense language. 

When guiding users to set goals, ALWAYS follow the SMART framework:
- Specific (What exactly?)
- Measurable (How to track?)
- Achievable (Is it realistic for a human? No "becoming a billionaire in a week" nonsense.)
- Relevant (Why does it matter?)
- Time-bound (When is the deadline?)

Provide actionable steps and suggest a flexible daily schedule.
If they show you an image (like their meal or workout setup), judge it harshly but constructively.`;

export const generateCoachResponse = async (message: string, context: string, useThinking: boolean = false) => {
  try {
    const model = useThinking ? "gemini-3.1-pro-preview" : "gemini-flash-lite-latest";
    const config: any = {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    };

    if (useThinking) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [{ text: `${BRUTAL_HONESTY_PROMPT}\n\nUser Context: ${context}\n\nUser Message: ${message}` }]
          }
        ],
        config
      });
      return response.text;
    } catch (e: any) {
      console.warn("Primary model failed, trying fallback...", e);
      // Fallback if primary model fails
      const fallbackModel = useThinking ? "gemini-3.1-pro-preview" : "gemini-flash-latest";
      const response = await ai.models.generateContent({
        model: fallbackModel,
        contents: [
          {
            role: "user",
            parts: [{ text: `${BRUTAL_HONESTY_PROMPT}\n\nUser Context: ${context}\n\nUser Message: ${message}` }]
          }
        ],
        config
      });
      return response.text;
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    return `The signal is weak, but the grind doesn't stop. Error: ${error instanceof Error ? error.message : "Unknown"}`;
  }
};

export const analyzeImage = async (message: string, base64Image: string, mimeType: string, context: string) => {
  try {
    const config = { temperature: 0.4 };
    const contents = [
      {
        role: "user",
        parts: [
          { text: `${BRUTAL_HONESTY_PROMPT}\n\nUser Context: ${context}\n\nAnalyze this image and respond to: ${message}` },
          {
            inlineData: {
              data: base64Image,
              mimeType
            }
          }
        ]
      }
    ];

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents,
        config
      });
      return response.text;
    } catch (e: any) {
      console.warn("Primary image model failed, trying fallback...", e);
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents,
        config
      });
      return response.text;
    }
  } catch (error) {
    console.error("Gemini Image Error:", error);
    return `I can't see the image. Stop wasting my time and fix the upload. Error: ${error instanceof Error ? error.message : "Unknown"}`;
  }
};
