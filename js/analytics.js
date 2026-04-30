/**
 * analytics.js — Google Analytics 4 (GA4) event tracking module for CivicVote.
 *
 * This module wraps GA4's gtag() calls with semantic, named events that
 * reflect the civic education user journey. All events are non-personally
 * identifiable and comply with privacy best practices.
 *
 * Google Service Used: Google Analytics (GA4) via gtag.js
 */

/**
 * Sends a custom event to Google Analytics 4.
 * Gracefully no-ops if gtag is not loaded (e.g., in test environments).
 *
 * @param {string} eventName - The GA4 event name (snake_case).
 * @param {Object} [params={}] - Additional event parameters.
 */
window.trackEvent = (eventName, params = {}) => {
    if (typeof gtag === 'function') {
        gtag('event', eventName, {
            app_name: 'CivicVote',
            app_version: '1.0.0',
            ...params
        });
    } else {
        // Log to console in development/mock mode
        console.log(`[Analytics Mock] Event: "${eventName}"`, params);
    }
};

// ── Pre-defined civic journey tracking events ─────────────────────────────────

/**
 * Tracks when a user successfully authenticates.
 * @param {string} method - 'login' or 'register'
 */
window.trackAuth = (method) => {
    window.trackEvent('civic_auth', { method });
};

/**
 * Tracks when a user starts a new election topic session.
 * @param {string} topic - The election topic selected.
 * @param {string} level - The user's voter readiness level.
 */
window.trackTopicStart = (topic, level) => {
    window.trackEvent('topic_session_start', { topic, voter_level: level });
};

/**
 * Tracks when a user sends a message in the chat.
 * @param {string} topic - Current topic context.
 */
window.trackMessage = (topic) => {
    window.trackEvent('chat_message_sent', { topic });
};

/**
 * Tracks when a user completes a topic session (navigates back).
 * @param {string} topic - Completed topic.
 * @param {number} messageCount - Number of messages exchanged.
 */
window.trackTopicComplete = (topic, messageCount) => {
    window.trackEvent('topic_session_complete', { topic, message_count: messageCount });
};

/**
 * Tracks when a user uploads an ID document (Firebase Storage integration).
 * @param {string} fileType - The MIME type of the uploaded file.
 */
window.trackDocumentUpload = (fileType) => {
    window.trackEvent('document_upload_attempt', { file_type: fileType });
};

/**
 * Tracks page views when the user navigates between app sections.
 * @param {string} sectionId - The section ID being shown.
 */
window.trackPageView = (sectionId) => {
    const pageMap = {
        'auth-section':      '/login',
        'dashboard-section': '/dashboard',
        'learning-section':  '/learn'
    };
    if (typeof gtag === 'function') {
        gtag('event', 'page_view', {
            page_path: pageMap[sectionId] || `/${sectionId}`,
            page_title: `CivicVote — ${sectionId}`
        });
    } else {
        console.log(`[Analytics Mock] Page View: ${pageMap[sectionId] || sectionId}`);
    }
};
