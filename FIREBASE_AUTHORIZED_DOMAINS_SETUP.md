# Firebase Authorized Domains Setup for Google Sign-In

## Overview
Your React Native/Expo app with Firebase Google Sign-In requires specific authorized domains to be configured in Firebase Console.

## Your Firebase Project Details
- **Project ID**: `vehicle-b7c9a`
- **Auth Domain**: `vehicle-b7c9a.firebaseapp.com`
- **Client ID**: `1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com`

## Required Authorized Domains

### Core Domains
1. **vehicle-b7c9a.firebaseapp.com** - Your Firebase hosting domain
2. **localhost** - For local development
3. **127.0.0.1** - Alternative localhost format
4. **auth.expo.io** - Required for Expo's OAuth flow

### Optional Development Domains
If you're testing on physical devices, you may also need:
- Your local IP address (e.g., `192.168.1.100`)
- Any custom development domains you use

## Configuration Steps

### Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **vehicle-b7c9a**

### Step 2: Navigate to Authentication
1. Click **Authentication** in the left sidebar
2. Click **Sign-in method** tab
3. Find **Google** in the provider list
4. Click the **pencil icon** to edit Google provider

### Step 3: Configure Authorized Domains
1. Scroll down to **"Authorized domains"** section
2. You should see `vehicle-b7c9a.firebaseapp.com` and `localhost` already listed
3. Click **"Add domain"** for each missing domain:
   - `127.0.0.1`
   - `auth.expo.io`

### Step 4: Verify Web Client ID
In the same Google provider settings:
1. Ensure **Web SDK configuration** is enabled
2. Verify the **Web client ID** matches: `1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com`

### Step 5: Save Configuration
1. Click **Save** to apply changes
2. Wait a few minutes for changes to propagate

## Testing Your Configuration

After configuring the domains, test your Google Sign-In:

1. **Development Testing**:
   ```bash
   npx expo start
   ```
   - Test on simulator/emulator
   - Test on physical device

2. **Expected Flow**:
   - Click Google Sign-In button
   - OAuth window opens (via expo-auth-session)
   - User signs in with Google account
   - App receives tokens and creates Firebase user
   - User is redirected to main app

## Troubleshooting

### Common Issues:

1. **"Origin not allowed"** error:
   - Check that all required domains are added
   - Wait 5-10 minutes after adding domains

2. **"Invalid client ID"** error:
   - Verify Web Client ID in Firebase Console
   - Ensure it matches the one in your code

3. **"Unauthorized domain"** error:
   - Add your development IP address if testing on physical device
   - Ensure `auth.expo.io` is in authorized domains

### Verification Checklist:
- [ ] `vehicle-b7c9a.firebaseapp.com` is authorized
- [ ] `localhost` is authorized  
- [ ] `127.0.0.1` is authorized
- [ ] `auth.expo.io` is authorized
- [ ] Google provider is enabled
- [ ] Web client ID is correct
- [ ] Changes have been saved and propagated (wait 5-10 minutes)

## Development vs Production

### Development Domains:
- `localhost`, `127.0.0.1` - For local development
- Your local IP (if testing on physical devices)

### Production Domains:
- `vehicle-b7c9a.firebaseapp.com` - Firebase hosting
- `auth.expo.io` - Expo OAuth (always required)
- Your custom domain (if you have one)

## Next Steps

Once domains are configured:
1. Test Google Sign-In in your app
2. Monitor Firebase Authentication logs for any errors
3. If issues persist, check the browser developer console for specific error messages

## Support

If you continue experiencing issues:
1. Check Firebase Console → Authentication → Users to see if sign-ins are being logged
2. Review the network tab in developer tools during sign-in
3. Verify your expo-auth-session configuration matches the working implementation in `login.tsx`
