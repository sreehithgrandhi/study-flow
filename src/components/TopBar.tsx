import React from 'react';
import { Search, Menu, Timer, Sparkles } from 'lucide-react';

interface TopBarProps {
  onOpenMobileNav: () => void;
  onSearchClick: () => void;
  userEmail?: string;
  onOpenTimer?: () => void;
  onOpenAiPlan?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenMobileNav,
  onSearchClick,
  userEmail,
  onOpenTimer,
  onOpenAiPlan,
}) => {
  // Format today's date cleanly
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="flex items-center gap-3 w-full max-w-md">
        <button
          onClick={onOpenMobileNav}
          className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Quick Search Button */}
        <button
          onClick={onSearchClick}
          className="w-full flex items-center justify-between h-9 px-3.5 text-xs bg-slate-50/80 border border-slate-200 rounded-xl text-slate-500 hover:bg-white hover:border-indigo-300 hover:shadow-xs transition-all text-left"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">Quick search subjects, topics, exams...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold text-slate-500 bg-white rounded-md border border-slate-200 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Header Status & Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {onOpenAiPlan && (
          <button
            id="topbar-btn-ai-plan"
            onClick={onOpenAiPlan}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs shadow-sm shadow-indigo-500/20 active:scale-[0.98] transition-all"
            title="Generate today's study plan with AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Plan</span>
          </button>
        )}

        {onOpenTimer && (
          <button
            id="topbar-btn-timer"
            onClick={onOpenTimer}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-2xs active:scale-[0.98]"
            title="Open Focus Timer"
          >
            <Timer className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Focus Timer</span>
          </button>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs text-slate-600">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-800">{todayStr}</span>
        </div>
      </div>
    </header>
  );
};
