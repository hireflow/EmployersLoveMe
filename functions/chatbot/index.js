const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin"); 
const functions = require("firebase-functions"); // Add this import


let GoogleGenAI; // Declare it outside the try/catch
async function initializeGenAI() {
    if (!GoogleGenAI) {
        GoogleGenAI = (await import('@google/genai')).GoogleGenAI;
    }
}


exports.geminiChatbot = onCall(async (request) => {
    await initializeGenAI(); // Ensure GoogleGenAI is imported

    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    const genAI = new GoogleGenAI({ apiKey: GEMINI_KEY });


    const data = request.data;
    const userMessage = data.message;
    const chatHistory = data.history || [];

    if (!userMessage) {
        throw new HttpsError('invalid-argument', 'Need a message to send');
    }

    try {

        const chat = genAI.chats.create({
            model: 'gemini-1.5-flash',
            history: chatHistory,
            config: {
                temperature: 0.5,
                systemInstruction: "You are a conversational AI that conducts job interviews. Please ask job related questions to determine whether the candidate is a good fit for Google as a Software Engineer",
                maxOutputTokens: 1024,
            }
        });

        const result = await chat.sendMessage(userMessage);
        const text = result.candidates[0].content.parts[0].text;

        return { response: text };
    }
    catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new HttpsError('internal', 'Failed to get response from AI');
    }
});