import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAHDP3wXuPYisRqIF9iPuwo_I0LNHNsQHs",
  authDomain: "vehicle-b7c9a.firebaseapp.com",
  projectId: "vehicle-b7c9a",
  storageBucket: "vehicle-b7c9a.firebasestorage.app",
  messagingSenderId: "1087198592087",
  appId: "1:1087198592087:web:ebd58b733ad73b91d5b712"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
// Note: For Firebase v11, we'll use getAuth and the persistence warning can be ignored
// as Firebase will automatically use AsyncStorage when available in React Native
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
