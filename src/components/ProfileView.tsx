import React, { useState } from 'react';
import {
  User,
  Mail,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Sparkles,
} from 'lucide-react';
import { DbProfile } from '../types';
import { getSupabaseClient } from '../lib/supabase';

interface ProfileViewProps {
  userEmail: string;
  userId: string;
  profile: DbProfile | null;
  onSignOut: () => void;
  onProfileUpdated: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userEmail,
  userId,
  profile,
  onSignOut,
  onProfileUpdated,
}) => {
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const client = getSupabaseClient();
    if (!client) {
      setErrorMsg('Unable to connect to service.');
      setSaving(false);
      return;
    }

    try {
      // 1. Update public.profiles if exists
      const { error: profileError } = await client
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName.trim(),
          updated_at: new Date().toISOString(),
        });

      // 2. Update auth.users metadata for full_name
      const { error: authError } = await client.auth.updateUser({
        data: { full_name: fullName.trim() },
      });

      if (profileError && authError) {
        throw new Error(profileError.message || authError.message);
      }

      setSuccessMsg('Profile updated successfully.');
      onProfileUpdated();
    } catch (err: any) {
      console.error('Update profile error:', err);
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = fullName
    ? fullName.trim().slice(0, 2).toUpperCase()
    : userEmail.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 pb-12 max-w-2xl animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Account & Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal study workspace credentials and preferences.
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* User Information Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-display font-black text-2xl shadow-md shadow-indigo-500/20">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-extrabold text-xl text-slate-900">
                {fullName || userEmail.split('@')[0]}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                Active Student
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{userEmail}</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 pt-6 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Display Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={userEmail}
                disabled
                className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm bg-slate-100/70 border border-slate-200 rounded-2xl text-slate-500 cursor-not-allowed"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between gap-4 flex-wrap">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
