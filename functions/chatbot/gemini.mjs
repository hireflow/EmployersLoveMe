// Attempt to import HarmCategory and HarmBlockThreshold
// If these are not exported directly from "@google/genai",
// the API might accept string literals for category and threshold.
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";


//https://ai.google.dev/gemini-api/docs/structured-output  <-- read for output
//https://ai.google.dev/gemini-api/docs/document-processing?lang=python  <--- for pdf input (resumes)
//https://ai.google.dev/gemini-api/docs/prompting-strategies  <--- for prompting strategies
//https://ai.google.dev/gemini-api/docs/model-tuning  <--- for model tuning


export async function generateGeminiResponse(message, apiKey) {
  const ai = new GoogleGenAI({ apiKey }); // Your existing line

  const response = await ai.models.generateContentStream({
    // Your existing call
    model: "gemini-2.0-flash", // Your existing line
    contents: message, // Your existing line
    config: {
      // Your existing config object
      systemInstruction:
        "You are a helpful assistant that can answer questions and help with tasks.", // Your existing line
      temperature: 0.5, // Your existing line
      // --- ADD SAFETY SETTINGS START ---
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE, // Strictest for hate speech (racism, etc.)
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, // Adjust as needed
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, // Adjust as needed
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, // Adjust as needed
        },
      ],
      // --- ADD SAFETY SETTINGS END ---
    },
  });

  let fullResponse = ""; // Your existing line
  for await (const chunk of response) {
    // Your existing line
    fullResponse += chunk.text; // Your existing line (assuming .text is correct for your SDK version)
  }

  return fullResponse; // Your existing line
}
