#!/bin/bash

echo "🔍 Google Sign-In Android Debug Checklist"
echo "=========================================="

echo ""
echo "✅ 1. Current Configuration:"
echo "   Web Client ID: 1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com"
echo "   Package: com.samjoshuadud.vehicle"
echo "   SHA-1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25"

echo ""
echo "🔧 2. Firebase Console Checklist:"
echo "   Go to: https://console.firebase.google.com/project/vehicle-b7c9a"
echo "   □ Authentication > Sign-in method > Google (enabled)"
echo "   □ Authentication > Sign-in method > Authorized domains includes:"
echo "     - vehicle-b7c9a.firebaseapp.com"
echo "     - localhost"
echo "     - 127.0.0.1"
echo "     - auth.expo.io"

echo ""
echo "🔧 3. Google Cloud Console Checklist:"
echo "   Go to: https://console.cloud.google.com/apis/credentials?project=vehicle-b7c9a"
echo "   □ OAuth 2.0 Client IDs exist for Web application"
echo "   □ OAuth consent screen is configured"
echo "   □ Test users added (if in testing mode)"

echo ""
echo "📱 4. Test Commands:"
echo "   Clear cache: npx expo start --clear"
echo "   Test on Android: Press 'a' to open Android"

echo ""
echo "🚨 5. Quick Fixes to Try:"
echo "   A. Use only webClientId (current configuration)"
echo "   B. Add SHA-1 fingerprint to Firebase Android app"
echo "   C. Check OAuth consent screen in Google Cloud Console"

echo ""
echo "🔍 6. Expected Console Output:"
echo "   SUCCESS: 'Google Auth Success - Full response: {...}'"
echo "   FAILURE: 'Google Auth Error Details: {...}'"

echo ""
echo "Run this checklist and let's see which step is failing!"
