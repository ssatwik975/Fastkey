import React from 'react';
import { Terminal, Smartphone, Globe, Zap, Users, Layout } from 'lucide-react';
import IdeMockup from './IdeMockup';

export default function Features() {
  return (
    <section className="py-32 bg-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Feature 1: Get to work quickly */}
        <div className="mb-40 text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
                Get to work quickly<br/>wherever you are
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-16">
                Go from opening your browser to building in minutes, not hours. Import your existing repositories from GitHub, GitLab, Bitbucket, or your local machine.
            </p>
            
            <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-20">
                    <div className="w-64 h-64 bg-pink-500 blur-[100px] rounded-full" />
                </div>
                
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="text-left">
                        <div className="bg-[#1E1E1E] border border-white/10 rounded-xl p-6 mb-6">
                            <div className="text-sm text-gray-400 mb-2">Prototype an app with AI</div>
                            <div className="bg-black/50 rounded-lg p-4 text-gray-300 font-mono text-sm">
                                An app that helps users manage and share their tasks <span className="bg-[#333] px-2 py-0.5 rounded text-xs ml-2">TAB</span>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <span className="px-3 py-1 rounded-full bg-[#333] text-xs text-gray-300">Build a joke generator</span>
                                <span className="px-3 py-1 rounded-full bg-[#333] text-xs text-gray-300">Recipe maker</span>
                            </div>
                        </div>
                        
                        <div className="bg-[#1E1E1E] border border-white/10 rounded-xl p-4 flex items-center gap-4">
                            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">+</div>
                            <div className="text-white font-medium">New Workspace</div>
                            <div className="h-4 w-[1px] bg-gray-700 mx-2" />
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-900/50 border border-blue-500/30" />
                                <div className="w-6 h-6 rounded-full bg-yellow-900/50 border border-yellow-500/30" />
                                <div className="w-6 h-6 rounded-full bg-green-900/50 border border-green-500/30" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl rounded-full" />
                        <IdeMockup className="h-[400px] w-full transform rotate-1 hover:rotate-0 transition-transform duration-500" />
                    </div>
                </div>
            </div>
        </div>

        {/* Feature 2: Build with Gemini */}
        <div className="mb-40 grid md:grid-cols-2 gap-12 items-center">
            <div>
                <div className="inline-block px-4 py-1 rounded-full bg-[#1E1E1E] border border-white/10 text-xs font-medium text-gray-400 mb-6">
                    AI POWERED
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    Build with <span className="text-blue-400">Gemini</span><br/>in Firebase
                </h2>
                <p className="text-lg text-gray-400 mb-8">
                    Work quickly and efficiently with Gemini in Firebase. Complete a variety of tasks like coding, debugging, testing, refactoring, explaining, and documenting code with AI assistance.
                </p>
                <button className="text-[#FFCA28] font-medium hover:text-white transition-colors">
                    Get Started →
                </button>
            </div>
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full" />
                <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6 relative z-10">
                    <div className="flex gap-4 mb-6 justify-end">
                        <div className="bg-[#2D2D2D] rounded-lg p-3 text-sm text-gray-300 max-w-xs">
                            there's a camera permissions error, can you fix it?
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-600" />
                    </div>
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-[#2D2D2D] rounded-lg p-4 text-sm text-gray-300 flex-1">
                            <p className="mb-3">Good catch! Let's add error handling and some UI states for camera permissions.</p>
                            <div className="bg-black rounded p-3 font-mono text-xs border border-white/10">
                                <div className="flex justify-between text-gray-500 mb-2">
                                    <span>Add handling for camera permissions</span>
                                    <span className="text-green-400">✓ Current</span>
                                </div>
                                <div className="text-gray-400">src/pages/Home.tsx <span className="text-green-400 ml-2">+5</span> <span className="text-red-400">-2</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Feature 3: Collaboration */}
        <div className="mb-40 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Share ideas and<br/>work together
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
                Provide a URL for your early testers to preview your app and give feedback. Share workspaces with other team members.
            </p>
            <div className="relative max-w-4xl mx-auto">
                <IdeMockup className="h-[500px] w-full" />
                {/* Cursors */}
                <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full rounded-tl-none ml-3">James</div>
                    <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M0 0L10 20L14 12L22 10L0 0Z"/></svg>
                </div>
                <div className="absolute bottom-1/3 right-1/4">
                    <div className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full rounded-tl-none ml-3">Emma</div>
                    <svg className="w-4 h-4 text-pink-500 fill-current" viewBox="0 0 24 24"><path d="M0 0L10 20L14 12L22 10L0 0Z"/></svg>
                </div>
            </div>
        </div>

        {/* Feature 4: Cross Platform */}
        <div className="grid md:grid-cols-2 gap-20 items-center bg-[#121212] rounded-3xl p-12 border border-white/10">
            <div className="relative h-[400px] bg-[#1E1E1E] rounded-xl overflow-hidden border border-white/10">
                <div className="absolute top-0 left-0 right-0 h-10 bg-[#252526] flex items-center px-4 border-b border-black/20">
                    <div className="flex gap-6 text-sm">
                        <span className="text-green-400 flex items-center gap-2 border-b-2 border-green-400 h-10"><Smartphone className="w-4 h-4"/> Android</span>
                        <span className="text-gray-400 flex items-center gap-2"><Globe className="w-4 h-4"/> Web</span>
                    </div>
                </div>
                <div className="p-8 flex items-center justify-center h-full">
                    <div className="w-48 h-full bg-black border-4 border-[#333] rounded-[2rem] overflow-hidden relative">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#333] rounded-b-xl" />
                    </div>
                </div>
            </div>
            <div>
                <div className="inline-block px-3 py-1 rounded-full bg-[#1E1E1E] border border-white/10 text-xs font-mono text-gray-400 mb-6">
                    END-TO-END TESTING
                </div>
                <h2 className="text-4xl font-bold text-white mb-6">
                    Optimize your full-stack<br/>apps across platforms
                </h2>
                <p className="text-lg text-gray-400 mb-8">
                    With access to thousands of extensions in the Open VSX Registry, you can test and optimize your API endpoints and backends as you build them.
                </p>
                <button className="text-[#FFCA28] font-medium hover:text-white transition-colors">
                    Get Started
                </button>
            </div>
        </div>

      </div>
    </section>
  );
}

function Sparkles({ className }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3L14.5 8.5L20 11L14.5 13.5L12 19L9.5 13.5L4 11L9.5 8.5L12 3Z" />
        </svg>
    )
}
