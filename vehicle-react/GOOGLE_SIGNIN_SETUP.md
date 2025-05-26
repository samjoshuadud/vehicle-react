# Google Sign-In Setup Guide for AutoTracker

## Current Status
✅ Google Sign-In has been implemented in the login screen  
✅ Firebase Auth service supports Google authentication  
✅ AuthContext provides googleSignIn method  

## Firebase Console Setup Required

### 1. Enable Google Sign-In Provider
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `vehicle-b7c9a`
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Click **Enable**
6. Set **Project support email** (required)
7. Click **Save**

### 2. Configure OAuth2 Client IDs
The app is currently using this client ID:
```
387159066933-lgts62ehjtejsfjhmp9t1s020tno7tqb.apps.googleusercontent.com
```

**Important**: You need to verify this client ID belongs to your Firebase project.

#### To get the correct client ID:
1. In Firebase Console → **Authentication** → **Sign-in method** → **Google**
2. Look for **Web SDK configuration**
3. Copy the **Web client ID** shown there
4. Update the client ID in `app/login.tsx` if different

### 3. Authorized Domains
Make sure these domains are authorized in Firebase Console:
- `localhost` (for development)
- `192.168.100.200` (your local IP)
- `vehicle-b7c9a.firebaseapp.com` (Firebase hosting domain)

To add authorized domains:
1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Add any missing domains from the list above

### 4. OAuth Consent Screen (Google Cloud Console)
If you get "app not verified" errors:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select the same project (`vehicle-b7c9a`)
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Configure the consent screen:
   - **App name**: AutoTracker
   - **User support email**: Your email
   - **App logo**: Optional
   - **App domain**: `vehicle-b7c9a.firebaseapp.com`
   - **Developer contact**: Your email

### 5. Testing Configuration

To test Google Sign-In:
1. Start the Expo development server: `yarn start`
2. Open the app in Expo Go or simulator
3. Navigate to login screen
4. Tap "Sign In with Google"
5. Complete the OAuth flow

## Troubleshooting Common Issues

### "Authorization Error" or "Invalid Client"
- Verify the client ID in `login.tsx` matches Firebase Console
- Check that OAuth consent screen is configured
- Ensure authorized domains include your testing environment

### "App Not Verified" Warning
- Configure OAuth consent screen in Google Cloud Console
- Add test users if needed during development

### Network/CORS Issues
- Ensure you're testing on authorized domains
- Check Firebase project settings

## Files Modified
- ✅ `app/login.tsx` - Implemented Google Sign-In with expo-auth-session
- ✅ `context/AuthContext.tsx` - Provides googleSignIn method
- ✅ `services/authService.ts` - Handles Firebase Google authentication

## Next Steps
1. Verify Firebase Console Google provider is enabled
2. Confirm client ID matches your project
3. Test Google Sign-In functionality
4. Address any OAuth consent screen requirements

The implementation is now ready - you just need to complete the Firebase Console configuration!
