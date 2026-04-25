const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const getSystemPrompt = (topic, level) => `
You are LearnNova, an intelligent, patient, and highly effective personalized learning assistant. 
The user wants to learn about: "${topic}". 
Their current understanding level is: "${level}". 

Guidelines:
1. Speak in a friendly, encouraging tone.
2. Adapt your language and complexity to match their level. 
   - Beginner: Use simple analogies, avoid jargon.
   - Intermediate: Introduce technical terms but explain them.
   - Advanced: Dive deep into nuances and complex scenarios.
3. Don't overwhelm the user. Give bite-sized information.
4. Always end your response with a quick question or a small challenge to check their understanding and adjust their pace.
5. Format your response using Markdown (bolding key terms, using bullet points).
`;

window.getGeminiResponse = async (topic, level, userMessage, chatHistory = []) => {
    if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
        // Mock response if API key is not set
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(`**Mock Response:** This is a simulated response because the Gemini API key is not configured. \n\nYou asked: "${userMessage}". \n\nAs a **${level}** learner of **${topic}**, how would you approach this?`);
            }, 1500);
        });
    }

    try {
        const contents = [
            {
                role: "user",
                parts: [{ text: getSystemPrompt(topic, level) }]
            },
            {
                role: "model",
                parts: [{ text: "Understood. I will act as the personalized tutor." }]
            }
        ];

        chatHistory.forEach(msg => {
            contents.push({
                role: msg.role === 'bot' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            });
        });

        if (userMessage) {
            contents.push({
                role: "user",
                parts: [{ text: userMessage }]
            });
        } else {
            contents.push({
                role: "user",
                parts: [{ text: "Let's start the lesson!" }]
            });
        }

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 800,
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "I'm having trouble connecting to my knowledge base right now. Please check your API key or network connection.";
    }
};
