const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin"); 

const { GoogleGenerativeAI } = require('@google/generative-ai');

GEMINI_KEY = process.env.VUE_APP_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const MODEL_NAME = "gemini-2.0-flash";

exports.geminiChatbot = onCall(async (request) => {
    const data = request.data;
    const userMessage = data.message;
    const chatHistory = data.history || [];

    if (!userMessage) {
        throw new functions.https.HttpsError('invalid-argument', 'Need a message to send');
    }

    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const chat = model.startChat({
        history: chatHistory,
        systemInstruction: "You are an AI Chatbot that is a job interviewer. You must ask questions to determine whether this is the best candidate",
        });

        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        const text = response.text();

        return { response: text };
    }
    catch{
        console.error("Error calling Gemini API:", error);
        throw new functions.https.HttpsError('internal', 'Failed to get response from AI');
    }
});