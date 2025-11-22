import React from 'react';
import IdeMockup from './IdeMockup';
import { Code2, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden min-h-screen flex flex-col items-center">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[600px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-white mb-6">
          The full{' '}
          <span className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-[#CCFF00] rounded-2xl mx-2 align-middle rotate-3">
            <Code2 className="w-12 h-12 md:w-16 md:h-16 text-black" strokeWidth={2.5} />
          </span>{' '}
          stack
          <br />
          AI workspace
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Firebase Studio accelerates your entire development lifecycle with AI agents. Build backends, front ends, and mobile apps, all in one place.
        </p>

        <button className="bg-[#FFCA28] hover:bg-[#FFB300] text-black text-lg font-medium px-8 py-4 rounded-full transition-all hover:scale-105 mb-20">
          Try Firebase Studio
        </button>

        {/* IDE Container */}
        <div className="relative w-full max-w-6xl mx-auto perspective-1000">
            {/* Floating Elements */}
            <div className="absolute -left-12 top-20 z-20 bg-[#1E1E1E] p-4 rounded-xl border border-white/10 shadow-2xl animate-float-slow hidden md:block">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <Code2 className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-white font-medium">Bootstrap the app</div>
                        <div className="text-xs text-green-400">✓ Current</div>
                    </div>
                </div>
            </div>

            <div className="absolute -right-8 top-40 z-20 bg-[#1E1E1E] w-64 rounded-xl border border-white/10 shadow-2xl overflow-hidden hidden md:block animate-float-delayed">
                <div className="bg-[#252526] px-3 py-2 flex items-center justify-between border-b border-white/5">
                    <span className="text-xs text-gray-400">Android Preview</span>
                </div>
                <div className="h-96 bg-black relative p-2">
                    <div className="w-full h-full bg-gradient-to-br from-pink-400 to-orange-400 rounded-lg flex items-center justify-center">
                        <div className="text-white font-bold text-4xl">*</div>
                    </div>
                </div>
            </div>

            <IdeMockup className="w-full h-[600px] relative z-10" />
        </div>
      </div>
    </section>
  );
}
