import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  Calendar,
  GraduationCap,
  User,
  LogOut,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userEmail: string;
  userName?: string | null;
  onSignOut: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userEmail,
  userName,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai-assistant' as ActiveTab, label: 'AI Assistant', icon: Sparkles, badge: 'Smart' },
    { id: 'study-plan' as ActiveTab, label: 'Study Plan', icon: Calendar },
    { id: 'subjects' as ActiveTab, label: 'Subjects & Topics', icon: BookOpen },
    { id: 'exams' as ActiveTab, label: 'Exams', icon: GraduationCap },
    { id: 'profile' as ActiveTab, label: 'Profile', icon: User },
  ];

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const displayName = userName?.trim() || userEmail;
  const initials = (displayName.charAt(0) || 'U').toUpperCase();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-xl border-r border-slate-200/80 flex flex-col justify-between p-4 transition-transform duration-300 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl shadow-indigo-950/10' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3525cd] via-[#4f46e5] to-[#818cf8] flex items-center justify-center text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-50">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-extrabold text-lg text-slate-900 tracking-tight block leading-tight">
                StudyFlow
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 tracking-wider uppercase">
                Academic Hub
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-[#4338ca] to-[#4f46e5] text-white shadow-md shadow-indigo-500/20 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
                    }`}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100/80'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-white/70 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Area with User Profile and Sign Out */}
        <div className="space-y-2 pt-4 border-t border-slate-200/80">
          {/* User Profile Capsule */}
          <div
            id="user-profile-capsule"
            onClick={() => handleTabClick('profile')}
            className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-3 group ${
              activeTab === 'profile'
                ? 'bg-indigo-50/90 border-indigo-200 shadow-xs'
                : 'bg-slate-50/70 border-slate-200/70 hover:bg-white hover:border-indigo-200 hover:shadow-xs'
            }`}
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-semibold text-xs text-slate-900 tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                {displayName}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {userEmail}
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            id="btn-sign-out"
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 border border-transparent hover:border-rose-100 transition-all duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
