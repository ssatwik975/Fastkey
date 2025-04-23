"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import io from 'socket.io-client';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [protectedData, setProtectedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication first before any operations
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    console.log("Auth check - Token exists:", !!token, "Username exists:", !!username);
    
    if (!token || !username) {
      console.log("Missing auth credentials, redirecting to login");
      router.push('/');
      return;
    }
    
    // Mark auth as checked so we don't redirect unnecessarily
    setAuthChecked(true);
    setUser({ username });
  }, [router]);

  // Initialize socket connection only after auth is confirmed
  useEffect(() => {
    if (!authChecked || !user) return;
    
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const deviceId = localStorage.getItem('deviceId');
    
    // Use the consistent API base URL from environment
    const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
    console.log("Connecting to socket at:", API_BASE_URL);
    
    const newSocket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      auth: { token } // Add token to socket connection for auth
    });
    
    newSocket.on('connect', () => {
      console.log("Socket connected successfully");
    });
    
    newSocket.on('connect_error', (err) => {
      console.error("Socket connection error:", err);
    });
    
    setSocket(newSocket);
    
    // Associate this socket with the user
    if (username && deviceId) {
      newSocket.emit('associate', { username, deviceId });
    }
    
    // Clean up on unmount
    return () => {
      console.log("Disconnecting socket");
      newSocket.disconnect();
    };
  }, [authChecked, user]);

  // Fetch protected data on component mount with correct API URL handling
  useEffect(() => {
    async function fetchProtectedData() {
      if (!authChecked || !user) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        // Use the consistent API base URL from environment
        const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
        console.log("Fetching protected data from:", `${API_BASE_URL}/api/protected`);
        
        const response = await fetch(`${API_BASE_URL}/api/protected`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include' // Include cookies if any
        });
        
        console.log("Protected API status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Protected data received:", data);
          setProtectedData(data);
          setLoading(false);
        } else if (response.status === 401) {
          console.error('Authentication failed with 401 status');
          // Add a small delay before redirect to avoid infinite loops
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('deviceId');
            router.push('/');
          }, 500);
        } else {
          console.error('Protected API returned error status:', response.status);
          // Don't redirect for other errors, just show an error state
          setProtectedData({ error: `Error ${response.status}: Could not fetch protected data` });
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching protected data:', error);
        setProtectedData({ error: error.message });
        setLoading(false);
      }
    }
    
    fetchProtectedData();
  }, [authChecked, user, router]);

  const handleLogout = () => {
    console.log("Logging out");
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('deviceId');
    
    // Add a small delay to ensure localStorage is cleared
    setTimeout(() => {
      router.push('/');
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <div className="scale-in">
          <div className="relative h-14 w-14 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900/40"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 text-center">Loading your secure dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">FastKey</span>
              </div>
              
              {/* Desktop navigation tabs */}
              <nav className="hidden md:ml-8 md:flex space-x-1">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'overview' ? 
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 
                    'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'}`}
                >
                  Overview
                </button>
                <button 
                  onClick={() => setActiveTab('security')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'security' ? 
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 
                    'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'}`}
                >
                  Security
                </button>
                <button 
                  onClick={() => setActiveTab('devices')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'devices' ? 
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 
                    'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'}`}
                >
                  Devices
                </button>
              </nav>
            </div>
            
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 rounded-full px-3 py-1 mr-4">
                  <div className="h-7 w-7 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center mr-2 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {user?.username}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707L11.414 2.414A1 1 0 0010.707 2H4a1 1 0 00-1 1z" clipRule="evenodd" />
                    <path d="M10 12a1 1 0 00-1-1H6a1 1 0 100 2h3a1 1 0 001-1zm0-4a1 1 0 00-1-1H6a1 1 0 100 2h3a1 1 0 001-1z" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Welcome card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {user?.username}!</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Your account is protected with biometric authentication</p>
                  
                  <div className="mt-4 inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Biometric security active</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Account activity</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-md bg-blue-600 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Last login</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">Today at {new Date().toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-md bg-blue-600 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1 1-1-.257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Biometric security</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">Enabled and active</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-md bg-blue-600 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v5a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Recovery options</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">Not configured</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Protected data card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 overflow-hidden">
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Protected Data</h3>
              </div>
              
              {protectedData && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 overflow-x-auto">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(protectedData, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 dark:text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Server data</h4>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                      This data is securely retrieved from the server using your authenticated session. Only you can access this information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Security tips card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 overflow-hidden">
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Best Practices</h3>
              </div>
              
              <ul className="mt-2 space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Keep your device's biometric security up to date</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Make sure your fingerprint or facial recognition system is using the latest software and security patches.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Don't share your QR codes with others</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Your authentication QR codes are personal and should never be shared, even with people you trust.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Always logout when using shared devices</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      If you're using a public or shared computer, make sure to log out completely when you're done.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Set up a device passcode as a backup</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      While biometrics are secure, having a strong device passcode provides an additional layer of security.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
        
        {activeTab === 'security' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 overflow-hidden"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security Settings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Manage your security settings and authentication methods here.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6.625 2.655A9 9 0 0119 11a1 1 0 11-2 0 7 7 0 00-9.625-6.492 1 1 0 11-.75-1.853zM4.662 4.959A1 1 0 014.75 6.37 6.97 6.97 0 003 11a1 1 0 11-2 0 8.97 8.97 0 012.25-5.953 1 1 0 011.412-.088z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Biometric Authentication</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Unlock with fingerprint or Face ID
                    </p>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                    Enabled
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Additional security layer for your account
                    </p>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    Not Available
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Recovery Options</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Set up account recovery methods
                    </p>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    Configure
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {activeTab === 'devices' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 overflow-hidden"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Registered Devices</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Devices that have been registered with your biometric credentials.
            </p>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Current Device</h4>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-md bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white">This Device</h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Added on {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 mr-2">
                      Active
                    </span>
                    <button className="inline-flex items-center p-1 border border-transparent rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Add new devices</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    To register a new device, log in on that device and it will automatically be added to your account.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 shadow-md mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              FastKey Authentication System • Secure Biometric Login
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              v1.0.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}