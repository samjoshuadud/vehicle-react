# Firebase Setup Guide for AutoTracker

This guide will help you set up Firebase Authentication and Firestore for your React Native vehicle tracking app.

## Prerequisites

1. Google Account
2. Your React Native app project set up with Expo

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `autotracker-app` (or your preferred name)
4. Choose whether to enable Google Analytics (recommended: Yes)
5. Select or create a Google Analytics account
6. Click "Create project"

## Step 2: Add Web App to Firebase Project

1. In your Firebase project dashboard, click the web icon (`</>`) to add a web app
2. Enter app nickname: `AutoTracker`
3. **Important**: Check "Also set up Firebase Hosting for this app" (optional but recommended)
4. Click "Register app"
5. Copy the Firebase configuration object
6. Replace the placeholder values in `/config/firebase.ts` with your actual config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

## Step 3: Enable Authentication

1. In the Firebase Console, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable the following providers:

### Email/Password Authentication
1. Click on "Email/Password"
2. Enable the first option (Email/Password)
3. Optionally enable "Email link (passwordless sign-in)"
4. Click "Save"

### Google Authentication (Optional but recommended)
1. Click on "Google"
2. Enable Google sign-in
3. Select your project support email
4. Click "Save"

## Step 4: Set up Firestore Database

1. In the Firebase Console, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select a location for your database (choose closest to your users)
5. Click "Done"

### Create Initial Collections

Your database will automatically create collections when you add documents. The app uses these collections:

- `users` - User profiles
- `vehicles` - Vehicle information
- `maintenanceLogs` - Maintenance records
- `fuelLogs` - Fuel purchase records
- `reminders` - Maintenance reminders

## Step 5: Configure Security Rules

1. In Firestore Database, go to the "Rules" tab
2. Replace the default rules with these secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their own vehicles
    match /vehicles/{vehicleId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Users can only access maintenance logs for their vehicles
    match /maintenanceLogs/{logId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Users can only access fuel logs for their vehicles
    match /fuelLogs/{logId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Users can only access their own reminders
    match /reminders/{reminderId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

3. Click "Publish"

## Step 6: Google OAuth Configuration (for Google Sign-In)

### For Expo Development
1. In Firebase Console, go to "Authentication" > "Sign-in method"
2. Click on "Google"
3. Note down the "Web client ID" - you'll need this for your app

### For Production (when you build standalone app)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to "APIs & Services" > "Credentials"
4. Create OAuth 2.0 Client IDs for:
   - Android app (if building for Android)
   - iOS app (if building for iOS)
5. Add these client IDs to your Firebase Google sign-in configuration

## Step 7: Test Your Setup

1. Start your Expo development server:
   ```bash
   npx expo start
   ```

2. Try the following:
   - Create an account with email/password
   - Sign in with existing account
   - The app should navigate to the main tabs after successful authentication

## Step 8: Production Considerations

### Security
- Ensure Firestore security rules are properly configured
- Use environment variables for sensitive configuration
- Enable App Check for additional security

### Performance
- Set up Firestore indexes for common queries
- Monitor usage in Firebase Console
- Set up billing alerts

### Monitoring
- Enable Firebase Analytics
- Set up Crashlytics for error reporting
- Monitor authentication usage

## Troubleshooting

### Common Issues:

1. **"Default app not initialized"**
   - Make sure your Firebase config is properly set in `/config/firebase.ts`

2. **"Permission denied" errors**
   - Check your Firestore security rules
   - Ensure user is authenticated before making database calls

3. **Google Sign-In not working**
   - Verify Google OAuth client IDs are correctly configured
   - Check that Google sign-in is enabled in Firebase Authentication

4. **Network errors**
   - Check your internet connection
   - Verify Firebase project is active and not deleted

### Getting Help

- [Firebase Documentation](https://firebase.google.com/docs)
- [Expo Firebase Guide](https://docs.expo.dev/guides/using-firebase/)
- [React Native Firebase](https://rnfirebase.io/)

## Next Steps

Once Firebase is set up:

1. Test authentication flows thoroughly
2. Add actual vehicle data through the app
3. Set up push notifications for reminders
4. Consider adding offline support with Firebase cache
5. Implement data backup/export features
