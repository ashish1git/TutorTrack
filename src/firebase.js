import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const YOUR_FIREBASE_CONFIG = {
  apiKey: "AIzaSyC14UtaGopZtOtQUQP5iRma9oqGV21wETg",
  authDomain: "tutortrack-b7360.firebaseapp.com",
  projectId: "tutortrack-b7360",
  storageBucket: "tutortrack-b7360.firebasestorage.app",
  messagingSenderId: "379989040306",
  appId: "1:379989040306:web:a8c7f0792ee96ca4d7fdab",
  measurementId: "G-LEP4DH0V0F"
};

const app = initializeApp(YOUR_FIREBASE_CONFIG);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = 'tutor-track-v1';