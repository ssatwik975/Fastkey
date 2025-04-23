"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import io from 'socket.io-client';
import Image from 'next/image';

const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
};

export default function Home() {
  const [username, setUsername] = useState('');
  const [qrData, setQrData] = useState(null);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('initial'); // initial, loading, qr, success
  const [isRegistration, setIsRegistration] = useState(false); // Add state for registration mode
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const router = useRouter();
  
  // Use dynamic API URL
  const API_BASE_URL = getApiBaseUrl();

  // Update your socket initialization
  useEffect(() => {
    // Initialize Socket.IO with polling fallback
    const socketClient = io(API_BASE_URL, {
      transports: ['websocket', 'polling'], // Allow polling as fallback
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });
    
    socketClient.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    setSocket(socketClient);
    
    return () => {
      socketClient.disconnect();
    };
  }, []);

  // Add this effect to poll for auth status
  useEffect(() => {
    if (!qrData || status !== 'qr') return;
    
    console.log('Setting up auth status polling');
    
    const pollInterval = setInterval(async () => {
      try {
        console.log(`Polling auth status for session ${qrData.sessionId}...`);
        const response = await fetch(`${API_BASE_URL}/api/auth-status/${qrData.sessionId}`);
        const data = await response.json();
        
        if (data.success) {
          console.log('Auth status poll returned success!', data);
          clearInterval(pollInterval);
          handleAuthSuccess(data);
        }
      } catch (error) {
        console.error('Error polling auth status:', error);
      }
    }, 3000); // Poll every 3 seconds
    
    return () => {
      console.log('Cleaning up auth status polling');
      clearInterval(pollInterval);
    };
  }, [qrData, status]);

  // Improve socket event handling
  useEffect(() => {
    if (!socket) return;

    console.log('Setting up socket event listeners with ID:', socket.id);

    const handleSocketEvent = (eventName, callback) => {
      // Remove any existing listeners for this event
      socket.off(eventName);
      
      // Add the new listener
      socket.on(eventName, (data) => {
        console.log(`Received ${eventName} event:`, data);
        callback(data);
      });
      
      // Return a cleanup function
      return () => socket.off(eventName);
    };

    // Handle socket connection events
    handleSocketEvent('connect', () => {
      console.log('Socket connected with ID:', socket.id);
    });

    handleSocketEvent('disconnect', () => {
      console.log('Socket disconnected, will try to reconnect');
    });

    // Auth success event (direct communication)
    handleSocketEvent('authSuccess', (data) => {
      console.log('Authentication successful (direct):', data);
      handleAuthSuccess(data);
    });
    
    // Auth broadcast event (fallback communication)
    handleSocketEvent('authBroadcast', (data) => {
      console.log('Auth broadcast received:', data);
      
      // If this broadcast matches our QR session, handle it
      if (qrData && qrData.sessionId === data.sessionId && data.success) {
        console.log('Broadcast matches our session:', qrData.sessionId);
        
        // We need to get the full auth data since broadcasts don't include tokens
        setTimeout(async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/api/auth-status/${qrData.sessionId}`);
            const authData = await response.json();
            
            if (authData.success) {
              handleAuthSuccess(authData);
            } else {
              // If HTTP fetch fails, just reload the page
              window.location.reload();
            }
          } catch (error) {
            console.error('Error fetching auth data after broadcast:', error);
            window.location.reload();
          }
        }, 1000);
      }
    });

    // QR code generation event
    handleSocketEvent('qrGenerated', (data) => {
      console.log('QR code generated:', data);
      setQrData(data);
      setStatus('qr');
      setMessage(''); // Clear the loading message
      setAuthMode(data.isRegistration ? 'register' : 'login');
    });

    // Create helper function for handling successful auth
    const handleAuthSuccess = (data) => {
      console.log('Processing successful authentication:', data);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('deviceId', data.deviceId || '');
      
      setStatus('success');
      setMessage(`${data.isRegistration ? 'Registration successful' : 'Welcome back'}, ${data.username}!`);
      
      // Redirect to dashboard after successful login
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    };

    return () => {
      console.log('Cleaning up all socket event listeners');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('authSuccess');
      socket.off('authBroadcast');
      socket.off('qrGenerated');
    };
  }, [socket, router, qrData]);

  // Add a heartbeat mechanism
  useEffect(() => {
    if (!socket) return;
    
    console.log('Setting up heartbeat mechanism');
    
    // Set up periodic heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat', { timestamp: Date.now() });
    }, 15000); // Every 15 seconds
    
    // Clean up interval on unmount
    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [socket]);

  // Add a window message listener for direct communication
  useEffect(() => {
    const handleWindowMessage = (event) => {
      console.log('Received window message:', event.data);
      
      // Handle auth success messages from mobile window
      if (event.data && event.data.type === 'authSuccess' && qrData) {
        if (event.data.sessionId === qrData.sessionId) {
          console.log('Received direct window message success for session:', event.data.sessionId);
          
          // Force fetch auth status
          fetch(`${API_BASE_URL}/api/auth-status/${qrData.sessionId}`)
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                handleAuthSuccess(data);
              }
            })
            .catch(error => {
              console.error('Error fetching auth data after window message:', error);
            });
        }
      }
    };
    
    window.addEventListener('message', handleWindowMessage);
    
    return () => {
      window.removeEventListener('message', handleWindowMessage);
    };
  }, [qrData]);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (token && username) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setMessage('Please enter a username');
      return;
    }
    
    setStatus('loading');
    setMessage(isRegistration ? 'Preparing registration...' : 'Generating QR code...');
    
    try {
      // Check if username exists
      const response = await fetch(`${API_BASE_URL}/api/check-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      
      const data = await response.json();
      
      // Validate username availability for registration
      if (isRegistration && data.exists) {
        setStatus('initial');
        setMessage('This username is already taken. Please choose another username or login instead.');
        return;
      }
      
      // Request QR code generation through socket
      socket.emit('requestQR', { 
        username,
        isRegistration // Pass registration mode to server
      });
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred. Please try again.');
      setStatus('initial');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full fade-in">
        <div className="card shadow-soft dark:shadow-none">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-100/50 to-secondary-100/50 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-xl z-0 opacity-40"></div>
          
          <div className="relative z-10">
            {/* Logo and Title */}
            <div className="flex flex-col items-center mb-8">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-md mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-center text-neutral-900 dark:text-white">FastKey Authentication</h1>
              <p className="text-sm text-center text-neutral-600 dark:text-neutral-400 mt-1">Secure login with biometric authentication</p>
            </div>
            
            {/* Content based on state */}
            {status === 'initial' && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="username" className="label">
                    Username
                  </label>
                  <div className="relative">
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
                
                {/* Toggle switch for registration/login */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {isRegistration ? 'Register a new account' : 'Login to existing account'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsRegistration(!isRegistration)}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {isRegistration ? 'Already have an account?' : 'Create an account'}
                  </button>
                </div>
                
                <button
                  type="submit"
                  className="btn btn-primary w-full py-2.5 flex justify-center items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.625 2.655A9 9 0 0119 11a1 1 0 11-2 0 7 7 0 00-9.625-6.492 1 1 0 11-.75-1.853zM4.662 4.959A1 1 0 014.75 6.37 6.97 6.97 0 003 11a1 1 0 11-2 0 8.97 8.97 0 012.25-5.953 1 1 0 011.412-.088z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M5 11a5 5 0 1110 0 1 1 0 11-2 0 3 3 0 10-6 0c0 1.677-.345 3.276-.968 4.729a1 1 0 11-1.838-.789A9.964 9.964 0 005 11zm8.921 2.012a1 1 0 01.831 1.145 19.86 19.86 0 01-.545 2.436 1 1 0 11-1.92-.558c.207-.713.371-1.445.49-2.192a1 1 0 011.144-.83z" clipRule="evenodd" />
                  </svg>
                  {isRegistration ? 'Register with Biometric Auth' : 'Continue with Biometric Auth'}
                </button>
                
                <div className="bg-primary-50 dark:bg-primary-900/30 rounded-lg p-4 border border-primary-100 dark:border-primary-800">
                  <h3 className="text-sm font-medium text-primary-800 dark:text-primary-300 flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    How it works
                  </h3>
                  <ol className="text-xs space-y-1 text-neutral-600 dark:text-neutral-400 list-decimal list-inside">
                    <li>Enter your username and click continue</li>
                    <li>Scan the QR code with your mobile device</li>
                    <li>Authenticate with your fingerprint or Face ID</li>
                    <li>You'll be automatically logged in here</li>
                  </ol>
                </div>
              </form>
            )}

            {status === 'loading' && (
              <div className="flex flex-col items-center py-8 scale-in">
                <div className="h-14 w-14 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin mb-4"></div>
                <p className="text-neutral-700 dark:text-neutral-300">{message}</p>
              </div>
            )}

            {status === 'qr' && qrData && (
              <div className="flex flex-col items-center scale-in">
                <p className="mb-5 text-center text-neutral-700 dark:text-neutral-300">
                  Scan this QR code with your mobile device
                </p>
                <div className="bg-white p-4 rounded-2xl shadow-soft mb-5 relative">
                  {/* QR code corners and code */}
                  <QRCode value={qrData.url} size={220} />
                </div>
                <div className="flex flex-col items-center space-y-2 w-full">
                  <div className="flex items-center p-3 bg-secondary-50 dark:bg-secondary-900/30 rounded-lg border border-secondary-100 dark:border-secondary-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary-600 dark:text-secondary-400 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      After scanning, authenticate with your fingerprint or Face ID
                    </p>
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-700 pt-3 text-center w-full">
                    <p>Or use this link to test on desktop:</p>
                    <div className="flex mt-2">
                      <input 
                        type="text"
                        readOnly
                        value={qrData.url}
                        className="text-xs p-2 border border-neutral-300 dark:border-neutral-700 rounded-l-md bg-neutral-50 dark:bg-neutral-800 flex-grow"
                      />
                      <button
                        onClick={() => {
                          try {
                            // Create a fallback copy method
                            const textArea = document.createElement('textarea');
                            textArea.value = qrData.url;
                            
                            // Make it invisible but keep it in the document flow
                            textArea.style.position = 'fixed';
                            textArea.style.opacity = '0';
                            document.body.appendChild(textArea);
                            
                            // Select and copy
                            textArea.focus();
                            textArea.select();
                            
                            const success = document.execCommand('copy');
                            
                            // Clean up
                            document.body.removeChild(textArea);
                            
                            if (success) {
                              alert("Link copied to clipboard!");
                            } else {
                              alert("Could not copy automatically. Link: " + qrData.url);
                            }
                          } catch (err) {
                            console.error('Copy error:', err);
                            alert("Could not copy. Link: " + qrData.url);
                          }
                        }}
                        className="text-xs p-2 bg-neutral-200 dark:bg-neutral-700 rounded-r-md hover:bg-neutral-300 dark:hover:bg-neutral-600"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
                {/* Added session details and refresh button */}
                <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
                  <p>Session ID: {qrData?.sessionId?.substring(0, 8)}...</p>
                  <p>Socket connected: {socket?.connected ? 'Yes' : 'No'}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-3 py-1 bg-neutral-200 dark:bg-neutral-700 rounded-md text-xs"
                  >
                    Refresh if stuck
                  </button>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center py-6 scale-in">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xl font-medium text-green-700 dark:text-green-400 text-center mb-2">{message}</p>
                
                {authMode === 'register' && (
                  <div className="mb-3 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-700 dark:text-green-300">
                    <p>Your biometric passkey has been registered successfully!</p>
                    <p>Next time, you can log in instantly with your fingerprint or Face ID.</p>
                  </div>
                )}
                
                <div className="flex items-center">
                  <svg className="animate-spin h-4 w-4 text-primary-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Redirecting to dashboard...</p>
                </div>
              </div>
            )}

            {message && status !== 'success' && status !== 'loading' && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg animate-pulse">
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
        
        <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-6">
          FastKey Authentication System • Secure Biometric Login
        </p>
      </div>
    </div>
  );
}