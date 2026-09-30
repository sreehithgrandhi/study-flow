import React, { useState } from 'react';
import { ShieldAlert, Copy, Check, RefreshCw, ExternalLink } from 'lucide-react';

interface DatabaseNoticeBannerProps {
  error: {
    code?: string;
    message?: string;
    hint?: string;
  } | null;
  onRetry: () => void;
  isRetrying?: boolean;
}

export const DatabaseNoticeBanner: React.FC<DatabaseNoticeBannerProps> = ({
  error,
  onRetry,
  isRetrying = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!error) return null;

  const sqlFixCommand = `-- Fix for Supabase PostgreSQL Error 42501 (Permission Denied)
-- Run this in your Supabase Dashboard -> SQL Editor -> New Query:

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- Ensure RLS is active with policies for authenticated users
ALTER TABLE IF EXISTS public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.study_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlFixCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-[#0b1c30] shadow-xs mb-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-sm text-amber-900">
                Supabase Table Permissions Required (Error 42501)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/70 text-amber-800 uppercase">
                PostgreSQL Role Grant
              </span>
            </div>

            <p className="text-xs text-amber-800/90 leading-relaxed max-w-2xl">
              Your tables exist in Supabase, but the <code className="font-semibold text-amber-950 px-1 py-0.5 bg-amber-100/60 rounded">authenticated</code> role has not been granted permissions yet. Run the SQL grant snippet below in your Supabase SQL Editor to grant table access to your logged-in user.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100/50 shadow-2xs transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied SQL!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SQL Fix</span>
              </>
            )}
          </button>

          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
          </button>
        </div>
      </div>

      {/* SQL Snippet Preview */}
      <div className="mt-3.5 pt-3 border-t border-amber-200/70">
        <div className="flex items-center justify-between mb-1.5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] font-semibold text-amber-900 hover:underline flex items-center gap-1"
          >
            <span>{expanded ? 'Hide SQL commands' : 'View SQL commands to run in Supabase'}</span>
          </button>

          {error.hint && (
            <span className="text-[11px] text-amber-700 italic hidden sm:inline">
              {error.hint}
            </span>
          )}
        </div>

        {expanded && (
          <pre className="mt-2 p-3 bg-amber-950 text-amber-100 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed border border-amber-900">
            {sqlFixCommand}
          </pre>
        )}
      </div>
    </div>
  );
};
