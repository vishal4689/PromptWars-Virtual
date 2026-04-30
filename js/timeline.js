/**
 * timeline.js — Static Election Process Timeline Data for CivicVote.
 *
 * This module provides canonical, non-partisan data about the U.S. election lifecycle.
 * Used to inform the AI assistant and populate reference UI components.
 *
 * @module timeline
 */

'use strict';

/**
 * @typedef {Object} TimelineStep
 * @property {string} id - Unique identifier for the step.
 * @property {string} phase - Human-readable name of the election phase.
 * @property {string} timeframe - Typical calendar period for this phase.
 * @property {string} icon - Emoji representing the phase.
 * @property {string} description - Detailed explanation of the process.
 * @property {string[]} actions - Key steps voters should take during this phase.
 */

/**
 * Canonical election timeline steps for U.S. General Elections.
 * @type {TimelineStep[]}
 */
window.ELECTION_TIMELINE = [
    {
        id: 'registration',
        phase: 'Voter Registration & Verification',
        timeframe: 'Year-round; deadlines typically 15–30 days before Election Day',
        icon: '📋',
        description: 'The foundation of the election process. Citizens must establish their eligibility by registering with their state or local election board.',
        actions: [
            'Check registration status at vote.gov',
            'Register online, by mail, or in person',
            'Update address/name if you have moved or changed names',
            'Verify identification requirements for your specific state'
        ]
    },
    {
        id: 'early-voting',
        phase: 'Early In-Person Voting',
        timeframe: '1–45 days before Election Day (varies significantly by state)',
        icon: '🗓️',
        description: 'A process allowing voters to cast their ballots in person before the official Election Day at designated early voting centers.',
        actions: [
            'Locate early voting sites in your county',
            'Check hours of operation (often different from Election Day)',
            'Bring required voter ID as per state law',
            'Understand that early votes are stored securely until counting begins'
        ]
    },
    {
        id: 'mail-voting',
        phase: 'Mail-In & Absentee Balloting',
        timeframe: 'Ballots typically mailed 30–45 days before Election Day',
        icon: '✉️',
        description: 'A method where ballots are sent to voters and returned via mail or secure drop box. Rules for "no-excuse" vs. "excuse-required" vary by state.',
        actions: [
            'Request a mail-in ballot by your state\'s specific deadline',
            'Follow instructions exactly (e.g., use the provided security envelope)',
            'Sign the outside of the return envelope as required',
            'Track your ballot status through your state election portal'
        ]
    },
    {
        id: 'election-day',
        phase: 'General Election Day',
        timeframe: 'The first Tuesday after the first Monday in November',
        icon: '🗳️',
        description: 'The final day for in-person voting. Polls are open for a set window (e.g., 7 AM to 8 PM) for all registered voters.',
        actions: [
            'Confirm your specific polling location at vote.org',
            'Stay in line: If you are in line when polls close, you have the right to vote',
            'Request a provisional ballot if your name is not on the rolls',
            'Know your rights regarding voter assistance or language support'
        ]
    },
    {
        id: 'counting',
        phase: 'Canvassing & Vote Certification',
        timeframe: 'Election Night through several weeks post-election',
        icon: '📊',
        description: 'The legal process of counting every valid ballot (including mail-in, military, and provisional) and certifying the results at local and state levels.',
        actions: [
            'Understand that "unofficial results" on election night are projections',
            'Observe the canvassing process (publicly transparent in most jurisdictions)',
            'Learn about the certification deadlines for your state',
            'Monitor potential audits or recounts if margins are within legal triggers'
        ]
    },
    {
        id: 'swearing-in',
        phase: 'Electoral College & Inauguration',
        timeframe: 'December (Electoral College) and January (Inauguration)',
        icon: '🏛️',
        description: 'The final constitutional steps for Presidential elections, or the swearing-in of state and local officials as per their charters.',
        actions: [
            'Learn how electors are chosen and how they cast their votes',
            'Follow the Congressional certification of electoral votes (Jan 6th)',
            'Inauguration Day marks the official start of the new term',
            'The peaceful transfer of power is the cornerstone of the civic process'
        ]
    }
];

/**
 * Retrieves a specific timeline step by its unique ID.
 * @param {string} id - The ID of the step to retrieve.
 * @returns {TimelineStep|undefined} The matching step or undefined if not found.
 */
window.getTimelineStep = (id) => {
    return window.ELECTION_TIMELINE.find((step) => step.id === id);
};

/**
 * Generates a markdown-formatted summary of the entire election lifecycle.
 * Often used to provide factual context to the AI assistant.
 * @returns {string} Markdown summary of all steps.
 */
window.getTimelineSummary = () => {
    return window.ELECTION_TIMELINE
        .map((step) => `${step.icon} **${step.phase}**: ${step.description}`)
        .join('\n\n');
};
