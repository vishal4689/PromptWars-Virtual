/**
 * ui.js — CivicVote UI utility functions.
 *
 * This module provides functions for HTML sanitization, markdown parsing,
 * section navigation, and chat UI management. It emphasizes security and accessibility.
 *
 * @module ui
 */

'use strict';

/**
 * Escapes HTML special characters to prevent XSS injection.
 * Applied to all user-generated content before rendering in the DOM.
 *
 * @param {string} str - Raw input string to be sanitized.
 * @returns {string} Sanitized string safe for innerHTML rendering.
 */
window.escapeHTML = (str) => {
    if (typeof str !== 'string') {
        return '';
    }
    return str.replace(/[&<>'"]/g, (tag) => {
        const chars = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        };
        return chars[tag] || tag;
    });
};

/**
 * Converts a limited subset of Markdown syntax to safe, accessible HTML.
 * The input is sanitized first to prevent XSS before markdown tokens are applied.
 *
 * Supported syntax:
 * - **Bold**
 * - *Italic*
 * - # Header 1, ## Header 2, ### Header 3
 * - Inline `code`
 * - Unordered lists (- or *)
 * - Ordered lists (1., 2.)
 *
 * @param {string} text - Raw markdown text (e.g., from Gemini API).
 * @returns {string} Safe HTML string ready for injection.
 */
window.parseMarkdown = (text) => {
    if (typeof text !== 'string') {
        return '';
    }

    // Step 1: Sanitize all HTML — prevents XSS from AI responses
    let html = window.escapeHTML(text);

    // Step 2: Apply Markdown transformations (order matters)

    // Headers: ### ## #
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text*
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Inline code: `code`
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Ordered lists: "1. item"
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

    // Bullet points: "- item" or "* item"
    html = html.replace(/^[-*] (.*$)/gim, '<li>$1</li>');

    // Wrap consecutive <li> in <ul> (Note: simplistic wrapper, works for flat lists)
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, ''); // Merge adjacent lists

    // Newlines to <br> for better readability in chat bubbles
    html = html.replace(/\n/g, '<br>');

    return html;
};

/**
 * Transitions the application to a new section with a smooth opacity transition.
 * Integrates with the Google Analytics module for page view tracking.
 *
 * @param {string} sectionId - The DOM ID of the section to display.
 */
window.showSection = (sectionId) => {
    try {
        // Track page view via analytics module
        if (typeof window.trackPageView === 'function') {
            window.trackPageView(sectionId);
        }

        const allPanels = document.querySelectorAll('.glass-panel');
        allPanels.forEach((panel) => {
            panel.classList.remove('active');
            // Use timeout to allow CSS transitions to complete before hiding
            setTimeout(() => {
                if (!panel.classList.contains('active')) {
                    panel.classList.add('hidden');
                }
            }, 500);
        });

        const target = document.getElementById(sectionId);
        if (!target) {
            throw new Error(`Section with ID "${sectionId}" not found.`);
        }

        target.classList.remove('hidden');
        // Force reflow for transition
        void target.offsetWidth;
        setTimeout(() => target.classList.add('active'), 50);
    } catch (error) {
        console.error('Navigation Error:', error);
    }
};

/**
 * Appends a chat message bubble to the conversation container.
 * User messages are treated as plain text for security. Bot messages parse markdown.
 *
 * @param {string} containerId - The DOM ID of the chat container.
 * @param {string} text - The message content.
 * @param {'bot'|'user'} role - The sender's role.
 */
window.appendMessage = (containerId, text, role) => {
    const container = document.getElementById(containerId);
    if (!container || !text) {
        return;
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    msgDiv.setAttribute('role', 'article');
    msgDiv.setAttribute('aria-label', role === 'bot' ? 'Assistant message' : 'Your message');

    if (role === 'bot') {
        msgDiv.innerHTML = window.parseMarkdown(text);
    } else {
        msgDiv.textContent = text;
    }

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
};

/**
 * Displays an animated typing indicator in the chat container.
 * Uses ARIA attributes to inform screen readers that the bot is thinking.
 *
 * @param {string} containerId - The DOM ID of the chat container.
 */
window.showTypingIndicator = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    // Prevent duplicate indicators
    if (document.getElementById('typing-indicator')) {
        return;
    }

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.setAttribute('aria-label', 'CivicVote is generating a response');
    indicator.setAttribute('aria-live', 'polite');
    indicator.setAttribute('aria-busy', 'true');
    indicator.innerHTML = `
        <div class="typing-dot" aria-hidden="true"></div>
        <div class="typing-dot" aria-hidden="true"></div>
        <div class="typing-dot" aria-hidden="true"></div>
    `;

    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;
};

/**
 * Removes the typing indicator from the chat container.
 */
window.removeTypingIndicator = () => {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
};

/**
 * Displays a transient toast notification in the UI.
 *
 * @param {string} message - The message to display.
 * @param {'success'|'error'|'info'} [type='info'] - The visual style of the toast.
 * @param {number} [duration=4000] - Time in ms before the toast auto-dismisses.
 */
window.showToast = (message, type = 'info', duration = 4000) => {
    const existing = document.getElementById('cv-toast');
    if (existing) {
        existing.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'cv-toast';
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.textContent = message;

    document.body.appendChild(toast);

    const dismiss = () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    };

    const timer = setTimeout(dismiss, duration);
    toast.onclick = () => {
        clearTimeout(timer);
        dismiss();
    };
};
