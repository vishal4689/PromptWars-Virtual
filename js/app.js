/**
 * app.js — CivicVote main application controller.
 *
 * Orchestrates authentication, document upload, and learning session flows.
 * Integrates with:
 *   - Firebase Auth (login / register / logout)
 *   - Firebase Firestore (user progress persistence)
 *   - Firebase Storage (document upload via firebase-config.js)
 *   - Google Gemini API (AI-driven election guidance)
 *   - Google Analytics (event tracking via analytics.js)
 */

'use strict';

// ── App State ──────────────────────────────────────────────────────────────────
let currentUser    = null;
let userProgress   = null;
let currentTopic   = '';
let chatHistory    = [];

// ── DOM References ─────────────────────────────────────────────────────────────
const loginBtn          = document.getElementById('login-btn');
const signupBtn         = document.getElementById('signup-btn');
const logoutBtn         = document.getElementById('logout-btn');
const emailInput        = document.getElementById('email');
const passwordInput     = document.getElementById('password');
const authError         = document.getElementById('auth-error');

const userDisplayName   = document.getElementById('user-display-name');
const topicsCompleted   = document.getElementById('topics-completed');
const currentLevelEl    = document.getElementById('current-level');

const topicInput        = document.getElementById('topic-input');
const startLearningBtn  = document.getElementById('start-learning-btn');
const backToDashboardBtn= document.getElementById('back-to-dashboard-btn');

const currentTopicTitle = document.getElementById('topic-title');
const sessionLevelEl    = document.getElementById('session-level');
const chatContainer     = document.getElementById('chat-container');
const userResponse      = document.getElementById('user-response');
const sendMsgBtn        = document.getElementById('send-msg-btn');

const uploadDocBtn      = document.getElementById('upload-doc-btn');
const idUpload          = document.getElementById('id-upload');
const uploadStatus      = document.getElementById('upload-status');

// ── Validation Helpers ─────────────────────────────────────────────────────────

/**
 * Validates an email address format.
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Validates a password meets the minimum length requirement.
 * @param {string} password
 * @returns {boolean}
 */
const isValidPassword = (password) => typeof password === 'string' && password.length >= 8;

// ── Auth State Listener ────────────────────────────────────────────────────────

window.listenToAuthStatus(async (user) => {
    if (user) {
        currentUser = user;
        // Display first part of email as name
        userDisplayName.textContent = user.email.split('@')[0];

        // Load progress from Firestore (or mock)
        userProgress = await window.getUserProgress(user.uid);
        topicsCompleted.textContent = userProgress.topicsCompleted || 0;
        currentLevelEl.textContent  = userProgress.level || 'Voter';

        window.showSection('dashboard-section');
    } else {
        currentUser  = null;
        userProgress = null;
        window.showSection('auth-section');
    }
});

// ── Login ──────────────────────────────────────────────────────────────────────

loginBtn.addEventListener('click', async () => {
    authError.textContent = '';
    const email    = emailInput.value.trim();
    const password = passwordInput.value;

    try {
        if (!email || !password) throw new Error('Please enter both email and password.');
        if (!isValidEmail(email))    throw new Error('Please enter a valid email address.');

        authError.textContent = 'Signing in…';
        await window.loginUser(email, password);

        // Track successful login
        if (typeof window.trackAuth === 'function') window.trackAuth('login');

    } catch (error) {
        authError.textContent = error.message;
    }
});

// ── Register ───────────────────────────────────────────────────────────────────

signupBtn.addEventListener('click', async () => {
    authError.textContent = '';
    const email    = emailInput.value.trim();
    const password = passwordInput.value;

    try {
        if (!email || !password) throw new Error('Please enter both email and password.');
        if (!isValidEmail(email))     throw new Error('Please enter a valid email address.');
        if (!isValidPassword(password)) throw new Error('Password must be at least 8 characters long.');

        authError.textContent = 'Creating account…';
        await window.registerUser(email, password);

        // Track successful registration
        if (typeof window.trackAuth === 'function') window.trackAuth('register');

    } catch (error) {
        authError.textContent = error.message;
    }
});

// ── Logout ─────────────────────────────────────────────────────────────────────

logoutBtn.addEventListener('click', async () => {
    await window.logoutUser();
    if (typeof window.showToast === 'function') {
        window.showToast('You have been signed out.', 'info');
    }
});

// ── Document Upload (Firebase Storage) ────────────────────────────────────────

uploadDocBtn.addEventListener('click', async () => {
    const file = idUpload.files[0];

    if (!file) {
        uploadStatus.textContent = 'Please select a file first.';
        uploadStatus.style.color = 'var(--error)';
        return;
    }

    // Security: Validate file type on the client side
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
        uploadStatus.textContent = 'Invalid file type. Please upload an image or PDF.';
        uploadStatus.style.color = 'var(--error)';
        return;
    }

    // Security: Limit file size to 5 MB
    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        uploadStatus.textContent = `File too large. Please upload a file smaller than ${MAX_SIZE_MB} MB.`;
        uploadStatus.style.color = 'var(--error)';
        return;
    }

    uploadStatus.textContent = '⏳ Uploading to secure Firebase Storage…';
    uploadStatus.style.color = 'var(--text-muted)';
    uploadDocBtn.disabled    = true;

    // Track upload attempt with Google Analytics
    if (typeof window.trackDocumentUpload === 'function') {
        window.trackDocumentUpload(file.type);
    }

    try {
        await window.uploadUserDocument(currentUser.uid, file);

        uploadStatus.textContent = '✅ Document verified and stored securely!';
        uploadStatus.style.color = 'var(--success)';

        // Upgrade voter level
        userProgress.level      = 'Verified Voter';
        currentLevelEl.textContent = userProgress.level;
        await window.saveUserProgress(currentUser.uid, userProgress);

        if (typeof window.showToast === 'function') {
            window.showToast('Voter profile verified! 🎉', 'success');
        }

    } catch (error) {
        uploadStatus.textContent = `❌ Upload failed: ${error.message}`;
        uploadStatus.style.color = 'var(--error)';
        if (typeof window.showToast === 'function') {
            window.showToast('Upload failed. Please try again.', 'error');
        }
    } finally {
        uploadDocBtn.disabled = false;
        idUpload.value        = '';
    }
});

// ── Start Learning Session ─────────────────────────────────────────────────────

startLearningBtn.addEventListener('click', async () => {
    const topic = topicInput.value.trim();
    if (!topic) return;

    currentTopic = topic;
    currentTopicTitle.textContent = topic;
    sessionLevelEl.textContent    = userProgress?.level || 'Voter';

    // Reset chat state
    chatContainer.innerHTML = '';
    chatHistory             = [];
    userResponse.value      = '';

    window.showSection('learning-section');

    // Track topic session start with Google Analytics
    if (typeof window.trackTopicStart === 'function') {
        window.trackTopicStart(topic, userProgress?.level || 'Voter');
    }

    // Initial AI greeting
    window.showTypingIndicator('chat-container');
    const response = await window.getGeminiResponse(
        currentTopic, userProgress?.level || 'Voter', null, []
    );
    window.removeTypingIndicator();

    window.appendMessage('chat-container', response, 'bot');
    chatHistory.push({ role: 'bot', text: response });
});

// ── Back to Dashboard ──────────────────────────────────────────────────────────

backToDashboardBtn.addEventListener('click', async () => {
    // Track topic completion if meaningful conversation happened
    if (chatHistory.length > 2 && currentUser) {
        if (typeof window.trackTopicComplete === 'function') {
            window.trackTopicComplete(currentTopic, chatHistory.length);
        }
        userProgress.topicsCompleted = (userProgress.topicsCompleted || 0) + 1;
        topicsCompleted.textContent  = userProgress.topicsCompleted;
        await window.saveUserProgress(currentUser.uid, userProgress);
        if (typeof window.showToast === 'function') {
            window.showToast(`"${currentTopic}" session complete! 🗳️`, 'success');
        }
    }
    window.showSection('dashboard-section');
});

// ── Send Chat Message ──────────────────────────────────────────────────────────

const handleSendMessage = async () => {
    const text = userResponse.value.trim();
    if (!text || sendMsgBtn.disabled) return;

    // Render user message immediately
    window.appendMessage('chat-container', text, 'user');
    userResponse.value    = '';
    sendMsgBtn.disabled   = true;

    // Track message sent
    if (typeof window.trackMessage === 'function') {
        window.trackMessage(currentTopic);
    }

    // Show typing indicator while waiting
    window.showTypingIndicator('chat-container');

    const response = await window.getGeminiResponse(
        currentTopic, userProgress?.level || 'Voter', text, chatHistory
    );

    window.removeTypingIndicator();
    window.appendMessage('chat-container', response, 'bot');

    // Persist conversation turns for multi-turn context
    chatHistory.push({ role: 'user', text });
    chatHistory.push({ role: 'bot',  text: response });

    sendMsgBtn.disabled = false;
    userResponse.focus();
};

// Send on button click
sendMsgBtn.addEventListener('click', handleSendMessage);

// Send on Enter (without Shift for newline)
userResponse.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});
