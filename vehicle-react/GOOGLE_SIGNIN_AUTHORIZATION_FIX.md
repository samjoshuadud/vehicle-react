# Google Sign-In Authorization Error Troubleshooting

## Current Error: "Access Blocked" / "Authorization Error"

This error typically occurs due to:
1. **Missing Authorized Domains** in Firebase Console
2. **Incorrect Client IDs** 
3. **Google Sign-In Provider not properly configured**
4. **OAuth consent screen issues**

## Step-by-Step Fix

### Step 1: Configure Firebase Console - Authorized Domains

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select Project**: `vehicle-b7c9a`
3. **Authentication** → **Sign-in method**
4. **Click Google provider** (pencil icon to edit)
5. **Add these Authorized Domains**:
   ```
   vehicle-b7c9a.firebaseapp.com
   localhost
   127.0.0.1
   auth.expo.io
   ```
6. **Click Save**

### Step 2: Verify Google Cloud Console OAuth Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select the same project** (vehicle-b7c9a or project ID: 1087198592087)
3. **APIs & Services** → **Credentials**
4. **Find your OAuth 2.0 Client IDs**:
   - Web client: `1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com`
   - Android client: `1087198592087-tq4durvv65g0alvh7ukn5o5ijf89qmqj.apps.googleusercontent.com`

### Step 3: Configure OAuth Consent Screen

1. **In Google Cloud Console** → **APIs & Services** → **OAuth consent screen**
2. **Ensure it's configured**:
   - App name: AutoTracker (or your app name)
   - User support email: Your email
   - Authorized domains: `vehicle-b7c9a.firebaseapp.com`
3. **Add test users** if in testing mode
4. **Save and Continue**

### Step 4: Verify Client ID Configuration

Your current configuration:
```tsx
const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: '1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com',
  androidClientId: '1087198592087-tq4durvv65g0alvh7ukn5o5ijf89qmqj.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
});
```

### Step 5: Add iOS Client ID (Recommended)

Update your login.tsx to include iOS client ID:

```tsx
const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: '1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com',
  androidClientId: '1087198592087-tq4durvv65g0alvh7ukn5o5ijf89qmqj.apps.googleusercontent.com',
  iosClientId: '1087198592087-[IOS_CLIENT_ID].apps.googleusercontent.com', // Get from Firebase
  scopes: ['profile', 'email'],
});
```

## Quick Diagnostic Tests

### Test 1: Check Firebase Auth Status
```bash
# Run this in your project
npx expo start --clear
```

### Test 2: Verify Domain Authorization
Open browser and check:
- `http://localhost:8082` (your Expo dev server)
- Should show in Firebase authorized domains

### Test 3: Check Error Details
Enable more detailed logging in your app:

```tsx
useEffect(() => {
  if (response?.type === 'success') {
    console.log('Google Auth Success:', response);
    const { authentication } = response;
    handleGoogleAuth(authentication);
  } else if (response?.type === 'error') {
    console.error('Google Auth Error Details:', {
      error: response.error,
      errorCode: response.error?.code,
      errorMessage: response.error?.message,
      params: response.params
    });
    Alert.alert('Authentication Error', `Error: ${response.error?.message || 'Unknown error'}`);
    setGoogleLoading(false);
  }
}, [response]);
```

## Common Fixes

### Fix 1: Missing Authorized Domains
**Error**: "Origin not authorized" / "Access blocked"
**Solution**: Add all required domains to Firebase Console

### Fix 2: Wrong Client ID
**Error**: "Invalid client ID"
**Solution**: Verify client IDs match exactly between Firebase and Google Cloud Console

### Fix 3: OAuth Consent Screen Issues
**Error**: "This app isn't verified"
**Solution**: 
- Add yourself as test user in Google Cloud Console
- Or publish the OAuth consent screen

### Fix 4: Package Name Mismatch
**Error**: "Package name doesn't match"
**Solution**: Ensure package name in `app.json` matches Firebase Android app:
- Current: `com.samjoshuadud.vehicle`
- Should match Firebase Android app configuration

## Expected Working Flow

1. **User clicks "Sign In with Google"**
2. **Expo opens Google OAuth in browser/webview**
3. **User signs in and grants permissions**
4. **Google redirects back with authorization code**
5. **Expo exchanges code for tokens (idToken, accessToken)**
6. **Firebase creates/signs in user with credentials**
7. **User is redirected to main app**

## Debugging Commands

```bash
# Clear all caches
npx expo start --clear --reset-cache

# Check if Google services are properly configured
npx expo install expo-auth-session expo-web-browser

# Verify app.json configuration
cat app.json | grep -A 10 "android\|ios"
```

## Final Checklist

- [ ] Firebase Console: Authorized domains added
- [ ] Firebase Console: Google provider enabled
- [ ] Google Cloud Console: OAuth consent screen configured
- [ ] Client IDs match between Firebase and Google Cloud
- [ ] Package names match between app.json and Firebase
- [ ] Test users added (if OAuth app is in testing mode)
- [ ] All required domains authorized:
  - `vehicle-b7c9a.firebaseapp.com`
  - `localhost`
  - `127.0.0.1` 
  - `auth.expo.io`

## Next Steps

1. **Configure all items in checklist above**
2. **Wait 5-10 minutes** for changes to propagate
3. **Clear Expo cache**: `npx expo start --clear`
4. **Test Google Sign-In** on device/emulator
5. **Check console logs** for detailed error messages

If issues persist after following this guide, the problem is likely in the OAuth consent screen configuration or client ID mismatch.
