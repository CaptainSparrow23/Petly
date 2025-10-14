// Import the functions you need from the SDKs you need
import ReactnativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBaCaFs8SOWhIvXsRCBrmDAdipOl-Euteg",
  authDomain: "petly-4af67.firebaseapp.com",
  projectId: "petly-4af67",
  storageBucket: "petly-4af67.firebasestorage.app",
  messagingSenderId: "992118540403",
  appId: "1:992118540403:web:d43083d230de59880dc206",
  measurementId: "G-1QMYEDLJQB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactnativeAsyncStorage)
});