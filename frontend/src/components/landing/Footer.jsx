import Link from 'next/link';
import { Fingerprint, Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Fingerprint className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-xl font-bold text-white">FastKey</span>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed">
              The next generation of secure, private, and fast biometric authentication. 
              Open source and built for the future.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="#features" className="hover:text-blue-400 transition-colors">Features</Link></li>
              <li><Link href="#security" className="hover:text-blue-400 transition-colors">Security</Link></li>
              <li><Link href="#download" className="hover:text-blue-400 transition-colors">Download App</Link></li>
              <li><Link href="/docs" className="hover:text-blue-400 transition-colors">Documentation</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="https://github.com/ssatwik975/Fastkey" className="hover:text-blue-400 transition-colors">GitHub</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Discord</Link></li>
              <li><Link href="#" className="hover:text-blue-400 transition-colors">Twitter</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} FastKey. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-slate-500 hover:text-white transition-colors"><Github className="w-5 h-5" /></Link>
            <Link href="#" className="text-slate-500 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></Link>
            <Link href="#" className="text-slate-500 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
