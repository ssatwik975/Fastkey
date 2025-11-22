import React from 'react';
import { Code2, Terminal, Play, Search, GitBranch, Settings, Menu, X, ChevronRight, FileCode } from 'lucide-react';

export default function IdeMockup({ className = "" }) {
  return (
    <div className={`bg-[#1E1E1E] rounded-xl overflow-hidden border border-white/10 shadow-2xl flex flex-col ${className}`}>
      {/* Window Controls */}
      <div className="h-10 bg-[#252526] flex items-center px-4 justify-between border-b border-black/20">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
        </div>
        <div className="text-xs text-gray-400 font-mono">studio.firebase.google.com</div>
        <div className="w-16" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <div className="w-12 bg-[#333333] flex flex-col items-center py-4 gap-6 border-r border-black/20">
          <FileCode className="w-6 h-6 text-white opacity-100" />
          <Search className="w-6 h-6 text-gray-400" />
          <GitBranch className="w-6 h-6 text-gray-400" />
          <Play className="w-6 h-6 text-gray-400" />
          <div className="flex-1" />
          <Settings className="w-6 h-6 text-gray-400" />
        </div>

        {/* Sidebar */}
        <div className="w-60 bg-[#252526] flex flex-col border-r border-black/20">
          <div className="h-8 flex items-center px-4 text-xs font-bold text-gray-300 uppercase tracking-wider">Explorer</div>
          <div className="px-2 py-2">
            <div className="flex items-center gap-1 text-gray-300 text-sm py-1">
              <ChevronRight className="w-4 h-4" />
              <span className="font-bold">MYAPP</span>
            </div>
            <div className="pl-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-gray-400 text-sm py-0.5 pl-2 border-l border-gray-600">
                    <span className="text-blue-400">#</span> .idx
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm py-0.5 pl-2 border-l border-gray-600">
                    <span className="text-yellow-400">JS</span> dist
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm py-0.5 pl-2 border-l border-gray-600">
                    <span className="text-green-400">/</span> node_modules
                </div>
                <div className="flex items-center gap-2 text-white bg-[#37373D] text-sm py-0.5 pl-2 border-l border-blue-500">
                    <span className="text-blue-400">TS</span> Home.tsx
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm py-0.5 pl-2 border-l border-gray-600">
                    <span className="text-yellow-400">{}</span> package.json
                </div>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 bg-[#1E1E1E] flex flex-col">
          {/* Tabs */}
          <div className="h-9 bg-[#252526] flex items-center">
            <div className="h-full px-4 bg-[#1E1E1E] flex items-center gap-2 text-sm text-white border-t-2 border-blue-500">
              <span className="text-blue-400">TS</span>
              Home.tsx
              <X className="w-3 h-3 ml-2 text-gray-400" />
            </div>
          </div>

          {/* Code */}
          <div className="flex-1 p-4 font-mono text-sm overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#1E1E1E] text-gray-600 text-right pr-4 pt-4 select-none">
                17<br/>18<br/>19<br/>20<br/>21<br/>22<br/>23<br/>24<br/>25<br/>26<br/>27<br/>28<br/>29<br/>30
            </div>
            <div className="pl-12 text-gray-300 leading-6">
                <span className="text-purple-400">export default function</span> <span className="text-yellow-300">Home</span>() {'{'}<br/>
                &nbsp;&nbsp;<span className="text-purple-400">const</span> [imageUrl, setImageUrl] = <span className="text-blue-300">useState</span>&lt;<span className="text-green-300">string</span> | <span className="text-blue-300">null</span>&gt;(<span className="text-blue-300">null</span>);<br/>
                &nbsp;&nbsp;<span className="text-purple-400">const</span> [dishName, setDishName] = <span className="text-blue-300">useState</span>&lt;<span className="text-green-300">string</span> | <span className="text-blue-300">null</span>&gt;(<span className="text-blue-300">null</span>);<br/>
                &nbsp;&nbsp;<span className="text-purple-400">const</span> [ingredients, setIngredients] = <span className="text-blue-300">useState</span>&lt;<span className="text-green-300">string</span>[]&gt;([]);<br/>
                &nbsp;&nbsp;<span className="text-purple-400">const</span> [recipe, setRecipe] = <span className="text-blue-300">useState</span>&lt;{'{'}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;recipeName: <span className="text-green-300">string</span>;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;ingredients: <span className="text-green-300">string</span>[];<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;instructions: <span className="text-green-300">string</span>[];<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;preparationTime: <span className="text-green-300">string</span>;<br/>
                &nbsp;&nbsp;{'}'} | <span className="text-blue-300">null</span>&gt;(<span className="text-blue-300">null</span>);<br/>
                <br/>
                &nbsp;&nbsp;<span className="text-gray-500">// Camera Permission useEffect</span><br/>
                &nbsp;&nbsp;<span className="text-blue-300">useEffect</span>(() =&gt; {'{'}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">const</span> getCameraPermission = <span className="text-purple-400">async</span> () =&gt; {'{'}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">try</span> {'{'}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">const</span> stream = <span className="text-purple-400">await</span> navigator.mediaDevices.getUserMedia({'{'} video: <span className="text-blue-300">true</span> {'}'});
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
