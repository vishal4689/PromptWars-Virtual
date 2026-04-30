/**
 * gemini-api.js — Google Gemini 2.5 Flash Integration for CivicVote.
 *
 * This module handles communication with the Google Generative AI API.
 * It enforces a non-partisan, educational persona focused on election processes.
 *
 * Google Service Used: Gemini 2.5 Flash API
 *
 * @module gemini
 */

'use strict';

/**
 * @constant {string} GEMINI_API_KEY - API Key for Google Gemini.
 * Note: Should be replaced with a real key for production deployment.
 */
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';

/**
 * @constant {string} API_URL - Endpoint for the Gemini API.
 */
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Generates the system instruction prompt for the AI assistant.
 * Enforces strict non-partisanship and vertical alignment with Election Process Education.
 *
 * @param {string} topic - The current election topic.
 * @param {string} level - The user's civic knowledge level ('Voter' or 'Verified Voter').
 * @returns {string} The formatted system prompt.
 */
const buildSystemPrompt = (topic, level) => {
    return `
You are CivicVote, an expert, patient, and strictly non-partisan Election Process Education assistant.
Your goal is to educate users on the mechanics of voting and democracy for: "${topic}".
User's Civic Readiness Level: "${level}".

CORE DIRECTIVES:
1. STRICT NON-PARTISANSHIP: Never express opinions on political parties, candidates, or ideologies.
2. VERTICAL FOCUS: Strictly discuss election processes (registration, deadlines, logistics, mechanics).
3. PACING: Adapt your complexity.
   - Voter: Use clear, simple language; explain terms like "absentee" or "canvassing".
   - Verified Voter: Provide more detailed information on state vs federal rules or security protocols.
4. STRUCTURE: Use Markdown. Bold key terms. Use lists for steps.
5. ENGAGEMENT: Always end with exactly one question to verify understanding or prompt the next logical step.
6. BOUNDARIES: If asked about political preferences, state: "As a non-partisan civic guide, I focus on how the election process works, not on candidates or parties."

Topic Context: ${topic}.
Current Level: ${level}.
`.trim();
};

/**
 * Communicates with the Google Gemini API to get a structured response.
 * Implements safety settings and handles fallback/error states.
 *
 * @async
 * @function getGeminiResponse
 * @param {string} topic - The current election topic.
 * @param {string} level - User's current civic level.
 * @param {string|null} userMessage - The latest message from the user.
 * @param {Array<{role: string, text: string}>} [history=[]] - Conversation history.
 * @returns {Promise<string>} The assistant's text response.
 */
window.getGeminiResponse = async (topic, level, userMessage, history = []) => {
    // Analytics tracking for API usage
    if (typeof window.trackEvent === 'function') {
        window.trackEvent('gemini_api_call', { topic, level });
    }

    // Mock implementation for demonstration if API key is missing
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockText = userMessage
                    ? `[DEMO MODE] Regarding **${topic}**, you asked: "${userMessage}". In a live session, I would provide a non-partisan explanation based on your ${level} status. Please register at vote.gov by your state's deadline. What else can I help you with?`
                    : `Welcome to **CivicVote**! I am here to guide you through **${topic}**. Where would you like to start?`;
                resolve(mockText);
            }, 1000);
        });
    }

    try {
        const contents = [
            {
                role: 'user',
                parts: [{ text: buildSystemPrompt(topic, level) }]
            },
            {
                role: 'model',
                parts: [{ text: 'Understood. I am your expert guide to the Election Process.' }]
            }
        ];

        // Format history for Gemini API
        history.forEach((msg) => {
            contents.push({
                role: msg.role === 'bot' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            });
        });

        // Add the current prompt
        if (userMessage) {
            contents.push({
                role: 'user',
                parts: [{ text: userMessage }]
            });
        } else {
            contents.push({
                role: 'user',
                parts: [{ text: `Hello, please introduce the topic of ${topic}.` }]
            });
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.25, // Lower temperature for more factual consistency
                    maxOutputTokens: 1024,
                    topP: 0.9
                },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'Gemini API Internal Error');
        }

        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return aiText || 'I am sorry, I could not generate a response. Please try again.';

    } catch (error) {
        console.error('Gemini API Error:', error);
        if (typeof window.trackEvent === 'function') {
            window.trackEvent('gemini_api_error', { error: error.message });
        }
        return `My civic guidance system is temporarily unavailable. Error: ${error.message}`;
    }
};
