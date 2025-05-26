# Google Sign-In Token Debug Guide

## Issue: "Cannot read IdToken"

This error typically occurs when the Google authentication response doesn't contain the expected `idToken` property, or it's in a different format than expected.

## Debugging Steps

### 1. Check Response Structure
The updated code now logs the full response structure. Run your app and check the console for:

```javascript
// Expected successful response structure:
{
  "type": "success",
  "authentication": {
    "idToken": "eyJhbGci...", // This is what we need
    "accessToken": "ya29.a0...", // Optional but helpful
    // Other properties...
  },
  // Other response properties...
}
```

### 2. Common Token Issues

#### Issue A: Response Type Configuration
**Problem**: Setting `responseType: Google.ResponseType.IdToken` can sometimes cause issues
**Solution**: ✅ Removed this from configuration to get default behavior

#### Issue B: Token Property Names
**Problem**: Different platforms might return tokens with different property names
**Solution**: ✅ Now checks for both `idToken`/`id_token` and `accessToken`/`access_token`

#### Issue C: Missing Authentication Object
**Problem**: The `authentication` object might be undefined
**Solution**: ✅ Added null check for authentication object

### 3. Test with Console Logging

Your updated code now includes extensive logging. When you test Google Sign-In, you should see:

1. **Success Case**:
   ```
   Google Auth Success - Full response: { ... }
   Authentication object exists: { ... }
   Full authentication object: { ... }
   Extracted tokens: { idToken: 'Present', accessToken: 'Present' }
   ```

2. **Failure Case**:
   ```
   Google Auth Error Details: { ... }
   ```

### 4. Alternative Google Auth Configuration

If the current configuration still doesn't work, try this alternative:

```tsx
const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: '1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com',
  androidClientId: '1087198592087-tq4durvv65g0alvh7ukn5o5ijf89qmqj.apps.googleusercontent.com',
  iosClientId: '1087198592087-ua3m0asu1vf3ffkbsaeoemsrc89t3rcs.apps.googleusercontent.com',
  scopes: ['openid', 'profile', 'email'], // Add 'openid' scope
  selectAccount: true, // Force account selection
});
```

### 5. Platform-Specific Issues

#### Android Issues:
- Ensure SHA-1 fingerprint is configured in Firebase (for release builds)
- Check that package name matches exactly: `com.samjoshuadud.vehicle`

#### iOS Issues:
- Ensure bundle identifier matches: `com.samjoshuadud.vehicle`
- iOS Client ID should be from Firebase iOS app configuration

#### Web/Expo Issues:
- Ensure authorized domains include `localhost` and `auth.expo.io`

### 6. Testing Commands

```bash
# Clear cache and restart
npx expo start --clear

# Check if Google services are properly installed
npx expo install expo-auth-session expo-web-browser

# Verify expo-auth-session version
npm list expo-auth-session
```

### 7. Fallback Authentication Flow

If tokens are still not working, you can try using the user info endpoint:

```tsx
const handleGoogleAuth = async (authentication: any) => {
  console.log('Full authentication object:', JSON.stringify(authentication, null, 2));
  
  // If no idToken, try to get user info with accessToken
  if (!authentication?.idToken && authentication?.accessToken) {
    try {
      // Fetch user info from Google's API
      const userInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${authentication.accessToken}`
      );
      const userInfo = await userInfoResponse.json();
      console.log('User info from Google API:', userInfo);
      
      // You might need to implement a different Firebase auth method here
      // This is a fallback if idToken is not available
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }
  
  // Rest of your existing logic...
};
```

### 8. Expected Token Structure

A valid `idToken` should:
- Be a JWT string starting with `eyJ`
- Contain user information when decoded
- Be usable with `GoogleAuthProvider.credential(idToken, accessToken)`

### 9. Next Steps

1. **Test with updated logging** - Check console output
2. **Verify client IDs** - Ensure they match Firebase exactly
3. **Check authorized domains** - Ensure all required domains are configured
4. **Test on different platforms** - Try both Android and iOS if possible

### 10. If Still Not Working

Try a minimal test configuration:

```tsx
const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: '1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com',
  scopes: ['profile', 'email'],
});
```

This removes platform-specific client IDs to test if the basic flow works.
