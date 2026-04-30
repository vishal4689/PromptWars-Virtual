/**
 * app.js — CivicVote Main Application Controller.
 *
 * This module orchestrates the interaction between the UI, Firebase services,
 * and the Google Gemini AI. It manages the application state, including
 * user authentication and civic progress tracking.
 *
 * @module app
 */

'use strict';

/**
 * @namespace State
 * @description Internal application state tracking.
 */
const State = {
    currentUser: null,
    userProgress: {
        topicsCompleted: 0,
        level: 'Voter',
        history: []
    },
    currentTopic: '',
    chatHistory: [],
    isProcessing: false
};

// ── DOM References ─────────────────────────────────────────────────────────────

const DOM = {
    loginBtn:           document.getElementById('login-btn'),
    signupBtn:          document.getElementById('signup-btn'),
    logoutBtn:          document.getElementById('logout-btn'),
    emailInput:         document.getElementById('email'),
    passwordInput:      document.getElementById('password'),
    authError:          document.getElementById('auth-error'),

    userDisplayName:    document.getElementById('user-display-name'),
    topicsCompleted:    document.getElementById('topics-completed'),
    currentLevelEl:     document.getElementById('current-level'),

    topicInput:         document.getElementById('topic-input'),
    startLearningBtn:   document.getElementById('start-learning-btn'),
    backToDashboardBtn: document.getElementById('back-to-dashboard-btn'),

    currentTopicTitle:  document.getElementById('topic-title'),
    sessionLevelEl:     document.getElementById('session-level'),
    chatContainer:      document.getElementById('chat-container'),
    userResponse:       document.getElementById('user-response'),
    sendMsgBtn:         document.getElementById('send-msg-btn'),

    uploadDocBtn:       document.getElementById('upload-doc-btn'),
    idUpload:           document.getElementById('id-upload'),
    uploadStatus:       document.getElementById('upload-status')
};

// ── Validation Helpers ─────────────────────────────────────────────────────────

/**
 * Validates the format of an email address.
 * @param {string} email - The email string to validate.
 * @returns {boolean} True if valid.
 */
const validateEmailFormat = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validates password strength (minimum 8 characters).
 * @param {string} password - The password string.
 * @returns {boolean} True if meets minimum requirements.
 */
const validatePasswordStrength = (password) => {
    return typeof password === 'string' && password.length >= 8;
};

// ── Authentication Flow ────────────────────────────────────────────────────────

/**
 * Handles authentication state changes from Firebase.
 * Updates the UI and internal state when a user logs in or out.
 *
 * @param {Object|null} user - The Firebase user object.
 */
const handleAuthStateChange = async (user) => {
    try {
        if (user) {
            State.currentUser = user;
            DOM.userDisplayName.textContent = user.email.split('@')[0];

            // Load progress from Firestore (or mock implementation)
            const progress = await window.getUserProgress(user.uid);
            State.userProgress = { ...State.userProgress, ...progress };

            // Update Dashboard stats
            DOM.topicsCompleted.textContent = State.userProgress.topicsCompleted;
            DOM.currentLevelEl.textContent  = State.userProgress.level;

            window.showSection('dashboard-section');
        } else {
            State.currentUser = null;
            window.showSection('auth-section');
        }
    } catch (error) {
        console.error('Auth State Sync Error:', error);
        window.showToast('Error syncing user data.', 'error');
    }
};

window.listenToAuthStatus(handleAuthStateChange);

/**
 * Executes a login attempt.
 */
const onLogin = async () => {
    const email = DOM.emailInput.value.trim();
    const password = DOM.passwordInput.value;

    try {
        if (!email || !password) {
            throw new Error('All fields are required.');
        }
        if (!validateEmailFormat(email)) {
            throw new Error('Please enter a valid email address.');
        }

        DOM.authError.textContent = 'Authenticating...';
        await window.loginUser(email, password);

        if (typeof window.trackAuth === 'function') {
            window.trackAuth('login');
        }
    } catch (error) {
        DOM.authError.textContent = error.message;
    }
};

/**
 * Executes a registration attempt.
 */
const onSignup = async () => {
    const email = DOM.emailInput.value.trim();
    const password = DOM.passwordInput.value;

    try {
        if (!email || !password) {
            throw new Error('All fields are required.');
        }
        if (!validateEmailFormat(email)) {
            throw new Error('Please enter a valid email address.');
        }
        if (!validatePasswordStrength(password)) {
            throw new Error('Password must be at least 8 characters.');
        }

        DOM.authError.textContent = 'Creating account...';
        await window.registerUser(email, password);

        if (typeof window.trackAuth === 'function') {
            window.trackAuth('register');
        }
    } catch (error) {
        DOM.authError.textContent = error.message;
    }
};

DOM.loginBtn?.addEventListener('click', onLogin);
DOM.signupBtn?.addEventListener('click', onSignup);
DOM.logoutBtn?.addEventListener('click', () => window.logoutUser());

// ── Document Verification ──────────────────────────────────────────────────────

/**
 * Handles the voter ID document upload and verification simulation.
 */
const onUploadDocument = async () => {
    const file = DOM.idUpload.files[0];
    if (!file) {
        DOM.uploadStatus.textContent = 'No file selected.';
        return;
    }

    // Client-side security checks
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
        window.showToast('Unsupported file format.', 'error');
        return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
        window.showToast('File size exceeds 5MB limit.', 'error');
        return;
    }

    try {
        DOM.uploadStatus.textContent = 'Uploading to secure storage...';
        DOM.uploadDocBtn.disabled = true;

        if (typeof window.trackDocumentUpload === 'function') {
            window.trackDocumentUpload(file.type);
        }

        await window.uploadUserDocument(State.currentUser.uid, file);

        // Update progress on success
        State.userProgress.level = 'Verified Voter';
        DOM.currentLevelEl.textContent = State.userProgress.level;
        await window.saveUserProgress(State.currentUser.uid, State.userProgress);

        DOM.uploadStatus.textContent = 'Verification complete!';
        window.showToast('Voter profile verified!', 'success');
    } catch (error) {
        DOM.uploadStatus.textContent = 'Upload failed.';
        window.showToast(error.message, 'error');
    } finally {
        DOM.uploadDocBtn.disabled = false;
        DOM.idUpload.value = '';
    }
};

DOM.uploadDocBtn?.addEventListener('click', onUploadDocument);

// ── Learning Session Flow ──────────────────────────────────────────────────────

/**
 * Initiates an AI-driven learning session for the selected topic.
 */
const onStartSession = async () => {
    const topic = DOM.topicInput.value;
    if (!topic || State.isProcessing) {
        return;
    }

    State.currentTopic = topic;
    State.chatHistory = [];
    DOM.chatContainer.innerHTML = '';
    DOM.currentTopicTitle.textContent = topic;
    DOM.sessionLevelEl.textContent = State.userProgress.level;

    window.showSection('learning-section');

    if (typeof window.trackTopicStart === 'function') {
        window.trackTopicStart(topic, State.userProgress.level);
    }

    try {
        State.isProcessing = true;
        window.showTypingIndicator('chat-container');

        const response = await window.getGeminiResponse(
            topic,
            State.userProgress.level,
            null,
            []
        );

        window.removeTypingIndicator();
        window.appendMessage('chat-container', response, 'bot');
        State.chatHistory.push({ role: 'bot', text: response });
    } catch (error) {
        window.removeTypingIndicator();
        window.showToast('Failed to start session.', 'error');
    } finally {
        State.isProcessing = false;
    }
};

/**
 * Processes a user message and fetches an AI response.
 */
const onSendMessage = async () => {
    const text = DOM.userResponse.value.trim();
    if (!text || State.isProcessing) {
        return;
    }

    DOM.userResponse.value = '';
    DOM.sendMsgBtn.disabled = true;
    window.appendMessage('chat-container', text, 'user');

    if (typeof window.trackMessage === 'function') {
        window.trackMessage(State.currentTopic);
    }

    try {
        State.isProcessing = true;
        window.showTypingIndicator('chat-container');

        const response = await window.getGeminiResponse(
            State.currentTopic,
            State.userProgress.level,
            text,
            State.chatHistory
        );

        window.removeTypingIndicator();
        window.appendMessage('chat-container', response, 'bot');

        // Update history for context
        State.chatHistory.push({ role: 'user', text });
        State.chatHistory.push({ role: 'bot', text: response });
    } catch (error) {
        window.removeTypingIndicator();
        window.showToast('Failed to get response.', 'error');
    } finally {
        State.isProcessing = false;
        DOM.sendMsgBtn.disabled = false;
        DOM.userResponse.focus();
    }
};

DOM.startLearningBtn?.addEventListener('click', onStartSession);
DOM.sendMsgBtn?.addEventListener('click', onSendMessage);
DOM.userResponse?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSendMessage();
    }
});

DOM.backToDashboardBtn?.addEventListener('click', async () => {
    // If user engaged significantly, increment progress
    if (State.chatHistory.length >= 3) {
        if (typeof window.trackTopicComplete === 'function') {
            window.trackTopicComplete(State.currentTopic, State.chatHistory.length);
        }

        State.userProgress.topicsCompleted += 1;
        DOM.topicsCompleted.textContent = State.userProgress.topicsCompleted;
        await window.saveUserProgress(State.currentUser.uid, State.userProgress);
        window.showToast('Session progress saved!', 'success');
    }
    window.showSection('dashboard-section');
});
