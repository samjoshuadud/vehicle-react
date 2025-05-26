// Firebase Configuration Diagnostic Test
// Run this in your browser console or as a test script

const testFirebaseConfig = () => {
  console.log('🔍 Firebase Configuration Diagnostic');
  console.log('=====================================');
  
  // Your current configuration
  const config = {
    apiKey: "AIzaSyAHDP3wXuPYisRqIF9iPuwo_I0LNHNsQHs",
    authDomain: "vehicle-b7c9a.firebaseapp.com",
    projectId: "vehicle-b7c9a",
    storageBucket: "vehicle-b7c9a.firebasestorage.app",
    messagingSenderId: "1087198592087",
    appId: "1:1087198592087:web:ebd58b733ad73b91d5b712"
  };
  
  const clientIds = {
    web: '1087198592087-3uc2k6210hgsvi6kmkgjs29g3jndb9ol.apps.googleusercontent.com',
    android: '1087198592087-tq4durvv65g0alvh7ukn5o5ijf89qmqj.apps.googleusercontent.com'
  };
  
  console.log('✅ Project ID:', config.projectId);
  console.log('✅ Auth Domain:', config.authDomain);
  console.log('✅ Messaging Sender ID:', config.messagingSenderId);
  console.log('✅ Web Client ID:', clientIds.web);
  console.log('✅ Android Client ID:', clientIds.android);
  
  // Check if domains are likely configured
  console.log('\n📍 Required Authorized Domains:');
  const requiredDomains = [
    'vehicle-b7c9a.firebaseapp.com',
    'localhost',
    '127.0.0.1',
    'auth.expo.io'
  ];
  
  requiredDomains.forEach(domain => {
    console.log(`   - ${domain}`);
  });
  
  console.log('\n🔗 Firebase Console Links:');
  console.log(`   Authentication: https://console.firebase.google.com/project/${config.projectId}/authentication/providers`);
  console.log(`   Project Settings: https://console.firebase.google.com/project/${config.projectId}/settings/general`);
  
  console.log('\n🔗 Google Cloud Console Links:');
  console.log(`   OAuth Consent: https://console.cloud.google.com/apis/credentials/consent?project=${config.projectId}`);
  console.log(`   Credentials: https://console.cloud.google.com/apis/credentials?project=${config.projectId}`);
  
  // Test if current page would be authorized
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'N/A';
  console.log('\n🌐 Current Origin:', currentOrigin);
  
  const isAuthorized = requiredDomains.some(domain => 
    currentOrigin.includes(domain) || 
    currentOrigin.includes('localhost') || 
    currentOrigin.includes('127.0.0.1')
  );
  
  console.log('🔐 Origin Authorization Status:', isAuthorized ? '✅ Likely Authorized' : '❌ Needs Authorization');
  
  return {
    config,
    clientIds,
    requiredDomains,
    currentOrigin,
    isAuthorized
  };
};

// Export for use in React Native
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testFirebaseConfig };
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  testFirebaseConfig();
}
