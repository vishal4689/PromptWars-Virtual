/**
 * firebase-config.js — Firebase Initialization and Service Wrappers.
 *
 * This module initializes Firebase Auth, Firestore, and Storage.
 * It provides a unified API that falls back to mock implementations
 * if real credentials are not provided, ensuring the app is always testable.
 *
 * Google Services Used: Firebase Auth, Firestore, Storage
 *
 * @module firebase-config
 */

'use strict';

/**
 * @constant {Object} firebaseConfig - Configuration object for Firebase SDK.
 */
const firebaseConfig = {
    apiKey: 'YOUR_FIREBASE_API_KEY',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID'
};

let app, auth, db, storage;
let mockAuthCallback = null;

try {
    // Only initialize if the placeholder has been replaced
    if (firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY') {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        storage = firebase.storage();
    } else {
        console.warn('Firebase is not configured. Initializing in mock mode for development.');
    }
} catch (error) {
    console.error('Firebase Initialization Error:', error);
}

/**
 * Signs in a user with email and password.
 * Falls back to a mock success if Firebase is not configured.
 *
 * @async
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} The Firebase user credential object.
 */
window.loginUser = async (email, password) => {
    if (auth) {
        return await auth.signInWithEmailAndPassword(email, password);
    }
    // Mock successful login
    const user = { email, uid: 'mock-uid-123' };
    if (mockAuthCallback) {
        mockAuthCallback(user);
    }
    return { user };
};

/**
 * Registers a new user with email and password.
 * Falls back to a mock success if Firebase is not configured.
 *
 * @async
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} The Firebase user credential object.
 */
window.registerUser = async (email, password) => {
    if (auth) {
        return await auth.createUserWithEmailAndPassword(email, password);
    }
    // Mock successful registration
    const user = { email, uid: 'mock-uid-123' };
    if (mockAuthCallback) {
        mockAuthCallback(user);
    }
    return { user };
};

/**
 * Signs out the current user.
 *
 * @async
 * @returns {Promise<void>}
 */
window.logoutUser = async () => {
    if (auth) {
        return await auth.signOut();
    }
    if (mockAuthCallback) {
        mockAuthCallback(null);
    }
};

/**
 * Sets up a listener for authentication state changes.
 *
 * @param {Function} callback - Function to call on auth change.
 */
window.listenToAuthStatus = (callback) => {
    if (auth) {
        auth.onAuthStateChanged(callback);
    } else {
        mockAuthCallback = callback;
        // Mock default state: unauthenticated
        setTimeout(() => callback(null), 100);
    }
};

/**
 * Saves or updates user progress in Firestore.
 *
 * @async
 * @param {string} userId - The user's unique ID.
 * @param {Object} data - The progress data object.
 * @returns {Promise<void>}
 */
window.saveUserProgress = async (userId, data) => {
    if (db) {
        await db.collection('users').doc(userId).set(data, { merge: true });
    } else {
        console.log('[Mock DB] Progress saved:', data);
    }
};

/**
 * Retrieves user progress from Firestore.
 *
 * @async
 * @param {string} userId - The user's unique ID.
 * @returns {Promise<Object>} The user's progress data.
 */
window.getUserProgress = async (userId) => {
    if (db) {
        const docSnap = await db.collection('users').doc(userId).get();
        if (docSnap.exists) {
            return docSnap.data();
        }
    }
    // Default mock data
    return { topicsCompleted: 0, level: 'Voter', history: [] };
};

/**
 * Uploads a document to Firebase Storage for voter verification.
 * Falls back to a mock success if storage is not configured.
 *
 * @async
 * @param {string} userId - The user's unique ID.
 * @param {File} file - The file object from an input element.
 * @returns {Promise<string>} The public download URL of the uploaded file.
 */
window.uploadUserDocument = async (userId, file) => {
    if (storage) {
        const storageRef = storage.ref(`verification/${userId}/${file.name}`);
        const snapshot = await storageRef.put(file);
        return await snapshot.ref.getDownloadURL();
    }
    // Mock successful upload with delay
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`[Mock Storage] File uploaded: ${file.name}`);
            resolve(`https://mockstorage.google.com/civicvote/${userId}/${file.name}`);
        }, 1500);
    });
};
