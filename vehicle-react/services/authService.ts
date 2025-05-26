import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    signInWithEmailAndPassword,
    User
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Interface for Google user info
export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Email sign in error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, name?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile in Firestore
    await createUserProfile(userCredential.user.uid, {
      email,
      name: name || '',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
    
    return userCredential.user;
  } catch (error: any) {
    console.error('Email sign up error:', error);
    throw new Error(error.message || 'Failed to create account');
  }
};

// Sign in with Google using Firebase Auth
export const signInWithGoogle = async (idToken: string, accessToken?: string) => {
  try {
    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    const userCredential = await signInWithCredential(auth, credential);
    
    // Check if user profile exists, create if not
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      await createUserProfile(userCredential.user.uid, {
        email: userCredential.user.email || '',
        name: userCredential.user.displayName || '',
        picture: userCredential.user.photoURL || '',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
    } else {
      // Update last login time
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        lastLoginAt: serverTimestamp(),
      }, { merge: true });
    }
    
    return userCredential.user;
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

// Sign in with Google using Firebase Auth (React Native Compatible)
export const signInWithGoogleNative = async () => {
  try {
    // For React Native/Expo, we need to use a different approach
    // This method will be implemented using expo-auth-session in a simpler way
    throw new Error('Google Sign-In for React Native needs expo-auth-session integration. Use email/password for now.');
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

// Create user profile in Firestore
const createUserProfile = async (userId: string, userData: any) => {
  try {
    await setDoc(doc(db, 'users', userId), userData);
  } catch (error: any) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile');
  }
};

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error('Failed to sign out');
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};