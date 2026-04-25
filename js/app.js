// App State
let currentUser = null;
let userProgress = null;
let currentTopic = "";
let chatHistory = [];

// DOM Elements
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authError = document.getElementById('auth-error');

const userDisplayName = document.getElementById('user-display-name');
const topicsCompleted = document.getElementById('topics-completed');
const currentLevel = document.getElementById('current-level');

const topicInput = document.getElementById('topic-input');
const startLearningBtn = document.getElementById('start-learning-btn');
const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');

const currentTopicTitle = document.getElementById('current-topic-title');
const sessionLevel = document.getElementById('session-level');
const chatContainer = document.getElementById('chat-container');
const userResponse = document.getElementById('user-response');
const sendMsgBtn = document.getElementById('send-msg-btn');

// Auth Flow
window.listenToAuthStatus(async (user) => {
    if (user) {
        currentUser = user;
        userDisplayName.textContent = user.email.split('@')[0];
        
        // Fetch progress
        userProgress = await window.getUserProgress(user.uid);
        topicsCompleted.textContent = userProgress.topicsCompleted || 0;
        currentLevel.textContent = userProgress.level || "Beginner";
        
        window.showSection('dashboard-section');
    } else {
        currentUser = null;
        userProgress = null;
        window.showSection('auth-section');
    }
});

loginBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        authError.textContent = "Logging in...";
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email || !password) {
            throw new Error("Please enter both email and password.");
        }
        
        // Security Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error("Please enter a valid email format.");
        }

        await window.loginUser(email, password);
    } catch (error) {
        authError.textContent = error.message;
    }
});

signupBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        authError.textContent = "Creating account...";
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            throw new Error("Please enter both email and password.");
        }
        
        // Security Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error("Please enter a valid email format.");
        }
        if (password.length < 8) {
            throw new Error("Password must be at least 8 characters long.");
        }

        await window.registerUser(email, password);
    } catch (error) {
        authError.textContent = error.message;
    }
});

logoutBtn.addEventListener('click', async () => {
    await window.logoutUser();
});

// Learning Flow
startLearningBtn.addEventListener('click', async () => {
    const topic = topicInput.value.trim();
    if (!topic) return;

    currentTopic = topic;
    currentTopicTitle.textContent = topic;
    sessionLevel.textContent = userProgress.level || "Beginner";
    
    // Reset Chat
    chatContainer.innerHTML = '';
    chatHistory = [];
    userResponse.value = '';

    window.showSection('learning-section');

    // Initial greeting from AI
    window.showTypingIndicator('chat-container');
    const response = await window.getGeminiResponse(currentTopic, userProgress.level || "Beginner", null, []);
    window.removeTypingIndicator();
    
    window.appendMessage('chat-container', response, 'bot');
    chatHistory.push({ role: 'bot', text: response });
});

backToDashboardBtn.addEventListener('click', () => {
    window.showSection('dashboard-section');
    // Increment topic if they spent time learning
    if (chatHistory.length > 2 && currentUser) {
        userProgress.topicsCompleted = (userProgress.topicsCompleted || 0) + 1;
        window.saveUserProgress(currentUser.uid, userProgress);
        topicsCompleted.textContent = userProgress.topicsCompleted;
    }
});

// Chat Interaction
const handleSendMessage = async () => {
    const text = userResponse.value.trim();
    if (!text) return;

    // Add user message to UI
    window.appendMessage('chat-container', text, 'user');
    userResponse.value = '';
    
    // Show bot thinking
    window.showTypingIndicator('chat-container');
    
    const response = await window.getGeminiResponse(currentTopic, userProgress.level || "Beginner", text, chatHistory);
    
    window.removeTypingIndicator();
    window.appendMessage('chat-container', response, 'bot');
    
    // Update history
    chatHistory.push({ role: 'user', text });
    chatHistory.push({ role: 'bot', text: response });
};

sendMsgBtn.addEventListener('click', handleSendMessage);
userResponse.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});
