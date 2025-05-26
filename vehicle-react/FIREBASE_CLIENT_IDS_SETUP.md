# How to Get Firebase Client IDs for Google Sign-In

## Overview
For Google Sign-In to work across all platforms (Web, Android, iOS), you need to configure platform-specific client IDs in your Firebase project.

## Current Issue
```
ERROR Warning: Error: Client Id property `androidClientId` must be defined to use Google auth on this platform.
```

This error occurs because the `expo-auth-session/providers/google` requires an `androidClientId` when running on Android devices.

## Solution Steps

### Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **vehicle-b7c9a**

### Step 2: Get Client IDs from Firebase
1. Click **Project Settings** (gear icon in top left)
2. Scroll down to **"Your apps"** section
3. You should see your app configurations

### Step 3: Find Platform-Specific Client IDs

#### For Web Client ID:
1. Look for **Web app** configuration
2. Copy the **Web client ID** (should be what you already have)

#### For Android Client ID:
1. Look for **Android app** configuration 
2. If you don't see one, you need to **add an Android app**:
   - Click **"Add app"** → **Android**
   - Package name: `com.yourcompany.vehicle` (check your `app.json`)
   - Register the app
3. Copy the **Client ID** from the Android app configuration

#### For iOS Client ID (optional but recommended):
1. Look for **iOS app** configuration
2. If you don't see one, you can add it later
3. Copy the **Client ID** from the iOS app configuration

### Step 4: Alternative Method - Google Cloud Console

If you need to create or find client IDs:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (same project ID as Firebase)
3. Navigate to **APIs & Services** → **Credentials**
4. Look for **OAuth 2.0 Client IDs**:
   - **Web client** - for web/expo applications
   - **Android client** - for Android applications
   - **iOS client** - for iOS applications

## Quick Fix (Temporary)

If you want to test immediately, you can use the same Web Client ID for all platforms:

```tsx
const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: '1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com',
  androidClientId: '1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com', // Same as web for now
  iosClientId: '1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com', // Same as web for now
  scopes: ['profile', 'email'],
});
```

**Note**: This temporary fix should work, but for production apps, it's recommended to have platform-specific client IDs.

## Verify Your Package Name

Check your `app.json` to ensure the package name matches what you configure in Firebase:

```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.vehicle"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.vehicle"
    }
  }
}
```

## Testing

After updating the client IDs:

1. **Clear Expo cache**: `npx expo start --clear`
2. **Test on Android device/emulator**
3. **Test on iOS device/simulator** (if applicable)
4. **Check that Google Sign-In works without the client ID error**

## Expected Behavior

✅ **Success**: Google Sign-In opens, user can authenticate, and returns to your app
❌ **Still getting error**: Check that your client IDs are correct and match your Firebase project

## Next Steps

1. Get the correct client IDs from Firebase Console
2. Update the `login.tsx` file with the real client IDs
3. Test the Google Sign-In flow
4. Ensure authorized domains are configured (as per previous setup guide)

## Common Issues

### "Client ID not found"
- Verify the client ID exists in Firebase/Google Cloud Console
- Check that the package name matches your app configuration

### "OAuth client is invalid"
- Ensure the client ID corresponds to the correct platform
- Verify SHA-1 fingerprints are configured for Android (if using release builds)

### "This app is not authorized"
- Check Firebase authorized domains
- Ensure Google Sign-In is enabled in Firebase Authentication
