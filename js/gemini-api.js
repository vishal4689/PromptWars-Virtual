const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Builds the system prompt for CivicVote — strictly non-partisan,
 * election-process focused, adapting tone to voter level.
 * @param {string} topic - The election topic being discussed.
 * @param {string} level - The user's voter readiness level.
 * @returns {string} System prompt string.
 */
const getSystemPrompt = (topic, level) => `
You are CivicVote, an intelligent, patient, and strictly non-partisan election process education assistant.
The user wants to learn about: "${topic}".
Their current civic readiness level is: "${level}".

Guidelines:
1. Always maintain a neutral, non-partisan tone. Never express opinion on political parties or candidates.
2. Adapt language and complexity to match their level:
   - Voter (Beginner): Use plain language, step-by-step instructions, no legal jargon.
   - Verified Voter (Intermediate): Introduce nuances like state vs. federal rules, deadlines, ID laws.
3. Focus strictly on process: registration, deadlines, how to vote, vote counting, results.
4. Always end with one clear question to confirm understanding or to explore the next step.
5. Format your response using Markdown: bold key terms, use numbered or bulleted lists for steps.
6. If asked about political opinions, redirect: "As a civic guide, I focus only on the process — not political parties or candidates."
`;

/**
 * Sends a prompt to the Google Gemini API and returns the text response.
 * Falls back to a mock response if the API key is not configured.
 * @param {string} topic - The current election topic.
 * @param {string} level - The user's voter readiness level.
 * @param {string|null} userMessage - The user's latest message.
 * @param {Array} chatHistory - Prior conversation turns.
 * @returns {Promise<string>} The assistant's response text.
 */
window.getGeminiResponse = async (topic, level, userMessage, chatHistory = []) => {
    // Track the API call with Google Analytics
    if (typeof window.trackEvent === 'function') {
        window.trackEvent('gemini_api_call', { topic, level });
    }

    if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
        // Graceful mock fallback — still demonstrates the full flow
        return new Promise(resolve => {
            setTimeout(() => {
                const mock = userMessage
                    ? `**[Mock Mode]** You asked: "${userMessage}" about **${topic}**.\n\nIn a real session, I would give you a detailed, non-partisan explanation. For now:\n\n- **Step 1:** Check your state's voter registration deadline.\n- **Step 2:** Locate your polling place at vote.gov.\n- **Step 3:** Bring valid ID on election day.\n\nDo you have a specific question about **${topic}**?`
                    : `**Welcome to CivicVote!** 🗳️\n\nYou've selected **${topic}**. Here's a quick overview:\n\n- This topic covers important steps every voter should know.\n- I'll guide you through the process clearly and without bias.\n\nWhat would you like to know first about **${topic}**?`;
                resolve(mock);
            }, 1200);
        });
    }

    try {
        // Build conversation for Gemini multi-turn format
        const contents = [
            { role: "user",  parts: [{ text: getSystemPrompt(topic, level) }] },
            { role: "model", parts: [{ text: "Understood. I am CivicVote — your non-partisan guide to the election process." }] }
        ];

        chatHistory.forEach(msg => {
            contents.push({
                role: msg.role === 'bot' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            });
        });

        contents.push({
            role: "user",
            parts: [{ text: userMessage || `Please introduce me to the topic: ${topic}` }]
        });

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.3,      // Lower temp = more factual, less creative
                    maxOutputTokens: 900,
                    topP: 0.9
                },
                safetySettings: [
                    { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || "Unknown Gemini API error");
        }

        return data.candidates?.[0]?.content?.parts?.[0]?.text
            ?? "I received an empty response. Please try again.";

    } catch (error) {
        console.error("Gemini API Error:", error);
        // Track error in Google Analytics
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('gemini_api_error', { error: error.message });
        }
        return `I'm having trouble connecting right now. Please check your API key or network connection. _(Error: ${error.message})_`;
    }
};
