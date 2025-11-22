'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
};

export default function AuthWidget() {
  const [username, setUsername] = useState('');
  const [qrData, setQrData] = useState(null);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('initial'); // initial, loading, qr, success
  const [isRegistration, setIsRegistration] = useState(false);
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
        // Silent error handling
      }
    }, 3000);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [qrData, status, API_BASE_URL]);

  const handleAuthSuccess = useCallback((data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    localStorage.setItem('deviceId', data.deviceId || '');
    
    setStatus('success');
    setMessage(`${data.isRegistration ? 'Registration successful' : 'Welcome back'}, ${data.username}!`);
    
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  }, [router]);

  useEffect(() => {
    if (!socket) return;

    const handleEvents = () => {
      socket.on('authSuccess', (data) => {
        handleAuthSuccess(data);
      });
      
      socket.on('authBroadcast', (data) => {
        if (qrData && qrData.sessionId === data.sessionId && data.success) {
          setTimeout(async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/auth-status/${qrData.sessionId}`);
              const statusData = await response.json();
              if (statusData.success) {
                handleAuthSuccess(statusData);
              }
            } catch (error) {
              console.error("Error verifying auth status:", error);
            }
          }, 500);
        }
      });
    };

    handleEvents();

    return () => {
      socket.off('authSuccess');
      socket.off('authBroadcast');
    };
  }, [socket, qrData, API_BASE_URL, handleAuthSuccess]);

  const startAuth = async (mode) => {
    if (!username.trim()) {
      setMessage('Please enter a username');
      return;
    }

    setStatus('loading');
    setMessage('');
    setIsRegistration(mode === 'register');

    try {
      const endpoint = mode === 'register' ? '/api/register/init' : '/api/login/init';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (data.sessionId) {
        setQrData(data);
        setStatus('qr');
        
        if (socket) {
          socket.emit('joinSession', data.sessionId);
        }
      } else {
        setStatus('initial');
        setMessage(data.message || 'Initialization failed');
      }
    } catch (error) {
      setStatus('initial');
      setMessage('Network error. Please check your connection.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Get Started</h3>
        <p className="text-slate-400">Enter your username to authenticate securely</p>
      </div>

      <AnimatePresence mode="wait">
        {status === 'initial' && (
          <motion.div
            key="initial"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Enter your username"
              />
            </div>
            
            {message && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => startAuth('login')}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => startAuth('register')}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                Register
              </button>
            </div>
          </motion.div>
        )}

        {status === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-400">Connecting to secure server...</p>
          </motion.div>
        )}

        {status === 'qr' && qrData && (
          <motion.div
            key="qr"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center"
          >
            <div className="bg-white p-4 rounded-xl mb-6 shadow-lg">
              <QRCode value={JSON.stringify(qrData)} size={200} />
            </div>
            
            <div className="flex items-center gap-3 text-slate-300 mb-6">
              <Smartphone className="w-5 h-5 text-blue-400" />
              <span>Scan with FastKey App</span>
            </div>

            <button
              onClick={() => setStatus('initial')}
              className="text-sm text-slate-500 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8"
          >
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Success!</h4>
            <p className="text-slate-400 text-center">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
