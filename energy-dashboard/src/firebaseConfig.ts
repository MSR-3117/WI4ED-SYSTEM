import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyANqT-tp7oB0TCgpJKQx58BybqyNxLRhUw",
    authDomain: "wi4ed-9c764.firebaseapp.com",
    projectId: "wi4ed-9c764",
    storageBucket: "wi4ed-9c764.firebasestorage.app",
    messagingSenderId: "326471239039",
    appId: "1:326471239039:web:618caa159f8a88ab93064a",
    measurementId: "G-B80F471GK6",
    // IMPORTANT: This URL is required for Realtime Database.
    // If this doesn't work, check the "Realtime Database" tab in your Firebase Console.
    databaseURL: "https://wi4ed-9c764-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
