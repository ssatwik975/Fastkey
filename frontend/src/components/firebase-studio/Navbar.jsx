import React from 'react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 relative">
                {/* Firebase Logo Approximation */}
                <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.89 15.67L10.5 2.67C10.67 2.33 11.17 2.33 11.33 2.67L12.5 5L3.89 15.67Z" fill="#FFCA28"/>
                    <path d="M12.5 5L15.67 11.33L3.89 15.67L12.5 5Z" fill="#FFA000"/>
                    <path d="M15.67 11.33L20.11 2.67C20.28 2.33 20.78 2.33 20.94 2.67L22.5 18.5L12.5 23L3.89 15.67L15.67 11.33Z" fill="#FFCA28"/>
                </svg>
            </div>
            <span className="text-xl font-medium text-white tracking-tight">Firebase Studio</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Docs</Link>
            <Link href="#" className="text-sm text-gray-300 hover:text-white transition-colors">Support</Link>
          </div>
        </div>

        <button className="bg-[#FFCA28] hover:bg-[#FFB300] text-black font-medium px-5 py-2 rounded-full text-sm transition-colors">
          Get Started
        </button>
      </div>
    </nav>
  );
}
