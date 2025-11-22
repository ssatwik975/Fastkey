"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import io from 'socket.io-client';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { Shield, Smartphone, Activity, Lock, AlertCircle, CheckCircle, User } from 'lucide-react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [protectedData, setProtectedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (!token || !username) {
      router.push('/');
      return;
    }
    
    setAuthChecked(true);
    setUser({ username });
  }, [router]);

  useEffect(() => {
    if (!authChecked || !user) return;
    
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const deviceId = localStorage.getItem('deviceId');
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
    
    const newSocket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      auth: { token }
    });
    
    setSocket(newSocket);
    
    if (username && deviceId) {
      newSocket.emit('associate', { username, deviceId });
    }
    
    return () => {
      newSocket.disconnect();
    };
  }, [authChecked, user]);

  useEffect(() => {
    async function fetchProtectedData() {
      if (!authChecked || !user) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
        
        const response = await fetch(`${API_BASE_URL}/api/protected`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setProtectedData(data);
          setLoading(false);
        } else if (response.status === 401) {
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('deviceId');
            router.push('/');
          }, 500);
        } else {
          setProtectedData({ error: `Error ${response.status}: Could not fetch protected data` });
          setLoading(false);
        }
      } catch (error) {
        setProtectedData({ error: error.message });
        setLoading(false);
      }
    }
    
    fetchProtectedData();
  }, [authChecked, user, router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('deviceId');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400">Loading secure dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      
      <main className="flex-1 ml-64 p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400">Welcome back, {user?.username}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Secure Connection
            </div>
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
              <User className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </header>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SpotlightCard className="p-6 border-slate-800 bg-slate-900/50">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <Activity className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Last Login</p>
                      <p className="text-lg font-semibold text-white">Just now</p>
                    </div>
                  </div>
                </SpotlightCard>
                
                <SpotlightCard className="p-6 border-slate-800 bg-slate-900/50">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-emerald-500/10 rounded-lg">
                      <Shield className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Security Status</p>
                      <p className="text-lg font-semibold text-white">Protected</p>
                    </div>
                  </div>
                </SpotlightCard>

                <SpotlightCard className="p-6 border-slate-800 bg-slate-900/50">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <Smartphone className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Active Devices</p>
                      <p className="text-lg font-semibold text-white">1 Device</p>
                    </div>
                  </div>
                </SpotlightCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-blue-400" />
                    Protected Data
                  </h3>
                  {protectedData && (
                    <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 font-mono text-sm text-slate-300 overflow-x-auto">
                      <pre>{JSON.stringify(protectedData, null, 2)}</pre>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    Security Checklist
                  </h3>
                  <div className="space-y-4">
                    {[
                      "Biometric authentication enabled",
                      "Device encryption active",
                      "Latest security patches installed",
                      "No suspicious activity detected"
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-slate-300">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Security Settings</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-slate-800 rounded-lg bg-slate-950/50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Shield className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Biometric Login</h4>
                      <p className="text-sm text-slate-400">Use fingerprint or FaceID to login</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-sm rounded-full border border-emerald-500/20">
                    Enabled
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Connected Devices</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-800 rounded-lg bg-slate-950/50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Smartphone className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Current Device</h4>
                      <p className="text-sm text-slate-400">Web Browser • {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-blue-500/10 text-blue-400 text-sm rounded-full border border-blue-500/20">
                    Active Now
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
