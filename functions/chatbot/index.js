const { onCall } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");

const geminiApiKey = defineString("GEMINI_API_KEY");

exports.geminiChatbot = onCall(async (request) => {
  console.log(request.data.message);

  const { generateGeminiResponse } = await import("./gemini.mjs");
  const response = await generateGeminiResponse(
    request.data.message,
    geminiApiKey.value()
  );

  return {
    response: response,
  };
});
