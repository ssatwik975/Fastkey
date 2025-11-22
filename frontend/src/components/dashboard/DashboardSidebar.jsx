'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Shield, Smartphone, Settings, LogOut, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Overview', id: 'overview' },
  { icon: Shield, label: 'Security', id: 'security' },
  { icon: Smartphone, label: 'Devices', id: 'devices' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

export default function DashboardSidebar({ activeTab, setActiveTab, onLogout }) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col z-40">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="p-2 bg-blue-600/20 rounded-lg">
          <Fingerprint className="w-6 h-6 text-blue-500" />
        </div>
        <span className="text-xl font-bold text-white">FastKey</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium",
              activeTab === item.id 
                ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" 
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
