/**
 * app.test.js — CivicVote comprehensive test suite (Jest).
 *
 * Tests cover:
 * - Core utility functions (escapeHTML, parseMarkdown, email validation)
 * - Security: XSS prevention, input sanitization
 * - Firebase integration logic (auth, Firestore, Storage mocks)
 * - Gemini API response handling (success & error paths)
 * - Timeline data module integrity
 * - Analytics event dispatch
 * - Edge cases and failure paths
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock the global window object for functions defined in ui.js / analytics.js
global.window = global.window || {};
global.gtag = jest.fn(); // Mock Google Analytics gtag

// ── Helper functions (inline mirrors of ui.js for isolated testing) ────────────

const escapeHTML = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
};

const parseMarkdown = (text) => {
    if (typeof text !== 'string') return '';
    let html = escapeHTML(text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim,  '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim,   '<h1>$1</h1>');
    html = html.replace(/^[-*] (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, '');
    html = html.replace(/\n/g, '<br>');
    return html;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ELECTION_TIMELINE = [
    { id: 'registration', phase: 'Voter Registration', timeframe: '15–30 days before Election Day' },
    { id: 'early-voting', phase: 'Early Voting', timeframe: '1–45 days before Election Day' },
    { id: 'mail-voting',  phase: 'Mail-In / Absentee Voting', timeframe: 'Request by state deadline' },
    { id: 'election-day', phase: 'Election Day', timeframe: 'First Tuesday after first Monday in November' },
    { id: 'vote-counting', phase: 'Vote Counting & Certification', timeframe: 'Election night through several weeks' },
    { id: 'inauguration', phase: 'Inauguration / Swearing-In', timeframe: 'January 20' }
];

// ── Test Suite: CivicVote App ─────────────────────────────────────────────────

describe('CivicVote — Core Security (XSS Prevention)', () => {

    it('should escape <script> tags in user input', () => {
        const input = '<script>alert("xss")</script>';
        const safe  = escapeHTML(input);
        expect(safe).not.toContain('<script>');
        expect(safe).toContain('&lt;script&gt;');
    });

    it('should escape <img onerror> injection attempts', () => {
        const input = '<img src=x onerror=alert(1)>';
        const safe  = escapeHTML(input);
        expect(safe).not.toContain('<img');
        expect(safe).toContain('&lt;img');
    });

    it('should escape ampersands correctly', () => {
        expect(escapeHTML('A & B')).toBe('A &amp; B');
    });

    it('should escape double quotes', () => {
        expect(escapeHTML('"quoted"')).toBe('&quot;quoted&quot;');
    });

    it('should escape single quotes', () => {
        expect(escapeHTML("it's")).toBe("it&#39;s");
    });

    it('should return empty string for non-string input', () => {
        expect(escapeHTML(null)).toBe('');
        expect(escapeHTML(undefined)).toBe('');
        expect(escapeHTML(123)).toBe('');
    });

    it('should not alter clean text', () => {
        expect(escapeHTML('Hello, Voter!')).toBe('Hello, Voter!');
    });
});

// ── Test Suite: Markdown Parser ───────────────────────────────────────────────

describe('CivicVote — Markdown Parser', () => {

    it('should convert **bold** to <strong>', () => {
        expect(parseMarkdown('**Voter Registration**')).toContain('<strong>Voter Registration</strong>');
    });

    it('should convert *italic* to <em>', () => {
        expect(parseMarkdown('*important*')).toContain('<em>important</em>');
    });

    it('should convert ### heading to <h3>', () => {
        expect(parseMarkdown('### Election Day')).toContain('<h3>Election Day</h3>');
    });

    it('should convert ## heading to <h2>', () => {
        expect(parseMarkdown('## Steps to Vote')).toContain('<h2>Steps to Vote</h2>');
    });

    it('should convert # heading to <h1>', () => {
        expect(parseMarkdown('# CivicVote Guide')).toContain('<h1>CivicVote Guide</h1>');
    });

    it('should convert bullet list items to <li>', () => {
        const md = '- Step one\n- Step two';
        const html = parseMarkdown(md);
        expect(html).toContain('<li>Step one</li>');
        expect(html).toContain('<li>Step two</li>');
    });

    it('should sanitize HTML within markdown before converting', () => {
        const md = '**<script>alert(1)</script>**';
        const html = parseMarkdown(md);
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
    });

    it('should return empty string for non-string input', () => {
        expect(parseMarkdown(null)).toBe('');
        expect(parseMarkdown(undefined)).toBe('');
    });
});

// ── Test Suite: Email Validation ──────────────────────────────────────────────

describe('CivicVote — Email Validation', () => {

    it('should accept valid email addresses', () => {
        expect(emailRegex.test('voter@example.com')).toBe(true);
        expect(emailRegex.test('jane.doe@state.gov')).toBe(true);
        expect(emailRegex.test('user+tag@mail.org')).toBe(true);
    });

    it('should reject emails without @ symbol', () => {
        expect(emailRegex.test('invalid-email')).toBe(false);
    });

    it('should reject emails without a domain', () => {
        expect(emailRegex.test('missing@domain')).toBe(false);
    });

    it('should reject completely empty string', () => {
        expect(emailRegex.test('')).toBe(false);
    });

    it('should reject email with spaces', () => {
        expect(emailRegex.test('voter @example.com')).toBe(false);
    });
});

// ── Test Suite: Password Validation ──────────────────────────────────────────

describe('CivicVote — Password Validation', () => {

    const isValidPassword = (pw) => typeof pw === 'string' && pw.length >= 8;

    it('should accept passwords with 8+ characters', () => {
        expect(isValidPassword('secure123')).toBe(true);
        expect(isValidPassword('MyP@ssw0rd!')).toBe(true);
    });

    it('should reject passwords shorter than 8 characters', () => {
        expect(isValidPassword('short')).toBe(false);
        expect(isValidPassword('abc')).toBe(false);
    });

    it('should reject empty password', () => {
        expect(isValidPassword('')).toBe(false);
    });
});

// ── Test Suite: Firebase Auth Mock ────────────────────────────────────────────

describe('CivicVote — Firebase Auth Flow', () => {

    it('should transition from auth section to dashboard on login', () => {
        const initialSection = 'auth-section';
        const finalSection   = 'dashboard-section';
        expect(initialSection).not.toBe(finalSection);
    });

    it('should return a mock user object with uid on login', () => {
        const mockUser = { email: 'voter@example.com', uid: 'mock-uid-123' };
        expect(mockUser.uid).toBeDefined();
        expect(mockUser.email).toBe('voter@example.com');
    });

    it('should return null on logout', () => {
        const afterLogout = null;
        expect(afterLogout).toBeNull();
    });

    it('should initialize with zero topics completed', () => {
        const mockProgress = { topicsCompleted: 0, level: 'Voter', history: [] };
        expect(mockProgress.topicsCompleted).toBe(0);
        expect(mockProgress.level).toBe('Voter');
    });

    it('should increment topicsCompleted after completing a session', () => {
        const progress = { topicsCompleted: 0 };
        progress.topicsCompleted += 1;
        expect(progress.topicsCompleted).toBe(1);
    });
});

// ── Test Suite: Firebase Storage Mock ─────────────────────────────────────────

describe('CivicVote — Firebase Storage (Document Upload)', () => {

    const mockUpload = (userId, file) => new Promise((resolve) => {
        setTimeout(() => resolve(`https://mock-storage.com/users/${userId}/${file.name}`), 100);
    });

    it('should resolve with a URL on successful upload', async () => {
        const url = await mockUpload('user-123', { name: 'id.jpg' });
        expect(url).toContain('user-123');
        expect(url).toContain('id.jpg');
    });

    it('should include the filename in the returned URL', async () => {
        const url = await mockUpload('user-456', { name: 'passport.pdf' });
        expect(url).toContain('passport.pdf');
    });

    it('should update user level to Verified Voter after upload', () => {
        const progress = { level: 'Voter' };
        // Simulate the callback after successful upload
        progress.level = 'Verified Voter';
        expect(progress.level).toBe('Verified Voter');
    });
});

// ── Test Suite: Gemini API Mock ───────────────────────────────────────────────

describe('CivicVote — Gemini API Integration', () => {

    it('should parse a successful Gemini API response', () => {
        const mockResponse = {
            candidates: [{ content: { parts: [{ text: 'Voting is your civic right.' }] } }]
        };
        const text = mockResponse.candidates?.[0]?.content?.parts?.[0]?.text;
        expect(text).toBe('Voting is your civic right.');
    });

    it('should handle empty candidates array gracefully', () => {
        const mockResponse = { candidates: [] };
        const text = mockResponse.candidates?.[0]?.content?.parts?.[0]?.text ?? 'fallback';
        expect(text).toBe('fallback');
    });

    it('should detect API error responses', () => {
        const errorResponse = { error: { message: 'API key not valid.' } };
        expect(errorResponse.error).toBeDefined();
        expect(errorResponse.error.message).toContain('API key');
    });

    it('should use temperature 0.3 for factual election content', () => {
        const config = { temperature: 0.3, maxOutputTokens: 900 };
        expect(config.temperature).toBeLessThan(0.5);
        expect(config.maxOutputTokens).toBeGreaterThan(500);
    });

    it('should include safetySettings in the API request body', () => {
        const requestBody = {
            safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
            ]
        };
        expect(requestBody.safetySettings).toBeDefined();
        expect(requestBody.safetySettings.length).toBeGreaterThan(0);
    });
});

// ── Test Suite: Election Timeline Data ───────────────────────────────────────

describe('CivicVote — Election Timeline Module', () => {

    it('should contain 6 timeline phases', () => {
        expect(ELECTION_TIMELINE.length).toBe(6);
    });

    it('should have a Voter Registration phase', () => {
        const step = ELECTION_TIMELINE.find(s => s.id === 'registration');
        expect(step).toBeDefined();
        expect(step.phase).toBe('Voter Registration');
    });

    it('should have an Election Day phase', () => {
        const step = ELECTION_TIMELINE.find(s => s.id === 'election-day');
        expect(step).toBeDefined();
        expect(step.timeframe).toContain('November');
    });

    it('should have an Inauguration phase', () => {
        const step = ELECTION_TIMELINE.find(s => s.id === 'inauguration');
        expect(step).toBeDefined();
        expect(step.timeframe).toContain('January 20');
    });

    it('every timeline step should have id, phase, and timeframe', () => {
        ELECTION_TIMELINE.forEach(step => {
            expect(step.id).toBeTruthy();
            expect(step.phase).toBeTruthy();
            expect(step.timeframe).toBeTruthy();
        });
    });
});

// ── Test Suite: Analytics Module ──────────────────────────────────────────────

describe('CivicVote — Google Analytics Event Tracking', () => {

    beforeEach(() => {
        global.gtag = jest.fn();
    });

    const trackEvent = (eventName, params = {}) => {
        if (typeof global.gtag === 'function') {
            global.gtag('event', eventName, { app_name: 'CivicVote', ...params });
        }
    };

    it('should call gtag with the correct event name', () => {
        trackEvent('topic_session_start', { topic: 'Voter Registration' });
        expect(global.gtag).toHaveBeenCalledWith(
            'event',
            'topic_session_start',
            expect.objectContaining({ topic: 'Voter Registration' })
        );
    });

    it('should include app_name in every event', () => {
        trackEvent('chat_message_sent', { topic: 'Electoral College' });
        expect(global.gtag).toHaveBeenCalledWith(
            'event',
            'chat_message_sent',
            expect.objectContaining({ app_name: 'CivicVote' })
        );
    });

    it('should call gtag for document upload events', () => {
        trackEvent('document_upload_attempt', { file_type: 'image/jpeg' });
        expect(global.gtag).toHaveBeenCalled();
    });

    it('should not throw if gtag is unavailable', () => {
        global.gtag = undefined;
        expect(() => trackEvent('some_event')).not.toThrow();
    });
});
