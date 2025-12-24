import ReactnativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth, getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseApiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "";

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: "petly-4af67.firebaseapp.com",
  projectId: "petly-4af67",
  storageBucket: "petly-4af67.firebasestorage.app",
  messagingSenderId: "992118540403",
  appId: "1:992118540403:web:d43083d230de59880dc206",
  measurementId: "G-1QMYEDLJQB"
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]!;
}

let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactnativeAsyncStorage)
  });
} catch (error) {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);
export { app as firebaseApp };
