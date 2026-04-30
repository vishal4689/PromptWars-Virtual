/**
 * timeline.js — Static election process timeline data for CivicVote.
 *
 * Provides structured, factual data about key election milestones used to
 * enrich the Gemini AI prompts and render an informational reference timeline.
 * This module has zero external dependencies.
 */

/**
 * Canonical election timeline steps for U.S. general elections.
 * Each step includes a typical time reference and key actions.
 * @type {Array<{id: string, phase: string, timeframe: string, description: string, actions: string[]}>}
 */
window.ELECTION_TIMELINE = [
    {
        id: 'registration',
        phase: 'Voter Registration',
        timeframe: '15–30 days before Election Day',
        icon: '📋',
        description: 'Citizens must register to vote. Deadlines vary by state — some allow same-day registration.',
        actions: [
            'Check your state\'s registration deadline at vote.gov',
            'Register online, by mail, or in person',
            'Verify your registration status before the deadline',
            'Update your address if you have moved'
        ]
    },
    {
        id: 'early-voting',
        phase: 'Early Voting',
        timeframe: '1–45 days before Election Day (varies by state)',
        icon: '🗓️',
        description: 'Many states allow voters to cast ballots before Election Day at designated polling locations.',
        actions: [
            'Check if your state offers early voting',
            'Find early voting locations and hours at usa.gov',
            'Bring required ID documents',
            'Votes are secured and counted on or after Election Day'
        ]
    },
    {
        id: 'mail-voting',
        phase: 'Mail-In / Absentee Voting',
        timeframe: 'Request by state deadline; return by Election Day',
        icon: '✉️',
        description: 'Eligible voters can request a mail-in ballot. Rules for who qualifies vary by state.',
        actions: [
            'Request your absentee ballot by your state\'s deadline',
            'Follow all instructions — sign the envelope if required',
            'Track your ballot status online in most states',
            'Return by mail or drop box before the deadline'
        ]
    },
    {
        id: 'election-day',
        phase: 'Election Day',
        timeframe: 'First Tuesday after the first Monday in November',
        icon: '🗳️',
        description: 'Official Election Day. In-person polling places are open for all registered voters.',
        actions: [
            'Find your polling place at vote.gov',
            'Bring required ID (varies by state)',
            'Polls are typically open 7 AM – 8 PM (check your state)',
            'You have the right to a provisional ballot if your eligibility is questioned'
        ]
    },
    {
        id: 'vote-counting',
        phase: 'Vote Counting & Certification',
        timeframe: 'Election night through several weeks after',
        icon: '📊',
        description: 'Votes are counted by local election officials and results are certified by the state.',
        actions: [
            'Preliminary results reported on election night',
            'Mail-in and provisional ballots counted in the days following',
            'State canvassing boards certify results (typically 2–4 weeks later)',
            'Results are publicly auditable'
        ]
    },
    {
        id: 'inauguration',
        phase: 'Inauguration / Swearing-In',
        timeframe: 'January 20 (Presidential), varies for other offices',
        icon: '🏛️',
        description: 'Elected officials are sworn into office and begin their terms.',
        actions: [
            'Presidential inauguration is January 20th following the election',
            'State and local officials follow their own swearing-in schedules',
            'The peaceful transfer of power is a cornerstone of democracy'
        ]
    }
];

/**
 * Returns the timeline step object for a given phase ID.
 * @param {string} id - The step ID (e.g., 'registration').
 * @returns {Object|undefined} The matching timeline step, or undefined.
 */
window.getTimelineStep = (id) => {
    return window.ELECTION_TIMELINE.find(step => step.id === id);
};

/**
 * Returns a formatted summary of all timeline steps for injection into
 * the Gemini system prompt as additional context.
 * @returns {string} A markdown-formatted timeline summary.
 */
window.getTimelineSummary = () => {
    return window.ELECTION_TIMELINE
        .map(step => `${step.icon} **${step.phase}** (${step.timeframe}): ${step.description}`)
        .join('\n');
};
