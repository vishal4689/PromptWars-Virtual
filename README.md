# CivicVote: Election Process Education

[![Live Demo](https://img.shields.io/badge/Live%20Demo-civicvote--edu.web.app-blue?style=for-the-badge&logo=firebase)](https://civicvote-edu.web.app)
[![GitHub](https://img.shields.io/badge/GitHub-PromptWars--Virtual-black?style=for-the-badge&logo=github)](https://github.com/vishal4689/PromptWars-Virtual)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Cloud%20Run-orange?style=for-the-badge&logo=googlecloud)](https://civicvote-rvlga6ntea-uc.a.run.app/)

## 🌐 Live Application
**Firebase Hosting:** https://civicvote-edu.web.app
**Cloud Run:** https://civicvote-rvlga6ntea-uc.a.run.app/

---

## Overview
CivicVote is an intelligent, non-partisan assistant designed to help users understand the election process, timelines, and steps in an interactive and easy-to-follow way. It provides personalized civic guidance on voter registration, polling locations, mail-in voting, the Electoral College, and more.

## Chosen Vertical
**Election Process Education**
This project focuses on the Election Process Education vertical. It aims to demystify complex voting procedures and encourage civic engagement by providing clear, accessible, and completely non-partisan information tailored to each user's understanding level.

## Approach and Logic
Built with a modern, lightweight vanilla tech stack (HTML, CSS, JavaScript) for maximum compatibility and performance — no build step required.

### Google Services Integrated
| Service | Usage |
|---|---|
| **Google Gemini API** (gemini-2.5-flash) | AI-powered non-partisan election guidance with safety filters |
| **Firebase Authentication** | Secure user login and registration |
| **Firebase Firestore** | Persistent user progress and civic level tracking |
| **Firebase Storage** | Secure ID document upload for voter verification |
| **Firebase Hosting** | Production deployment at `civicvote-edu.web.app` |
| **Google Cloud Run** | Containerized Docker deployment on Google Cloud |
| **Google Cloud Build** | CI/CD pipeline via `cloudbuild.yaml` |
| **Google Analytics (GA4)** | Named civic journey event tracking (6 event types) |
| **Google Fonts** | Inter + Outfit typefaces via fonts.googleapis.com |

## How the Solution Works
1. **Login/Signup:** Users authenticate via Firebase Auth. Mock fallback provided if keys are not set.
2. **Dashboard:** Users select from 7 election topics (Voter Registration, Electoral College, Mail-In Voting, etc.)
3. **Document Upload:** Users upload a sample ID via Firebase Storage — simulates voter profile verification, upgrades to "Verified Voter" level.
4. **Learning Session:**
   - A chat interface opens tailored to the selected topic.
   - Google Gemini AI provides structured, step-by-step non-partisan guidance.
   - Conversation history maintained for multi-turn context.
   - AI ends each response with a comprehension check question.
5. **Analytics:** Every user action (topic start, message sent, upload, topic completion) tracked as a named GA4 event.

## Project Structure
```
PromptWars-Virtual/
├── index.html              # Main app entry point (fully accessible, ARIA)
├── css/
│   └── style.css           # Civic blue/green glassmorphism theme
├── js/
│   ├── analytics.js        # Google Analytics GA4 event tracking module
│   ├── timeline.js         # 6-phase U.S. election timeline data
│   ├── firebase-config.js  # Firebase init + Auth/Firestore/Storage wrappers
│   ├── gemini-api.js       # Gemini 2.5 Flash API with election system prompt
│   ├── ui.js               # UI utilities: markdown parser, toast, XSS sanitizer
│   └── app.js              # Main app controller
├── tests/
│   └── app.test.js         # 40+ Jest tests (8 describe blocks)
├── Dockerfile              # nginx:alpine, port 8080 for Cloud Run
├── nginx.conf              # Security headers, gzip, SPA fallback
├── cloudbuild.yaml         # Google Cloud Build CI/CD pipeline
├── firebase.json           # Firebase Hosting config + security headers
├── .firebaserc             # Firebase project binding
└── .eslintrc.json          # ESLint code quality rules
```

## Evaluation Areas

| Area | Implementation |
|---|---|
| **Code Quality** | JSDoc on all functions, `'use strict'`, modular files, ESLint |
| **Security** | XSS prevention (`escapeHTML`), file type/size validation, Gemini safety settings, nginx security headers (HSTS, X-Frame-Options, CSP) |
| **Efficiency** | CDN-based Firebase SDKs, gzip, asset caching headers, `temperature: 0.3` for focused responses |
| **Testing** | 40+ Jest tests — XSS, markdown, auth, storage, Gemini, timeline integrity, GA4 analytics |
| **Accessibility** | ARIA labels, `role="log/alert/form"`, `aria-live`, keyboard navigation, semantic HTML5 |
| **Google Services** | 9 Google services integrated (Gemini, Firebase Auth/Firestore/Storage/Hosting, Cloud Run, Cloud Build, GA4, Google Fonts) |

## Assumptions Made
- **API Keys:** Evaluators must add their own Gemini API Key (`js/gemini-api.js`) and Firebase config (`js/firebase-config.js`). A mock mode runs automatically if keys are not set — the full UI and flow still work.
- **Mock Environments:** Firebase Storage upload is mocked when Firebase credentials are absent — simulates the upload delay and upgrades the voter level.
- **Non-Partisanship:** All AI responses are constrained to process information only — no political opinions, candidates, or parties discussed.
- **U.S. Focus:** Election timelines and processes are based on standard U.S. federal/state election procedures.

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/vishal4689/PromptWars-Virtual.git
   cd PromptWars-Virtual
   ```
2. Open `index.html` in a modern browser (or use Live Server).
3. **Optional:** Add your Gemini API key in `js/gemini-api.js` (`GEMINI_API_KEY`).
4. **Optional:** Add your Firebase config in `js/firebase-config.js` to enable Auth, Firestore, and Storage.

## Run Tests
```bash
npm install
npm test
```

## Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase use promptwars-virtual-494911
firebase deploy --only hosting
```

## Deploy to Google Cloud Run
```bash
gcloud builds submit --config cloudbuild.yaml --project=promptwars-virtual-494911
```
