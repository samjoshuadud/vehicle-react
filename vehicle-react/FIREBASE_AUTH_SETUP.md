# Firebase Authentication Setup Guide

## 🚨 URGENT: Fix Authorization Errors

You're getting authorization errors because your Firebase project needs proper configuration. Follow these steps:

## 1. Firebase Console Authentication Setup

### Step 1: Enable Authentication
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `vehicle-b7c9a`
3. Click **"Authentication"** in the left sidebar
4. Click **"Get Started"** if not already enabled

### Step 2: Configure Sign-in Methods
1. Go to **Authentication > Sign-in method**
2. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle **"Enable"**
   - Click **"Save"**

3. Enable **Google** (if using Google sign-in):
   - Click on "Google"
   - Toggle **"Enable"**
   - Add your project support email
   - Click **"Save"**

### Step 3: Configure Authorized Domains
1. In **Authentication > Settings > Authorized domains**
2. Make sure these domains are added:
   - `localhost` (for development)
   - `vehicle-b7c9a.firebaseapp.com`
   - Your local IP address if testing on device

## 2. Fix AsyncStorage Persistence Warning

The warning about AsyncStorage can be safely ignored in Firebase v11.8.1. Firebase automatically uses AsyncStorage when available in React Native environments.

However, to ensure AsyncStorage is properly available, make sure you have it installed:

```bash
yarn add @react-native-async-storage/async-storage
```

## 3. Common Authorization Issues & Solutions

### Issue: "auth/configuration-not-found"
**Solution**: Make sure you've enabled Email/Password authentication in Firebase Console

### Issue: "auth/invalid-api-key" 
**Solution**: Double-check your Firebase config values in `config/firebase.ts`

### Issue: "auth/unauthorized-domain"
**Solution**: Add your domain to authorized domains list

### Issue: Google Sign-in fails
**Solution**: 
1. Enable Google auth in Firebase Console
2. Add your app's SHA-1 fingerprint (for Android)
3. Download updated `google-services.json`

## 4. Testing Your Setup

1. Try creating a new account with email/password
2. Check Firebase Console > Authentication > Users to see if user was created
3. Test login with the created account

## 5. Security Rules (Important!)

Go to **Firestore Database > Rules** and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Vehicles belong to authenticated users
    match /vehicles/{vehicleId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Allow authenticated users to create new vehicles
    match /vehicles/{vehicleId} {
      allow create: if request.auth != null;
    }
  }
}
```

## 6. Debug Steps

If you're still getting errors:

1. Check browser console for detailed error messages
2. Verify Firebase project ID matches your config
3. Make sure Authentication is enabled in Firebase Console
4. Try a different email address (some domains might be blocked)
5. Check Network tab in browser for failed API calls

## 🔥 Quick Fix for Current Error

Most likely your issue is that **Email/Password authentication is not enabled** in Firebase Console. Go enable it now!
