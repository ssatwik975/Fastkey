"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
};

export default function Home() {
  const [username, setUsername] = useState('');
  const [qrData, setQrData] = useState(null);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('initial'); // initial, loading, qr, success
  const [isRegistration, setIsRegistration] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [hasMobileDevices, setHasMobileDevices] = useState(false);
  const router = useRouter();
  
  const API_BASE_URL = getApiBaseUrl();

  // Socket initialization
  useEffect(() => {
    const socketClient = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });
    
    socketClient.on('connect_error', () => {
      setMessage('Connection issues. Please try again later.');
    });
    
    setSocket(socketClient);
    
    return () => {
      socketClient.disconnect();
    };
  }, [API_BASE_URL]);

  // Auth status polling
  useEffect(() => {
    if (!qrData || status !== 'qr') return;
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth-status/${qrData.sessionId}`);
        const data = await response.json();
        
        if (data.success) {
          clearInterval(pollInterval);
          handleAuthSuccess(data);
        }
      } catch (error) {
        // Silent error handling to avoid disrupting user experience
      }
    }, 3000);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [qrData, status, API_BASE_URL]);

  // Handle authentication success
  const handleAuthSuccess = useCallback((data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    localStorage.setItem('deviceId', data.deviceId || '');
    
    setStatus('success');
    setMessage(`${data.isRegistration ? 'Registration successful' : 'Welcome back'}, ${data.username}!`);
    
    // Smooth transition to dashboard
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  }, [router]);

  // Socket event handling
  useEffect(() => {
    if (!socket) return;

    const handleEvents = () => {
      // Auth success event (direct communication)
      socket.on('authSuccess', (data) => {
        handleAuthSuccess(data);
      });
      
      // Auth broadcast event (fallback communication)
      socket.on('authBroadcast', (data) => {
        if (qrData && qrData.sessionId === data.sessionId && data.success) {
          setTimeout(async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/auth-status/${qrData.sessionId}`);
              const authData = await response.json();
              
              if (authData.success) {
                handleAuthSuccess(authData);
              }
            } catch (error) {
              // Silent error handling
            }
          }, 1000);
        }
      });

      // QR code generation event
      socket.on('qrGenerated', (data) => {
        setQrData(data);
        setStatus('qr');
        setMessage('');
        setAuthMode(data.isRegistration ? 'register' : 'login');
      });
    };

    handleEvents();
    
    // Heartbeat for connection stability
    const heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat', { timestamp: Date.now() });
    }, 15000);
    
    return () => {
      socket.off('authSuccess');
      socket.off('authBroadcast');
      socket.off('qrGenerated');
      clearInterval(heartbeatInterval);
    };
  }, [socket, handleAuthSuccess, qrData, API_BASE_URL]);

  // Window message handler for cross-window communication
  useEffect(() => {
    const handleWindowMessage = (event) => {
      if (event.data && event.data.type === 'authSuccess' && qrData && event.data.sessionId === qrData.sessionId) {
        fetch(`${API_BASE_URL}/api/auth-status/${qrData.sessionId}`)
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              handleAuthSuccess(data);
            }
          })
          .catch(() => {
            // Silent error handling
          });
      }
    };
    
    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [qrData, API_BASE_URL, handleAuthSuccess]);

  // Auto-redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (token && username) {
      router.push('/dashboard');
    }
  }, [router]);

  // Check if username exists
  const checkUsername = async (username) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/check-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      
      const data = await response.json();
      const { exists, hasMobileDevices } = data;
      
      setHasMobileDevices(hasMobileDevices);
      
      // Validate username availability for registration
      if (isRegistration && exists) {
        setStatus('initial');
        setMessage('This username is already taken. Please choose another username or login instead.');
        return;
      }
      
      return true;
    } catch (error) {
      setMessage('Connection issues. Please try again later.');
      setStatus('initial');
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setMessage('Please enter a username');
      return;
    }
    
    setStatus('loading');
    setMessage(isRegistration ? 'Setting up your secure passkey...' : 'Preparing your secure login...');
    
    // Check username availability
    const isUsernameValid = await checkUsername(username);
    if (!isUsernameValid) return;
    
    try {
      // Request QR code generation through socket
      socket.emit('requestQR', { username, isRegistration });
    } catch (error) {
      setMessage('Connection issues. Please try again later.');
      setStatus('initial');
    }
  };

  // Handle QR code copy
  const copyQRLink = () => {
    if (!qrData?.url) return;
    
    try {
      navigator.clipboard.writeText(qrData.url);
      // Visual feedback instead of alert
      const linkElement = document.getElementById('qr-link');
      if (linkElement) {
        linkElement.classList.add('copied');
        setTimeout(() => linkElement.classList.remove('copied'), 2000);
      }
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = qrData.url;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-slate-900 flex flex-col items-center justify-center p-6">
      {/* Brand header */}
      <header className="w-full max-w-md mb-8 text-center">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">FastKey</h1>
        </motion.div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div 
          key={status}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Card header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-6 px-8">
              <h2 className="text-xl font-bold text-white mb-1">
                {status === 'initial' && (isRegistration ? 'Create Account' : 'Welcome Back')}
                {status === 'loading' && 'Connecting...'}
                {status === 'qr' && 'Scan with Your Phone'}
                {status === 'success' && 'Authentication Successful'}
              </h2>
              <p className="text-blue-100 text-sm">
                {status === 'initial' && (isRegistration ? 'Set up your biometric passkey' : 'Sign in using your biometric passkey')}
                {status === 'loading' && 'Preparing your secure authentication...'}
                {status === 'qr' && 'Use your mobile device to authenticate with biometrics'}
                {status === 'success' && 'You have been securely authenticated'}
              </p>
            </div>

            {/* Card content */}
            <div className="p-8">
              {status === 'initial' && (
                <div className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
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
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {isRegistration ? 'New account' : 'Existing account'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegistration(!isRegistration);
                          setMessage('');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        {isRegistration ? 'Sign in instead' : 'Create account'}
                      </button>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.625 2.655A9 9 0 0119 11a1 1 0 11-2 0 7 7 0 00-9.625-6.492 1 1 0 11-.75-1.853zM4.662 4.959A1 1 0 014.75 6.37 6.97 6.97 0 003 11a1 1 0 11-2 0 8.97 8.97 0 012.25-5.953 1 1 0 011.412-.088z" clipRule="evenodd" />
                      </svg>
                      {isRegistration ? 'Create Secure Passkey' : 'Continue with Passkey'}
                    </button>
                  </form>

                  {hasMobileDevices && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200 text-sm">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-blue-800 font-medium">Mobile App Available</span>
                      </div>
                      <p className="ml-7 mt-1 text-blue-700">
                        You have the FastKey mobile app registered. Check your app for a login notification.
                      </p>
                    </div>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      How It Works
                    </h3>
                    <ol className="text-xs space-y-1.5 text-blue-700 dark:text-blue-400 list-decimal list-inside pl-1">
                      <li>Enter your username and continue</li>
                      <li>Scan the QR code with your mobile device</li>
                      <li>Authenticate with your fingerprint or Face ID</li>
                      <li>You'll be automatically logged in securely</li>
                    </ol>
                  </div>
                </div>
              )}

              {status === 'loading' && (
                <div className="flex flex-col items-center py-8">
                  <div className="relative h-14 w-14">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900/40"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
                  </div>
                  <p className="mt-4 text-gray-600 dark:text-gray-300">{message}</p>
                </div>
              )}

              {status === 'qr' && qrData && (
                <div className="flex flex-col items-center">
                  <div className="relative bg-white p-4 rounded-xl shadow-md">
                    {/* Decorative corners */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500 rounded-tl"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500 rounded-tr"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500 rounded-bl"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500 rounded-br"></div>
                    
                    <QRCode 
                      value={qrData.url} 
                      size={220} 
                      level="H"
                      fgColor="#1E40AF"
                    />
                  </div>
                  
                  <div className="mt-6 w-full">
                    <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Scan this QR code with your mobile device and authenticate with your biometrics.
                      </p>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Alternatively, use this link on a device with biometric capabilities:
                      </p>
                      <div className="flex">
                        <input 
                          id="qr-link"
                          type="text"
                          readOnly
                          value={qrData.url}
                          className="flex-grow text-xs p-2 border border-gray-300 rounded-l-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 transition-colors"
                        />
                        <button
                          onClick={copyQRLink}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-r-md transition-colors flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                          </svg>
                          <span className="ml-1.5">Copy</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {status === 'success' && (
                <div className="flex flex-col items-center py-6">
                  <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 text-center">{message}</h3>
                  
                  {authMode === 'register' && (
                    <div className="mb-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-700 dark:text-green-300 text-center">
                      <p>Your biometric passkey has been registered successfully!</p>
                      <p className="mt-1">Next time, you can log in instantly with your fingerprint or Face ID.</p>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <div className="relative h-5 w-5 mr-2">
                      <div className="absolute inset-0 rounded-full border-2 border-blue-200 dark:border-blue-900/40"></div>
                      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 animate-spin"></div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Redirecting to your secure dashboard...</p>
                  </div>
                </div>
              )}
              
              {/* Error message display */}
              {message && status !== 'success' && status !== 'loading' && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 animate-pulse">
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <footer className="w-full max-w-md mt-8 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          FastKey • Enterprise-grade biometric authentication
        </p>
      </footer>

      {/* Add custom CSS for animations */}
      <style jsx>{`
        .copied {
          background-color: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.5);
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
}