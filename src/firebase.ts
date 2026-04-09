import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAP81Yhr-JP17fLaffVflZWaX0RWpHktLs",
  authDomain: "anonim-data.firebaseapp.com",
  projectId: "anonim-data",
  storageBucket: "anonim-data.firebasestorage.app",
  messagingSenderId: "621562402964",
  appId: "1:621562402964:web:b36b03ece47cdd7a86fc81",
  measurementId: "G-C438Y5Q3RD"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
