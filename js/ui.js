/**
 * ui.js — CivicVote UI utility functions.
 *
 * Handles:
 * - HTML sanitization (XSS prevention)
 * - Markdown parsing for AI responses
 * - Section transitions with Analytics tracking
 * - Chat message rendering
 * - Typing indicator
 * - Toast notification system
 */

/**
 * Escapes HTML special characters to prevent XSS injection.
 * Applied to all user-generated content before rendering.
 * @param {string} str - Raw input string.
 * @returns {string} Sanitized string safe for innerHTML rendering.
 */
window.escapeHTML = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
};

/**
 * Converts a limited subset of Markdown syntax to safe HTML.
 * Input is sanitized first to prevent XSS before markdown tokens are applied.
 * Supports: bold, headers (h1–h3), inline code, bullet/numbered lists, newlines.
 * @param {string} text - Raw markdown text (e.g., from Gemini API).
 * @returns {string} Safe HTML string ready for innerHTML.
 */
window.parseMarkdown = (text) => {
    if (typeof text !== 'string') return '';

    // Step 1: Sanitize all HTML — prevents XSS from AI responses
    let html = window.escapeHTML(text);

    // Step 2: Apply Markdown transformations (order matters)

    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text*
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Headers: ### ## #
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim,  '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim,   '<h1>$1</h1>');

    // Inline code: `code`
    html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-size:0.9em">$1</code>');

    // Numbered lists: "1. item"
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

    // Bullet points: "- item" or "* item"
    html = html.replace(/^[-*] (.*$)/gim, '<li>$1</li>');

    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, ''); // merge adjacent lists

    // Newlines to <br>
    html = html.replace(/\n/g, '<br>');

    return html;
};

/**
 * Transitions the app to a new section with a smooth animation.
 * Integrates with Google Analytics page view tracking.
 * @param {string} sectionId - The ID of the section to show.
 */
window.showSection = (sectionId) => {
    // Track page view via analytics module
    if (typeof window.trackPageView === 'function') {
        window.trackPageView(sectionId);
    }

    document.querySelectorAll('.glass-panel').forEach(panel => {
        panel.classList.remove('active');
        setTimeout(() => {
            if (!panel.classList.contains('active')) {
                panel.classList.add('hidden');
            }
        }, 500);
    });

    const target = document.getElementById(sectionId);
    if (!target) {
        console.warn(`showSection: element "${sectionId}" not found.`);
        return;
    }
    target.classList.remove('hidden');
    setTimeout(() => target.classList.add('active'), 50);
};

/**
 * Appends a chat message bubble to the conversation container.
 * User messages are text-only (safe). Bot messages are parsed from Markdown.
 * @param {string} containerId - The ID of the chat container element.
 * @param {string} text - The message content.
 * @param {'bot'|'user'} role - Who sent the message.
 */
window.appendMessage = (containerId, text, role) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    msgDiv.setAttribute('role', 'article');
    msgDiv.setAttribute('aria-label', role === 'bot' ? 'CivicVote assistant message' : 'Your message');

    if (role === 'bot') {
        // Bot responses come from Gemini — parse markdown safely
        msgDiv.innerHTML = window.parseMarkdown(text);
    } else {
        // User input — textContent only, never innerHTML
        msgDiv.textContent = text;
    }

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
};

/**
 * Shows an animated typing indicator (three bouncing dots) in the chat.
 * @param {string} containerId - The ID of the chat container element.
 */
window.showTypingIndicator = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.setAttribute('aria-label', 'CivicVote is thinking');
    indicator.setAttribute('aria-live', 'polite');
    indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;

    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;
};

/**
 * Removes the typing indicator from the DOM.
 */
window.removeTypingIndicator = () => {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
};

/**
 * Displays a transient toast notification in the bottom-right corner.
 * Auto-dismisses after a configurable duration.
 * @param {string} message - The notification message text.
 * @param {'success'|'error'|'info'} [type='info'] - Visual style variant.
 * @param {number} [duration=3500] - Auto-dismiss delay in milliseconds.
 */
window.showToast = (message, type = 'info', duration = 3500) => {
    // Remove any existing toast
    const existing = document.getElementById('cv-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'cv-toast';
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
};
