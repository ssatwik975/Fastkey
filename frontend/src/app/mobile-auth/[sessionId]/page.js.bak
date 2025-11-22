"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Mobile WebAuthn Setup
const setupMobileWebAuthn = () => {
  console.log("Setting up mobile WebAuthn environment");

  const isAndroid = /android/i.test(navigator.userAgent);
  const isChrome = /chrome|chromium/i.test(navigator.userAgent);
  const isChromeOnAndroid = isAndroid && isChrome;

  console.log("Environment detection:", { isAndroid, isChrome, isChromeOnAndroid });

  if (isChromeOnAndroid) {
    const originalPublicKeyCredential = window.PublicKeyCredential;

    const hasIncompleteImplementation =
      typeof window.PublicKeyCredential !== "undefined" &&
      (typeof navigator.credentials === "undefined" ||
        typeof navigator.credentials.create !== "function" ||
        typeof navigator.credentials.get !== "function");

    console.log("Implementation check:", {
      hasPublicKeyCredential: typeof window.PublicKeyCredential !== "undefined",
      hasNavigatorCredentials: typeof navigator.credentials !== "undefined",
      hasCreateMethod: typeof navigator.credentials?.create === "function",
      hasGetMethod: typeof navigator.credentials?.get === "function",
      hasIncompleteImplementation,
    });

    if (hasIncompleteImplementation) {
      console.warn("Detected incomplete WebAuthn implementation, applying fixes");

      if (typeof navigator.credentials === "undefined") {
        navigator.credentials = {};
      }

      if (typeof navigator.credentials.create !== "function") {
        navigator.credentials.create = async function (options) {
          console.log("Using polyfilled credentials.create()");
          throw new Error(
            "This browser doesn't support WebAuthn properly. Please try using a different browser like Chrome, Firefox, or Safari."
          );
        };
      }

      if (typeof navigator.credentials.get !== "function") {
        navigator.credentials.get = async function (options) {
          console.log("Using polyfilled credentials.get()");
          throw new Error(
            "This browser doesn't support WebAuthn properly. Please try using a different browser like Chrome, Firefox, or Safari."
          );
        };
      }
    }
  }

  return { isChromeOnAndroid };
};

const logDebugInfo = (step, error) => {
  console.error(`WebAuthn ${step} error:`, error);

  if (error.name === "NotAllowedError") {
    return "User declined the authentication request or the operation timed out.";
  } else if (error.name === "SecurityError") {
    return "The origin is not secure (must be HTTPS, except on localhost).";
  } else if (error.name === "NotSupportedError") {
    return "This device or browser doesn't support WebAuthn or the requested authenticator.";
  } else if (error.name === "AbortError") {
    return "The operation was aborted.";
  }

  return error.message;
};

const mobileBrowserWorkaround = () => {
  console.log("Applying mobile browser workaround");

  const { isChromeOnAndroid } = setupMobileWebAuthn();

  if (typeof window.PublicKeyCredential === "undefined") {
    console.log("Creating full PublicKeyCredential polyfill");

    window.PublicKeyCredential = function () {};

    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = async function () {
      console.log("Using polyfilled capability detection");
      return false;
    };
  }

  if (isChromeOnAndroid) {
    console.log("Applying Chrome on Android specific workarounds");
  }

  console.log("Final PublicKeyCredential status:", {
    exists: !!window.PublicKeyCredential,
    capabilityDetectionExists:
      typeof window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable === "function",
    navigatorCredentialsExists: typeof navigator.credentials !== "undefined",
    createExists: typeof navigator.credentials?.create === "function",
    getExists: typeof navigator.credentials?.get === "function",
  });
};

const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
};

const notifyDesktop = async (sessionId, username, success, API_BASE_URL) => {
  try {
    const effectiveSessionId = sessionStorage.getItem("overrideSessionId") || sessionId;
    await fetch(`${API_BASE_URL}/api/notify-desktop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: effectiveSessionId,
        username,
        success,
      }),
    });
  } catch (err) {
    console.error("Failed to send desktop notification:", err);
  }
};

export default function MobileAuth() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [isForceRegistration, setIsForceRegistration] = useState(false);
  const [deviceSupport, setDeviceSupport] = useState({
    webauthnSupported: null,
    biometricsAvailable: null,
  });
  const { sessionId } = useParams();
  const API_BASE_URL = getApiBaseUrl();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const register = params.get("register");
      const urlUsername = params.get("username");

      if (register === "true") {
        setIsForceRegistration(true);
      }

      if (urlUsername) {
        setUsername(urlUsername);
      }
    }
  }, []);

  useEffect(() => {
    async function checkSession() {
      try {
        mobileBrowserWorkaround();

        if (!sessionId) {
          setStatus("error");
          setMessage("Invalid session");
          return;
        }

        try {
          const verifyResponse = await fetch(`${API_BASE_URL}/api/verify-session`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId }),
          });

          const verifyResult = await verifyResponse.json();

          if (!verifyResult.valid) {
            if (verifyResult.newSessionId) {
              sessionStorage.setItem("overrideSessionId", verifyResult.newSessionId);
            }
            setMessage("Warning: Your session may be invalid. Authentication might fail.");
          }
        } catch (verifyError) {
          setMessage("Warning: Unable to verify session. Authentication might fail.");
        }

        const webauthnSupported = typeof window.PublicKeyCredential !== "undefined";
        setDeviceSupport((prev) => ({ ...prev, webauthnSupported }));

        if (!webauthnSupported) {
          setStatus("error");
          setMessage(
            "Your browser doesn't support WebAuthn. Please try a modern browser like Chrome, Safari, or Firefox."
          );
          return;
        }

        if (window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
          try {
            const biometricsAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            setDeviceSupport((prev) => ({ ...prev, biometricsAvailable }));
          } catch (e) {
            console.error("Error checking biometric availability:", e);
          }
        }

        setStatus("ready");

        if (isForceRegistration) {
          setMessage("Register a new passkey for seamless login");
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setStatus("error");
        setMessage("Failed to validate session");
      }
    }

    checkSession();
  }, [sessionId, isForceRegistration, API_BASE_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setMessage("Please enter a username");
      return;
    }

    setStatus("processing");
    setMessage("Processing...");

    try {
      const checkResponse = await fetch(`${API_BASE_URL}/api/check-username`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const { exists } = await checkResponse.json();

      if (isForceRegistration) {
        if (exists) {
          setStatus("error");
          setMessage("This username is already taken. Please choose another username.");
          return;
        }
        await startRegistration();
      } else {
        setIsNewUser(!exists);
        if (exists) {
          await startAuthentication();
        } else {
          await startRegistration();
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus("error");
      setMessage("An error occurred. Please try again.");
    }
  };

  const startRegistration = async () => {
    try {
      setMessage("Initializing biometric enrollment...");

      mobileBrowserWorkaround();

      const effectiveSessionId = sessionStorage.getItem("overrideSessionId") || sessionId;

      let optionsResponse;
      try {
        optionsResponse = await fetch(`${API_BASE_URL}/api/webauthn/registration-options`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            sessionId: effectiveSessionId,
            rpId: API_BASE_URL.replace(/^https?:\/\//, "").split(":")[0],
            isAndroidChrome: /Android.*Chrome/.test(navigator.userAgent),
          }),
        });

        if (!optionsResponse.ok) {
          const errorData = await optionsResponse.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Server returned ${optionsResponse.status}: ${optionsResponse.statusText}`
          );
        }
      } catch (fetchError) {
        setStatus("error");
        setMessage(`Failed to start registration: ${fetchError.message}. Please try again.`);
        return;
      }

      const options = await optionsResponse.json();

      options.challenge = base64urlToArrayBuffer(options.challenge);

      if (options.excludeCredentials) {
        options.excludeCredentials = options.excludeCredentials.map((credential) => ({
          ...credential,
          id: base64urlToArrayBuffer(credential.id),
        }));
      }

      options.user.id = base64urlToArrayBuffer(options.user.id);

      const isAndroidChrome =
        navigator.userAgent.includes("Android") && /chrome|chromium/i.test(navigator.userAgent);
      if (isAndroidChrome) {
        options.authenticatorSelection = {
          authenticatorAttachment: "platform",
          requireResidentKey: false,
          userVerification: "discouraged",
        };
      }

      setMessage("Waiting for your fingerprint or biometric verification...");
      const credential = await navigator.credentials.create({
        publicKey: options,
      });

      const credentialForServer = {
        id: credential.id,
        rawId: arrayBufferToBase64url(credential.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64url(credential.response.clientDataJSON),
          attestationObject: arrayBufferToBase64url(credential.response.attestationObject),
          publicKey: credential.response.getPublicKey
            ? arrayBufferToBase64url(credential.response.getPublicKey())
            : null,
          publicKeyAlgorithm: credential.response.getPublicKeyAlgorithm
            ? credential.response.getPublicKeyAlgorithm()
            : null,
          transports: credential.response.getTransports ? credential.response.getTransports() : null,
          authenticatorData: credential.response.authenticatorData
            ? arrayBufferToBase64url(credential.response.authenticatorData)
            : null,
        },
        type: credential.type,
      };

      const verificationResponse = await fetch(`${API_BASE_URL}/api/webauthn/registration-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          sessionId: effectiveSessionId,
          credential: credentialForServer,
        }),
      });

      if (!verificationResponse.ok) {
        throw new Error("Registration verification failed");
      }

      const verificationResult = await verificationResponse.json();

      if (verificationResult.success) {
        setStatus("success");
        setMessage(
          "Registration successful! You can now use your biometric passkey for future logins."
        );

        localStorage.setItem("token", verificationResult.token);
        localStorage.setItem("username", username);
        localStorage.setItem("deviceId", verificationResult.deviceId || "");

        await notifyDesktop(effectiveSessionId, username, true, API_BASE_URL);
      } else {
        throw new Error("Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);

      if (!navigator.onLine) {
        setStatus("error");
        setMessage("Network error. Please check your internet connection.");
        return;
      }

      if (error.message.includes("Failed to fetch") || error.message.includes("Network request failed")) {
        setStatus("error");
        setMessage("Could not connect to the authentication server. Please try again later.");
        return;
      }

      const errorDetails = logDebugInfo("registration", error);
      setStatus("error");
      setMessage(`Registration failed: ${errorDetails}`);
    }
  };

  const startAuthentication = async () => {
    try {
      setMessage("Initializing authentication...");

      mobileBrowserWorkaround();

      const effectiveSessionId = sessionStorage.getItem("overrideSessionId") || sessionId;

      const rpId = API_BASE_URL.replace(/^https?:\/\//, "").split(":")[0];

      const isAndroidChrome =
        navigator.userAgent.includes("Android") && /chrome|chromium/i.test(navigator.userAgent);

      const optionsResponse = await fetch(`${API_BASE_URL}/api/webauthn/authentication-options`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          sessionId: effectiveSessionId,
          rpId: rpId,
          isAndroidChrome,
        }),
      });

      if (!optionsResponse.ok) {
        throw new Error("Failed to get authentication options");
      }

      const options = await optionsResponse.json();

      options.challenge = base64urlToArrayBuffer(options.challenge);

      if (options.allowCredentials) {
        options.allowCredentials = options.allowCredentials.map((credential) => ({
          ...credential,
          id: base64urlToArrayBuffer(credential.id),
        }));
      }

      if (isAndroidChrome) {
        options.userVerification = "discouraged";
      }

      setMessage("Waiting for your fingerprint or biometric verification...");
      const credential = await navigator.credentials.get({
        publicKey: options,
      });

      const credentialForServer = {
        id: credential.id,
        rawId: arrayBufferToBase64url(credential.rawId),
        response: {
          clientDataJSON: arrayBufferToBase64url(credential.response.clientDataJSON),
          authenticatorData: arrayBufferToBase64url(credential.response.authenticatorData),
          signature: arrayBufferToBase64url(credential.response.signature),
          userHandle: credential.response.userHandle
            ? arrayBufferToBase64url(credential.response.userHandle)
            : null,
        },
        type: credential.type,
      };

      const verificationResponse = await fetch(`${API_BASE_URL}/api/webauthn/authentication-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          sessionId: effectiveSessionId,
          credential: credentialForServer,
          rpId: API_BASE_URL.replace(/^https?:\/\//, "").split(":")[0],
        }),
      });

      if (!verificationResponse.ok) {
        throw new Error("Authentication verification failed");
      }

      const verificationResult = await verificationResponse.json();

      if (verificationResult.success) {
        setStatus("success");
        setMessage(
          "Authentication successful! You can now close this page and continue on your desktop."
        );

        localStorage.setItem("token", verificationResult.token);
        localStorage.setItem("username", username);
        localStorage.setItem("deviceId", verificationResult.deviceId || "");

        await notifyDesktop(effectiveSessionId, username, true, API_BASE_URL);
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error) {
      console.error("Authentication error:", error);

      if (!navigator.onLine) {
        setStatus("error");
        setMessage("Network error. Please check your internet connection.");
        return;
      }

      if (error.message.includes("Failed to fetch") || error.message.includes("Network request failed")) {
        setStatus("error");
        setMessage("Could not connect to the authentication server. Please try again later.");
        return;
      }

      const errorDetails = logDebugInfo("authentication", error);
      setStatus("error");
      setMessage(`Authentication failed: ${errorDetails}`);
    }
  };

  function arrayBufferToBase64url(buffer) {
    const bytes = new Uint8Array(buffer);
    let str = "";

    for (const byte of bytes) {
      str += String.fromCharCode(byte);
    }

    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function base64urlToArrayBuffer(base64url) {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");

    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padLength);

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
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-6 px-8 flex items-center">
                <div className="mr-5 h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {status === "loading" && "Initializing..."}
                    {status === "ready" &&
                      (isForceRegistration ? "Register Passkey" : "Mobile Authentication")}
                    {status === "processing" && "Processing..."}
                    {status === "success" && "Success!"}
                    {status === "error" && "Oops!"}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {status === "loading" && "Setting up secure connection..."}
                    {status === "ready" &&
                      (isForceRegistration
                        ? "Create a new biometric passkey"
                        : "Authenticate with your biometrics")}
                    {status === "processing" && "Verifying your credentials..."}
                    {status === "success" && "Authentication completed successfully"}
                    {status === "error" && "Something went wrong"}
                  </p>
                </div>
              </div>

              <div className="p-8">
                {status === "loading" && (
                  <div className="flex flex-col items-center py-6">
                    <div className="relative h-14 w-14">
                      <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900/40"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">
                      {message || "Initializing secure connection..."}
                    </p>
                  </div>
                )}

                {status === "ready" && (
                  <div className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label
                          htmlFor="username"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Username
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Enter your username"
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.625 2.655A9 9 0 0119 11a1 1 0 11-2 0 7 7 0 00-9.625-6.492 1 1 0 11-.75-1.853zM4.662 4.959A1 1 0 014.75 6.37 6.97 6.97 0 003 11a1 1 0 11-2 0 8.97 8.97 0 012.25-5.953 1 1 0 011.412-.088z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {isForceRegistration ? "Register with Fingerprint" : "Continue with Fingerprint"}
                      </button>
                    </form>

                    {!deviceSupport.webauthnSupported && (
                      <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                        <div className="flex items-start">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-red-500 mr-3 mt-0.5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div>
                            <h4 className="text-sm font-semibold text-red-700 dark:text-red-400">
                              Browser Compatibility Issue
                            </h4>
                            <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                              Your browser doesn't fully support the WebAuthn standard needed for biometric
                              authentication.
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

                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Your device will prompt you to use your fingerprint
                      </h3>
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        When you continue, your device will ask for biometric verification to securely{" "}
                        {isForceRegistration ? "register" : "authenticate"} your account.
                      </p>
                    </div>
                  </div>
                )}

                {status === "processing" && (
                  <div className="flex flex-col items-center py-6">
                    <div className="relative h-14 w-14">
                      <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900/40"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">{message}</p>
                  </div>
                )}

                {status === "success" && (
                  <div className="flex flex-col items-center py-6">
                    <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-green-600 dark:text-green-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>

                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 text-center">
                      {message}
                    </h3>

                    <div className="mb-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-700 dark:text-green-300 text-center">
                      <p>
                        {isNewUser || isForceRegistration
                          ? "Passkey registered successfully"
                          : "Authentication successful"}
                      </p>
                      <p className="mt-1">
                        Your desktop browser should update automatically. You can close this window.
                      </p>
                    </div>
                  </div>
                )}

                {status === "error" && (
                  <div className="flex flex-col items-center py-6">
                    <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-red-600 dark:text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>

                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 text-center">
                      Error
                    </h3>
                    <p className="text-center text-gray-600 dark:text-gray-300 mb-4">{message}</p>

                    <button
                      onClick={() => setStatus("ready")}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <footer className="w-full max-w-md mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            FastKey • Enterprise-grade biometric authentication
          </p>
        </footer>
      </div>
    </div>
  );
}