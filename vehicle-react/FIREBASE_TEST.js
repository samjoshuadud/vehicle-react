// Test Firebase Connection
// Run this in your browser console or create a test component

import { auth } from '@/config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export const testFirebaseAuth = async () => {
  console.log('Testing Firebase Auth...');
  console.log('Auth instance:', auth);
  console.log('Auth app:', auth.app);
  console.log('Auth config:', auth.config);
  
  try {
    // Test creating a user (this will fail if auth is not properly configured)
    const result = await createUserWithEmailAndPassword(auth, 'test@example.com', 'testpassword123');
    console.log('✅ Firebase Auth is working!', result);
  } catch (error) {
    console.error('❌ Firebase Auth error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Common error codes and solutions:
    if (error.code === 'auth/configuration-not-found') {
      console.log('🔧 SOLUTION: Enable Email/Password authentication in Firebase Console');
    } else if (error.code === 'auth/invalid-api-key') {
      console.log('🔧 SOLUTION: Check your Firebase config values');
    } else if (error.code === 'auth/unauthorized-domain') {
      console.log('🔧 SOLUTION: Add your domain to authorized domains in Firebase Console');
    }
  }
};

// Call this function to test
// testFirebaseAuth();
