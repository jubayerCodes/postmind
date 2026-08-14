'use client';

import * as React from 'react';
import {
  Sparkles,
  LayoutGrid,
  ShoppingBag,
  Calendar,
  BarChart3,
  Settings,
  Layers,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: 'feed', label: 'Feed Studio', icon: Sparkles, badge: 'AI Live' },
    { id: 'stories', label: 'Stories & Reels', icon: Layers },
    { id: 'products', label: 'Products', icon: ShoppingBag, count: '4' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, badge: '3 Scheduled' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-[#0D1117]/90 backdrop-blur-md flex flex-col justify-between p-4 shrink-0 transition-colors">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                PostMind
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                AI
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Social Manager SaaS</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer text-left group',
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/10 to-cyan-500/10 text-violet-700 dark:text-cyan-300 font-semibold border border-violet-500/20 dark:border-cyan-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-transform group-hover:scale-110',
                      isActive
                        ? 'text-violet-600 dark:text-cyan-400'
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-cyan-500/10 text-violet-700 dark:text-cyan-400 border border-violet-200 dark:border-cyan-500/20">
                    {item.badge}
                  </span>
                )}
                {item.count && (
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Store Plan Status */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800/60 px-2 space-y-2">
        <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-[#161B22] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Monthly AI Quota</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-mono">14 / 50</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700/60 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full w-[28%]" />
          </div>
        </div>
      </div>
    </aside>
  );
}
