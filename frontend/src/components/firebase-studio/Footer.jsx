import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black pt-20 pb-10 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Innovate Section */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-orange-600 via-red-600 to-purple-900 p-12 md:p-24 text-center mb-20">
            <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
                    Innovate with Firebase
                </h2>
                <p className="text-lg text-white/90 max-w-2xl mx-auto mb-10">
                    For years, millions of you have relied on Firebase to accelerate your app development and run your apps with confidence.
                </p>
                <button className="bg-white text-black font-medium px-8 py-3 rounded-full hover:bg-gray-100 transition-colors">
                    Try Firebase Studio
                </button>
            </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-20">
            <div>
                <h3 className="text-white font-medium mb-6">Learn</h3>
                <ul className="space-y-4 text-sm text-gray-400">
                    <li><Link href="#" className="hover:text-white">Developer guides</Link></li>
                    <li><Link href="#" className="hover:text-white">SDK & API reference</Link></li>
                    <li><Link href="#" className="hover:text-white">Samples</Link></li>
                    <li><Link href="#" className="hover:text-white">Libraries</Link></li>
                    <li><Link href="#" className="hover:text-white">GitHub</Link></li>
                </ul>
            </div>
            <div>
                <h3 className="text-white font-medium mb-6">Stay connected</h3>
                <ul className="space-y-4 text-sm text-gray-400">
                    <li><Link href="#" className="hover:text-white">Check out the blog</Link></li>
                    <li><Link href="#" className="hover:text-white">Find us on Reddit</Link></li>
                    <li><Link href="#" className="hover:text-white">Follow on X</Link></li>
                    <li><Link href="#" className="hover:text-white">Subscribe on YouTube</Link></li>
                </ul>
            </div>
            <div>
                <h3 className="text-white font-medium mb-6">Support</h3>
                <ul className="space-y-4 text-sm text-gray-400">
                    <li><Link href="#" className="hover:text-white">Contact support</Link></li>
                    <li><Link href="#" className="hover:text-white">Stack Overflow</Link></li>
                    <li><Link href="#" className="hover:text-white">Slack community</Link></li>
                    <li><Link href="#" className="hover:text-white">Release notes</Link></li>
                </ul>
            </div>
            <div>
                <h3 className="text-white font-medium mb-6">Tools for developers</h3>
                <ul className="space-y-4 text-sm text-gray-400">
                    <li><Link href="#" className="hover:text-white">Android</Link></li>
                    <li><Link href="#" className="hover:text-white">Chrome</Link></li>
                    <li><Link href="#" className="hover:text-white">Firebase</Link></li>
                    <li><Link href="#" className="hover:text-white">Google Cloud Platform</Link></li>
                    <li><Link href="#" className="hover:text-white">All products</Link></li>
                </ul>
            </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
                <span className="text-xl font-medium text-gray-400">Google</span>
                <span className="text-xl text-gray-600">for Developers</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-500">
                <Link href="#" className="hover:text-white">Terms</Link>
                <Link href="#" className="hover:text-white">Privacy</Link>
                <Link href="#" className="hover:text-white">Manage Cookies</Link>
            </div>
        </div>
      </div>
    </footer>
  );
}
