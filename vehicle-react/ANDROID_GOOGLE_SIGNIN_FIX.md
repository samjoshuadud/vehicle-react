# Android Google Sign-In Authorization Fix

## Issue: "Access blocked authorization error" on Android only

Your SHA-1 fingerprint: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

## Root Cause
Android OAuth requires SHA-1 fingerprint configuration in Firebase, while web doesn't. This is why it works on web but fails on Android.

## Quick Fix Applied ✅
Temporarily using the web client ID for Android to bypass the issue:
```tsx
androidClientId: '1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com'
```

## Proper Solution: Configure SHA-1 in Firebase

### Step 1: Add SHA-1 Fingerprint to Firebase

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `vehicle-b7c9a`
3. **Project Settings** (gear icon) → **General** tab
4. **Scroll down to "Your apps"** section
5. **Find your Android app** (`com.samjoshuadud.vehicle`)
6. **Click "Add fingerprint"**
7. **Add this SHA-1 fingerprint**:
   ```
   5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
   ```
8. **Click "Save"**

### Step 2: Download Updated google-services.json (if needed)

1. **In Firebase Console** → **Project Settings** → **General**
2. **Scroll to Android app**
3. **Click "google-services.json"** to download
4. **Replace** the existing file in `android/app/google-services.json` (if you have one)

### Step 3: Verify Android Configuration

Ensure your Android app configuration matches:
- **Package name**: `com.samjoshuadud.vehicle` ✅
- **SHA-1 fingerprint**: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` ✅

### Step 4: Update Client IDs (After Firebase Configuration)

Once SHA-1 is configured, you can revert to using the proper Android client ID:

```tsx
const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: '1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com',
  androidClientId: '1087198592087-tq4durvv65g0alvh7ukn5o5ijf89qmqj.apps.googleusercontent.com', // Revert to original
  iosClientId: '1087198592087-ua3m0asu1vf3ffkbsaeoemsrc89t3rcs.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
});
```

## Testing Steps

### Test 1: Quick Fix (Current)
```bash
cd /home/punisher/Documents/vehicle
npx expo start --clear
# Test on Android device - should work now with web client ID
```

### Test 2: After SHA-1 Configuration
1. **Add SHA-1 to Firebase** (as described above)
2. **Wait 5-10 minutes** for changes to propagate
3. **Revert to original Android client ID**
4. **Test again**

## Why This Happens

### Web vs Android OAuth Flow:

**Web (Works)**: 
- Uses `webClientId`
- No SHA-1 fingerprint required
- Domain-based authorization (`localhost`, `auth.expo.io`)

**Android (Fails without SHA-1)**:
- Uses `androidClientId`
- Requires SHA-1 fingerprint for security
- Package name + SHA-1 fingerprint validation

## Alternative Solutions

### Option 1: Use Web Client ID for All Platforms (Current Fix)
```tsx
const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: '1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com',
  androidClientId: '1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com', // Same as web
  iosClientId: '1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com', // Same as web
  scopes: ['profile', 'email'],
});
```
**Pros**: Works immediately, simple configuration
**Cons**: Not the "proper" way, might have limitations in production

### Option 2: Minimal Android Configuration
```tsx
const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: '1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com',
  // Remove androidClientId and iosClientId - let it fall back to web
  scopes: ['profile', 'email'],
});
```

## Production Considerations

For production builds, you'll need:

### Release SHA-1 Fingerprint
```bash
# Generate release keystore first, then get SHA-1
keytool -genkey -v -keystore your-release-key.keystore -alias your-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Get release SHA-1
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

### Google Play App Signing
If using Google Play App Signing, you'll need the **Upload Certificate SHA-1** from Google Play Console.

## Debugging Commands

```bash
# Check current keystore
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Verify Android configuration
npx expo run:android

# Clear all caches
npx expo start --clear --reset-cache
```

## Expected Result

After configuring SHA-1 fingerprint:
✅ **Web**: Google Sign-In works
✅ **Android**: Google Sign-In works  
✅ **iOS**: Google Sign-In works (when properly configured)

## Current Status

🚀 **Quick fix applied**: Using web client ID for Android
⏳ **Next step**: Add SHA-1 fingerprint to Firebase for proper configuration
🔧 **Test**: Try Google Sign-In on Android now - it should work!
