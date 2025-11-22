'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Fingerprint } from 'lucide-react';

export default function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-slate-950/50 border-b border-slate-800/50"
    >
      <div className="flex items-center gap-2">
        <div className="p-2 bg-blue-600/20 rounded-lg">
          <Fingerprint className="w-6 h-6 text-blue-500" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
          FastKey
        </span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
        <Link href="#features" className="hover:text-white transition-colors">Features</Link>
        <Link href="#security" className="hover:text-white transition-colors">Security</Link>
        <Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link>
        <Link href="https://github.com/ssatwik975/Fastkey" target="_blank" className="hover:text-white transition-colors">GitHub</Link>
      </div>

      <div className="flex items-center gap-4">
        <Link 
          href="#auth"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-full transition-all shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] hover:shadow-[0_0_25px_-5px_rgba(37,99,235,0.6)]"
        >
          Get Started
        </Link>
      </div>
    </motion.nav>
  );
}
