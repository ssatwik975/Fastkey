"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// Special Chrome Mobile WebAuthn Polyfill
const setupMobileWebAuthn = () => {
  console.log("Setting up mobile WebAuthn environment");
  
  // Check if running on problematic environments
  const isAndroid = /android/i.test(navigator.userAgent);
  const isChrome = /chrome|chromium/i.test(navigator.userAgent);
  const isChromeOnAndroid = isAndroid && isChrome;
  
  console.log("Environment detection:", { isAndroid, isChrome, isChromeOnAndroid });
  
  if (isChromeOnAndroid) {
    // Create backup of existing implementation (if any)
    const originalPublicKeyCredential = window.PublicKeyCredential;
    
    // Check if browser reports WebAuthn but doesn't actually implement it correctly
    const hasIncompleteImplementation = typeof window.PublicKeyCredential !== 'undefined' && 
      (typeof navigator.credentials === 'undefined' || 
       typeof navigator.credentials.create !== 'function' ||
       typeof navigator.credentials.get !== 'function');
       
    console.log("Implementation check:", { 
      hasPublicKeyCredential: typeof window.PublicKeyCredential !== 'undefined',
      hasNavigatorCredentials: typeof navigator.credentials !== 'undefined',
      hasCreateMethod: typeof navigator.credentials?.create === 'function',
      hasGetMethod: typeof navigator.credentials?.get === 'function',
      hasIncompleteImplementation
    });
    
    if (hasIncompleteImplementation) {
      console.warn("Detected incomplete WebAuthn implementation, applying fixes");
      
      // Fix navigator.credentials if needed
      if (typeof navigator.credentials === 'undefined') {
        // @ts-ignore
        navigator.credentials = {};
      }
      
      // Define missing create method
      if (typeof navigator.credentials.create !== 'function') {
        navigator.credentials.create = async function(options) {
          console.log("Using polyfilled credentials.create()");
          throw new Error("This browser doesn't support WebAuthn properly. Please try using a different browser like Chrome, Firefox, or Safari.");
        };
      }
      
      // Define missing get method
      if (typeof navigator.credentials.get !== 'function') {
        navigator.credentials.get = async function(options) {
          console.log("Using polyfilled credentials.get()");
          throw new Error("This browser doesn't support WebAuthn properly. Please try using a different browser like Chrome, Firefox, or Safari.");
        };
      }
    }
  }
  
  return { isChromeOnAndroid };
};

// Add this debug function to better understand errors
const logDebugInfo = (step, error) => {
  console.error(`WebAuthn ${step} error:`, error);
  
  // Check for common WebAuthn errors
  if (error.name === 'NotAllowedError') {
    return 'User declined the authentication request or the operation timed out.';
  } else if (error.name === 'SecurityError') {
    return 'The origin is not secure (must be HTTPS, except on localhost).';
  } else if (error.name === 'NotSupportedError') {
    return 'This device or browser doesn\'t support WebAuthn or the requested authenticator.';
  } else if (error.name === 'AbortError') {
    return 'The operation was aborted.';
  }
  
  return error.message;
};

const mobileBrowserWorkaround = () => {
  console.log("Applying mobile browser workaround");
  
  const { isChromeOnAndroid } = setupMobileWebAuthn();
  
  // Create complete polyfill if needed
  if (typeof window.PublicKeyCredential === 'undefined') {
    console.log("Creating full PublicKeyCredential polyfill");
    
    // Define the PublicKeyCredential constructor
    window.PublicKeyCredential = function() {};
    
    // Add the capability detection static method
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = async function() {
      console.log("Using polyfilled capability detection");
      return false; // Return false to indicate no real support
    };
  }
  
  // For Android Chrome specifically, make UI adjustments
  if (isChromeOnAndroid) {
    console.log("Applying Chrome on Android specific workarounds");
  }
  
  console.log("Final PublicKeyCredential status:", {
    exists: !!window.PublicKeyCredential,
    capabilityDetectionExists: typeof window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable === 'function',
    navigatorCredentialsExists: typeof navigator.credentials !== 'undefined',
    createExists: typeof navigator.credentials?.create === 'function',
    getExists: typeof navigator.credentials?.get === 'function'
  });
};

const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
};

// Add this function to explicitly try to notify the desktop
const notifyDesktop = async (success) => {
  // Try to directly notify desktop
  try {
    const effectiveSessionId = sessionStorage.getItem('overrideSessionId') || sessionId;
    await fetch(`${API_BASE_URL}/api/notify-desktop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: effectiveSessionId,
        username,
        success
      })
    });
    console.log('Explicit desktop notification sent');
  } catch (err) {
    console.error('Failed to send desktop notification:', err);
  }
};

// Update to handle registration parameter from URL
export default function MobileAuth() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [isForceRegistration, setIsForceRegistration] = useState(false); // For explicit registration
  const [deviceSupport, setDeviceSupport] = useState({
    webauthnSupported: null,
    biometricsAvailable: null
  });
  const { sessionId } = useParams();
  const API_BASE_URL = getApiBaseUrl();

  // Check for registration flag in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const register = params.get('register');
      if (register === 'true') {
        setIsForceRegistration(true);
      }
    }
  }, []);

  // Fetch session data on component mount
  useEffect(() => {
    async function checkSession() {
      try {
        // First apply mobile workarounds
        mobileBrowserWorkaround();
        
        // Add debugging information
        console.log("Browser info:", {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          vendor: navigator.vendor
        });
        
        if (!sessionId) {
          setStatus('error');
          setMessage('Invalid session');
          return;
        }

        // Verify session with the server first
        try {
          console.log(`Verifying session ${sessionId} with server...`);
          const verifyResponse = await fetch(`${API_BASE_URL}/api/verify-session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
          });
          
          const verifyResult = await verifyResponse.json();
          
          if (!verifyResult.valid) {
            console.warn('Session verification failed:', verifyResult.error);
            
            if (verifyResult.newSessionId) {
              console.log(`Received new session ID: ${verifyResult.newSessionId}`);
              // Store the new session ID for future requests
              sessionStorage.setItem('overrideSessionId', verifyResult.newSessionId);
            }
            
            // Continue anyway for testing purposes, but show a warning
            setMessage('Warning: Your session may be invalid. Registration might fail.');
          } else {
            console.log('Session verified successfully');
          }
        } catch (verifyError) {
          console.error('Error verifying session:', verifyError);
          // Continue anyway but show a warning
          setMessage('Warning: Unable to verify session. Registration might fail.');
        }

        // First check general WebAuthn API support
        const webauthnSupported = typeof window.PublicKeyCredential !== 'undefined';
        setDeviceSupport(prev => ({ ...prev, webauthnSupported }));
        
        if (!webauthnSupported) {
          setStatus('error');
          setMessage('Your browser doesn\'t support WebAuthn. Please try a modern browser like Chrome, Safari, or Firefox.');
          return;
        }

        // Then check platform authenticator availability
        if (window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
          try {
            const biometricsAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            setDeviceSupport(prev => ({ ...prev, biometricsAvailable }));
            
            // Don't block UI even if biometrics are not available
            // Just make it informational
          } catch (e) {
            console.error("Error checking biometric availability:", e);
            // Continue anyway, don't block
          }
        }

        // Proceed to ready state regardless
        setStatus('ready');
        
        // If this is an explicit registration, show appropriate message
        if (isForceRegistration) {
          setMessage('Register a new passkey for seamless login');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setStatus('error');
        setMessage('Failed to validate session');
      }
    }
    
    checkSession();
  }, [sessionId, isForceRegistration]);

  useEffect(() => {
    async function checkDeviceSupport() {
      // First check WebAuthn API availability
      const webauthnApiAvailable = typeof window.PublicKeyCredential !== 'undefined';
      
      // Then check if navigator.credentials APIs are actually available
      const credentialsApiAvailable = 
        typeof navigator.credentials !== 'undefined' &&
        typeof navigator.credentials.create === 'function' &&
        typeof navigator.credentials.get === 'function';
      
      // Only consider WebAuthn truly supported if both conditions are met
      const webauthnSupported = webauthnApiAvailable && credentialsApiAvailable;
      
      setDeviceSupport(prev => ({ ...prev, webauthnSupported }));
      
      // If WebAuthn appears to be supported, check for biometric capability
      if (webauthnSupported && window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        try {
          const biometricsAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setDeviceSupport(prev => ({ ...prev, biometricsAvailable }));
        } catch (e) {
          console.error("Error checking biometric availability:", e);
          setDeviceSupport(prev => ({ ...prev, biometricsAvailable: false }));
        }
      } else {
        setDeviceSupport(prev => ({ ...prev, biometricsAvailable: false }));
      }
      
      console.log("Device support check complete:", {
        webauthnApiAvailable,
        credentialsApiAvailable,
        webauthnSupported
      });
    }
    
    checkDeviceSupport();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("Form submission started");
    
    if (!username.trim()) {
      setMessage('Please enter a username');
      return;
    }
    
    setStatus('processing');
    setMessage('Processing...');
    
    try {
      console.log(`Checking if username '${username}' exists...`);
      // Check if the user exists
      const checkResponse = await fetch(`${API_BASE_URL}/api/check-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      
      const { exists } = await checkResponse.json();
      
      // Override existence check if registration is forced
      if (isForceRegistration) {
        if (exists) {
          setStatus('error');
          setMessage('This username is already taken. Please choose another username.');
          return;
        }
        await startRegistration();
      } else {
        // Normal flow - decide based on existence
        setIsNewUser(!exists);
        if (exists) {
          await startAuthentication();
        } else {
          await startRegistration();
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  // Complete the startRegistration function
  const startRegistration = async () => {
    try {
      setMessage('Initializing biometric enrollment...');
      
      // Apply mobile workarounds
      mobileBrowserWorkaround();
      
      // Use override sessionId if available from session verification
      const effectiveSessionId = sessionStorage.getItem('overrideSessionId') || sessionId;
      console.log(`Using session ID for registration: ${effectiveSessionId}`);
      
      // Get registration options from server with better error handling
      let optionsResponse;
      try {
        optionsResponse = await fetch(`${API_BASE_URL}/api/webauthn/registration-options`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            username, 
            sessionId: effectiveSessionId,
            rpId: API_BASE_URL.replace(/^https?:\/\//, '').split(':')[0],
            isAndroidChrome: /Android.*Chrome/.test(navigator.userAgent)
          }),
        });
        
        if (!optionsResponse.ok) {
          const errorData = await optionsResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Server returned ${optionsResponse.status}: ${optionsResponse.statusText}`);
        }
      } catch (fetchError) {
        console.error('Failed to fetch registration options:', fetchError);
        setStatus('error');
        setMessage(`Failed to start registration: ${fetchError.message}. Please try again.`);
        return;
      }
      
      // Extract registration options
      const options = await optionsResponse.json();
      console.log("Received registration options:", options);
      
      // Convert base64url encoded challenge to ArrayBuffer
      options.challenge = base64urlToArrayBuffer(options.challenge);
      
      // Convert excludeCredentials ids from base64url to ArrayBuffer if present
      if (options.excludeCredentials) {
        options.excludeCredentials = options.excludeCredentials.map(credential => ({
          ...credential,
          id: base64urlToArrayBuffer(credential.id),
        }));
      }
      
      // Convert user.id from base64url to ArrayBuffer
      options.user.id = base64urlToArrayBuffer(options.user.id);
      
      // Add special flags for Android Chrome
      const isAndroidChrome = navigator.userAgent.includes('Android') && 
                            /chrome|chromium/i.test(navigator.userAgent);
      if (isAndroidChrome) {
        console.log("Applying Android Chrome specific registration options");
        options.authenticatorSelection = {
          authenticatorAttachment: "platform",
          requireResidentKey: false,
          userVerification: "discouraged"
        };
      }
      
      // Log the final options for debugging
      console.log("Calling navigator.credentials.create with options:", options);
      
      // Create credential
      setMessage('Waiting for your fingerprint or biometric verification...');
      const credential = await navigator.credentials.create({
        publicKey: options
      });
      console.log("Credential created:", credential);
      
      // Prepare credential for sending to server
      const credentialForServer = {
        id: credential.id,
        rawId: arrayBufferToBase64url(credential.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64url(credential.response.clientDataJSON),
          attestationObject: arrayBufferToBase64url(credential.response.attestationObject),
          publicKey: credential.response.getPublicKey ? arrayBufferToBase64url(credential.response.getPublicKey()) : null,
          publicKeyAlgorithm: credential.response.getPublicKeyAlgorithm ? credential.response.getPublicKeyAlgorithm() : null,
          transports: credential.response.getTransports ? credential.response.getTransports() : null,
          authenticatorData: credential.response.authenticatorData ? arrayBufferToBase64url(credential.response.authenticatorData) : null
        },
        type: credential.type
      };
      
      // Send credential to server for verification
      setMessage('Verifying registration...');
      const verificationResponse = await fetch(`${API_BASE_URL}/api/webauthn/registration-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          sessionId: effectiveSessionId,
          credential: credentialForServer
        }),
      });
      
      if (!verificationResponse.ok) {
        throw new Error('Registration verification failed');
      }
      
      const verificationResult = await verificationResponse.json();
      
      if (verificationResult.success) {
        setStatus('success');
        setMessage('Registration successful! You can now use your biometric passkey for future logins.');
        
        // Store token in local storage
        localStorage.setItem('token', verificationResult.token);
        localStorage.setItem('username', username);
        localStorage.setItem('deviceId', verificationResult.deviceId || '');
        
        // Explicitly notify desktop
        await notifyDesktop(true);
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Check if this is a network error
      if (!navigator.onLine) {
        setStatus('error');
        setMessage('Network error. Please check your internet connection.');
        return;
      }
      
      // Check if this is a server error
      if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
        setStatus('error');
        setMessage('Could not connect to the authentication server. Please try again later.');
        return;
      }
      
      // Extract more specific WebAuthn errors
      const errorDetails = logDebugInfo('registration', error);
      setStatus('error');
      setMessage(`Registration failed: ${errorDetails}`);
    }
  };

  const startAuthentication = async () => {
    try {
      setMessage('Initializing authentication...');
      
      // Apply workarounds first
      mobileBrowserWorkaround();
      
      // Use override sessionId if available from session verification
      const effectiveSessionId = sessionStorage.getItem('overrideSessionId') || sessionId;
      console.log(`Using session ID for authentication: ${effectiveSessionId}`);
      
      // Get authentication options from server
      const rpId = API_BASE_URL.replace(/^https?:\/\//, '').split(':')[0];
      console.log("Using rpId for authentication:", rpId);
      
      const isAndroidChrome = navigator.userAgent.includes('Android') && 
                             /chrome|chromium/i.test(navigator.userAgent);
      
      const optionsResponse = await fetch(`${API_BASE_URL}/api/webauthn/authentication-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          sessionId: effectiveSessionId,
          rpId: rpId,
          isAndroidChrome 
        }),
      });
      
      if (!optionsResponse.ok) {
        throw new Error('Failed to get authentication options');
      }
      
      const options = await optionsResponse.json();
      console.log("Received authentication options:", options);
      
      // Convert base64url encoded challenge to ArrayBuffer
      options.challenge = base64urlToArrayBuffer(options.challenge);
      
      // Convert allowCredentials ids from base64url to ArrayBuffer
      if (options.allowCredentials) {
        options.allowCredentials = options.allowCredentials.map(credential => ({
          ...credential,
          id: base64urlToArrayBuffer(credential.id),
        }));
      }
      
      // For Android Chrome - simplify options
      if (isAndroidChrome) {
        // Use discouraged to reduce friction
        options.userVerification = "discouraged";
        console.log("Applied Android Chrome specific auth options");
      }
      
      // Get credential - log before and after for debugging
      console.log("About to call navigator.credentials.get with options:", options);
      const credential = await navigator.credentials.get({
        publicKey: options
      });
      console.log("Got credential response:", credential);
      
      // Prepare credential for sending to server
      const credentialForServer = {
        id: credential.id,
        rawId: arrayBufferToBase64url(credential.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64url(credential.response.clientDataJSON),
          authenticatorData: arrayBufferToBase64url(credential.response.authenticatorData),
          signature: arrayBufferToBase64url(credential.response.signature),
          userHandle: credential.response.userHandle ? arrayBufferToBase64url(credential.response.userHandle) : null
        },
        type: credential.type
      };
      
      // Send credential to server for verification
      const verificationResponse = await fetch(`${API_BASE_URL}/api/webauthn/authentication-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          sessionId: effectiveSessionId,
          credential: credentialForServer,
          rpId: API_BASE_URL.replace(/^https?:\/\//, '').split(':')[0]
        }),
      });
      
      if (!verificationResponse.ok) {
        throw new Error('Authentication verification failed');
      }
      
      const verificationResult = await verificationResponse.json();
      
      if (verificationResult.success) {
        setStatus('success');
        setMessage('Authentication successful! You can now close this page and continue on your desktop.');
        
        // Store token in local storage
        localStorage.setItem('token', verificationResult.token);
        localStorage.setItem('username', username);
        localStorage.setItem('deviceId', verificationResult.deviceId || '');
        
        // Explicitly notify desktop
        await notifyDesktop(true);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      
      // Check if this is a network error
      if (!navigator.onLine) {
        setStatus('error');
        setMessage('Network error. Please check your internet connection.');
        return;
      }
      
      // Check if this is a server error
      if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
        setStatus('error');
        setMessage('Could not connect to the authentication server. Please try again later.');
        return;
      }
      
      // Extract more specific WebAuthn errors
      const errorDetails = logDebugInfo('authentication', error);
      setStatus('error');
      setMessage(`Authentication failed: ${errorDetails}`);
    }
  };

  const testWebAuthnSupport = async () => {
    try {
      mobileBrowserWorkaround();

      setMessage("Testing WebAuthn capabilities...");
      
      // Log browser and environment information
      console.log("Navigator:", {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor
      });
      console.log("Window location:", window.location);
      console.log("WebAuthn support:", !!window.PublicKeyCredential);
      
      // Test if PublicKeyCredential is available
      if (typeof window.PublicKeyCredential === 'undefined') {
        setMessage("WebAuthn not supported: PublicKeyCredential is undefined");
        return;
      }
      
      // Create a simple credential for testing
      const challengeBuffer = new Uint8Array(32);
      window.crypto.getRandomValues(challengeBuffer);
      
      // Extract IP address from the API_BASE_URL
      const rpId = API_BASE_URL.replace(/^https?:\/\//, '').split(':')[0];
      console.log("Using RP ID:", rpId);
      
      // Generate a basic credential creation options with explicit IP as RP ID
      const testOpts = {
        challenge: challengeBuffer.buffer,
        rp: {
          name: "WebAuthn Test",
          id: rpId  // Use the extracted IP address
        },
        user: {
          id: new Uint8Array([1, 2, 3, 4]),
          name: "test@example.com",
          displayName: "Test User"
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },    // ES256
          { type: "public-key", alg: -257 }   // RS256
        ],
        timeout: 60000,
        authenticatorSelection: {
          // Remove the attachment constraint which can cause problems on mobile
          userVerification: "preferred"
        }
      };
      
      // Try to create credential
      try {
        console.log("Creating credential with options:", testOpts);
        await navigator.credentials.create({
          publicKey: testOpts
        });
        setMessage("SUCCESS: Your device fully supports WebAuthn and biometric authentication!");
      } catch (credError) {
        console.error("Credential creation error:", credError);
        setMessage(`WebAuthn test error: ${credError.name} - ${credError.message}`);
      }
    } catch (err) {
      console.error("WebAuthn test failed:", err);
      setMessage(`WebAuthn test failed: ${err.message}`);
    }
  };

  // Helper functions for ArrayBuffer <-> base64url conversion
  function arrayBufferToBase64url(buffer) {
    const bytes = new Uint8Array(buffer);
    let str = '';
    
    for (const byte of bytes) {
      str += String.fromCharCode(byte);
    }
    
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  function base64urlToArrayBuffer(base64url) {
    const base64 = base64url
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLength);
    
    const binary = atob(padded);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    return buffer;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-in">
        <div className="card shadow-soft dark:shadow-none overflow-hidden">
          {/* Decorative header */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-primary-500 to-secondary-500 -mt-10 rounded-b-full transform scale-110 z-0"></div>
          
          {/* Logo */}
          <div className="relative z-10 flex flex-col items-center mb-6">
            <div className="h-16 w-16 rounded-full bg-white shadow-md flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold mt-4 text-neutral-900 dark:text-white">FastKey Authentication</h1>
            <div className="flex items-center mt-1">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
              <p className="text-sm text-primary-600 dark:text-primary-400">Mobile Authentication</p>
            </div>
          </div>
          
          {/* Content based on state */}
          {status === 'loading' && (
            <div className="flex flex-col items-center py-8 scale-in">
              <div className="h-12 w-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin mb-4"></div>
              <p className="text-neutral-700 dark:text-neutral-300">Initializing secure connection...</p>
            </div>
          )}
          
          {status === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div className="bg-white dark:bg-neutral-800 p-5 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
                {/* Show appropriate mode label */}
                <div className="mb-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isForceRegistration 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {isForceRegistration ? 'Register New Account' : 'Authentication'}
                  </span>
                </div>
                
                <label htmlFor="username" className="label">
                  Username
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input pl-10"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full flex justify-center items-center py-3 px-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-medium rounded-lg shadow-md hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.625 2.655A9 9 0 0119 11a1 1 0 11-2 0 7 7 0 00-9.625-6.492 1 1 0 11-.75-1.853zM4.662 4.959A1 1 0 014.75 6.37 6.97 6.97 0 003 11a1 1 0 11-2 0 8.97 8.97 0 012.25-5.953 1 1 0 011.412-.088z" clipRule="evenodd" />
                </svg>
                {isForceRegistration ? 'Register with Fingerprint' : 'Continue with Fingerprint'}
              </button>
              
              <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400 justify-center mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Your device will prompt you to use your fingerprint
              </div>
            </form>
          )}
          
          {status === 'ready' && !deviceSupport.webauthnSupported && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-3 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-400">Browser Compatibility Issue</h4>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                    Your browser doesn't fully support the WebAuthn standard needed for biometric authentication.
                  </p>
                  <div className="mt-3">
                    <p className="text-xs text-red-600 dark:text-red-300">
                      Please try one of these browsers instead:
                    </p>
                    <ul className="text-xs text-red-600 dark:text-red-300 list-disc list-inside mt-1 space-y-1">
                      <li>Safari on iOS 14.5+</li>
                      <li>Chrome on macOS or Windows</li>
                      <li>Firefox on macOS or Windows</li>
                      <li>Edge on Windows</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {status === 'ready' && (
            <div className="mt-4 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-semibold mb-2 text-neutral-700 dark:text-neutral-300">Device Support Status</h3>
              <ul className="space-y-1">
                <li className="flex items-center text-xs">
                  {deviceSupport.webauthnSupported ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="text-neutral-600 dark:text-neutral-400">
                    WebAuthn API: {deviceSupport.webauthnSupported ? 'Supported' : 'Not Supported'}
                  </span>
                </li>
                <li className="flex items-center text-xs">
                  {deviceSupport.biometricsAvailable ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Biometrics/Platform Authenticator: {deviceSupport.biometricsAvailable ? 'Available' : 'Not Available'}
                  </span>
                </li>
              </ul>
            </div>
          )}
          
          {status === 'processing' && (
            <div className="flex flex-col items-center py-8 scale-in">
              <div className="h-16 w-16 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin mb-6"></div>
              <div className="space-y-2 text-center">
                <p className="text-lg font-medium text-neutral-800 dark:text-neutral-200">Processing...</p>
                <p className="text-neutral-600 dark:text-neutral-400">{message}</p>
              </div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center py-8 scale-in">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="space-y-2 text-center">
                <p className="text-xl font-bold text-green-600 dark:text-green-400">Success!</p>
                <p className="text-neutral-700 dark:text-neutral-300">{message}</p>
                <div className="inline-flex items-center px-4 py-2 bg-green-50 dark:bg-green-900/30 rounded-full text-sm text-green-700 dark:text-green-300 mt-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  {isNewUser || isForceRegistration ? 'Passkey registered successfully' : 'Authentication successful'}
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                  Your desktop browser should update automatically.
                  <br/>You can close this window.
                </p>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center py-8 scale-in">
              <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="space-y-2 text-center">
                <p className="text-xl font-bold text-red-600 dark:text-red-400">Error</p>
                <p className="text-neutral-700 dark:text-neutral-300">{message}</p>
                <button
                  onClick={() => setStatus('ready')}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
        
        <button 
          onClick={async () => {
            try {
              setMessage("Testing connection...");
              const resp = await fetch(`${API_BASE_URL}/api/check-username`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username: 'test'})
              });
              const data = await resp.json();
              setMessage(`Connection successful! Server responded: ${JSON.stringify(data)}`);
            } catch (err) {
              setMessage(`Connection failed: ${err.message}`);
            }
          }}
          className="mt-2 p-2 bg-blue-100 text-blue-800 rounded text-xs"
        >
          Test Server Connection
        </button>

        <button 
          onClick={testWebAuthnSupport}
          className="mt-2 p-2 bg-green-100 text-green-800 rounded text-xs"
        >
          Test WebAuthn Support
        </button>

        <button 
          onClick={() => {
            try {
              // Collect environment information
              const debugInfo = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                vendor: navigator.vendor,
                language: navigator.language,
                location: {
                  hostname: window.location.hostname,
                  href: window.location.href,
                  origin: window.location.origin,
                  protocol: window.location.protocol
                },
                screen: {
                  width: window.screen.width,
                  height: window.screen.height,
                  colorDepth: window.screen.colorDepth
                },
                webauthn: {
                  publicKeyCredential: typeof window.PublicKeyCredential !== 'undefined',
                  isUserVerifyingPlatformAuthenticatorAvailable: 
                    typeof window.PublicKeyCredential !== 'undefined' && 
                    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
                },
                ip: API_BASE_URL.replace(/^https?:\/\//, '').split(':')[0]
              };
              
              console.log("Environment debug info:", debugInfo);
              setMessage(`Environment debug info: ${JSON.stringify(debugInfo, null, 2)}`);
            } catch (err) {
              setMessage(`Error collecting debug info: ${err.message}`);
            }
          }}
          className="mt-2 p-2 bg-purple-100 text-purple-800 rounded text-xs"
        >
          Debug Environment
        </button>

        <button 
          onClick={async () => {
            try {
              setMessage("Running minimal WebAuthn test...");
              
              // Special flag for Android Chrome
              const isAndroidChrome = navigator.userAgent.includes('Android') && 
                                     /chrome|chromium/i.test(navigator.userAgent);
              
              // Create credential with minimal options
              const challengeBytes = new Uint8Array(32);
              window.crypto.getRandomValues(challengeBytes);
              
              const rpId = API_BASE_URL.replace(/^https?:\/\//, '').split(':')[0];
              console.log("Using RP ID for minimal test:", rpId);
              
              // Android Chrome workaround - credential options need specific structure
              const createOptions = {
                // Note: directly pass the options without the publicKey wrapper for Android Chrome
                challenge: challengeBytes.buffer,
                rp: {
                  id: rpId,
                  name: "Minimal Test"
                },
                user: {
                  id: new Uint8Array([0, 1, 2, 3]),
                  name: "test@example.com", 
                  displayName: "Test User"
                },
                pubKeyCredParams: [{ type: "public-key", alg: -7 }], // Just ES256
                timeout: 60000,
                attestation: "none",
                // Avoid these parameters which might cause issues on mobile
                authenticatorSelection: {
                  authenticatorAttachment: "platform",
                  requireResidentKey: false,
                  userVerification: "discouraged"
                }
              };
              
              // Log options for debugging
              console.log("Testing with minimal options:", createOptions);
              
              try {
                // Call the WebAuthn API
                const credential = await navigator.credentials.create({
                  publicKey: createOptions  // Properly wrapped for standard browsers
                });
                
                console.log("Credential created:", credential);
                setMessage(`Success! Credential ID: ${credential.id.substring(0, 10)}...`);
              } catch (err) {
                console.error("Credential creation error:", {
                  name: err.name,
                  message: err.message,
                  stack: err.stack
                });
                setMessage(`WebAuthn error: ${err.name} - ${err.message}`);
              }
            } catch (err) {
              console.error("Test framework error:", err);
              setMessage(`Framework error: ${err.message}`);
            }
          }}
          className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded text-xs"
        >
          Minimal WebAuthn Test
        </button>

        <button 
          onClick={async () => {
            try {
              const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
              setMessage(`Testing for ${isIOS ? "iOS" : "non-iOS"} device...`);
              
              const challengeBytes = new Uint8Array(32);
              window.crypto.getRandomValues(challengeBytes);
              
              const rpId = API_BASE_URL.replace(/^https?:\/\//, '').split(':')[0];
              
              // iOS specific options (simpler)
              const iosOptions = {
                challenge: challengeBytes,
                rp: {
                  id: rpId,
                  name: "iOS Test"
                },
                user: {
                  id: new Uint8Array([0, 1, 2, 3]),
                  name: "test@example.com",
                  displayName: "Test User"
                },
                pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                timeout: 60000,
                attestation: "none"
              };
              
              console.log(`Testing with ${isIOS ? "iOS" : "standard"} options:`, iosOptions);
              
              const credential = await navigator.credentials.create({
                publicKey: iosOptions
              });
              
              setMessage(`Success on ${isIOS ? "iOS" : "non-iOS"} device! Credential ID: ${credential.id.substring(0, 10)}...`);
            } catch (err) {
              setMessage(`Test failed: ${err.name} - ${err.message}`);
            }
          }}
          className="mt-2 p-2 bg-orange-100 text-orange-800 rounded text-xs"
        >
          Test iOS Safari Support
        </button>

        <button 
          onClick={() => {
            try {
              // Create a direct URL for desktop browsers - fix the URL format
              const hostname = API_BASE_URL.replace(/^https?:\/\//, '').split(':')[0];
              const url = `http://${hostname}:3000/mobile-auth/${sessionId}`;
              
              // Fallback copy method that works consistently
              const textArea = document.createElement('textarea');
              textArea.value = url;
              textArea.style.position = 'fixed';  // Avoid scrolling to bottom
              document.body.appendChild(textArea);
              textArea.focus();
              textArea.select();
              
              const successful = document.execCommand('copy');
              document.body.removeChild(textArea);
              
              if (successful) {
                setMessage(`URL copied to clipboard: ${url}\n\nPaste this in your desktop browser to test with Mac Touch ID or Windows Hello.`);
              } else {
                setMessage(`Failed to copy automatically. Here's the URL: ${url}`);
              }
            } catch (err) {
              // Fix the URL in the error message too
              const hostname = API_BASE_URL.replace(/^https?:\/\//, '').split(':')[0];
              setMessage(`Failed to copy URL: ${err.message}\nOpen this URL on your desktop: http://${hostname}:3000/mobile-auth/${sessionId}`);
            }
          }}
          className="mt-2 p-2 bg-indigo-100 text-indigo-800 rounded text-xs"
        >
          Copy Desktop Testing URL
        </button>

        <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-6">
          FastKey Authentication System • Secure Biometric Login
        </p>
      </div>
    </div>
  );
}