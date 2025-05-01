/**
 * Firebase Configuration
 *
 * This file initializes and configures Firebase services:
 * - Authentication
 * - Firestore Database
 * - Cloud Functions
 *
 * All configuration values are loaded from environment variables
 * for security purposes.
 */

// jobchat-app/src/firebase.config.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Firebase configuration object
// All values are loaded from environment variables
const firebaseConfig = {
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_FIREBASE_APP_ID,
  measurementId: process.env.VUE_APP_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
// Set authentication persistence to LOCAL for better user experience
setPersistence(auth, browserLocalPersistence);
export const db = getFirestore(app);
export const functions = getFunctions(app);
