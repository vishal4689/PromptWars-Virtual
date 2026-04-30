# CivicVote: Election Process Education

[![Live Demo](https://img.shields.io/badge/Live%20Demo-promptwars--virtual--494911.web.app-blue?style=for-the-badge&logo=firebase)](https://promptwars-virtual-494911.web.app)
[![GitHub](https://img.shields.io/badge/GitHub-PromptWars--Virtual-black?style=for-the-badge&logo=github)](https://github.com/vishal4689/PromptWars-Virtual)

## 🌐 Live Application
**Firebase Hosting:** https://promptwars-virtual-494911.web.app/

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
| **Firebase Hosting** | Production deployment at `promptwars-virtual-494911.web.app` |
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
│   └── app.test.js         # 50+ Jest tests (8 describe blocks)
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
| **Code Quality** | JSDoc on all functions, 'use strict', modular files, ESLint |
| **Security** | XSS prevention, file validation, Gemini safety, strict CSP/HSTS/X-Frame headers |
| **Efficiency** | CDN SDKs, gzip, optimized cache durations (1 year), top-tier performance |
| **Testing** | 50+ Jest tests — security, logic, and service mocks |
| **Accessibility** | ARIA roles, live regions, focus-visible outlines, high contrast |
| **Google Services** | 9 Google services integrated (Gemini, Firebase, Cloud Run, GA4, etc.) |

## Assumptions Made
- **API Keys:** Evaluators must add their own Gemini API Key and Firebase config. Mock mode included for immediate evaluation.
- **Mock Environments:** Full flow works out-of-the-box via mock fallback logic.
- **Non-Partisanship:** Strictly process-focused AI guidance.

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/vishal4689/PromptWars-Virtual.git
   cd PromptWars-Virtual
   ```
2. Open `index.html` in a browser.

## Run Tests
```bash
npm install && npm test
```

## Deploy to Firebase Hosting
```bash
firebase use promptwars-virtual-494911
firebase deploy --only hosting
```

## Deploy to Google Cloud Run
```bash
gcloud builds submit --config cloudbuild.yaml --project=promptwars-virtual-494911
```
