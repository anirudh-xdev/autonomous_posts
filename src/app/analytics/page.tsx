'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Sparkles, Lightbulb, CheckCircle2 } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/analytics');
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Card */}
      <div className="double-bezel-outer">
        <div className="double-bezel-inner p-5 sm:p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-mono uppercase tracking-wider mb-2 font-semibold">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>PERFORMANCE TELEMETRY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Content Analytics &amp; Feedback Loop
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1">
              Post-publication metrics and automated feedback insights for continuous content refinement.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="double-bezel-outer">
          <div className="double-bezel-inner p-16 text-center text-slate-400 dark:text-zinc-400 font-mono text-sm animate-pulse">
            Loading performance analytics...
          </div>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* Top Metrics Cards (Double-Bezel) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="double-bezel-outer">
              <div className="double-bezel-inner p-4 sm:p-5 space-y-2">
                <span className="text-xs font-mono uppercase text-slate-500 dark:text-zinc-400">Total Publications</span>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono">
                  {data?.stats?.totalPublications || 0}
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-500">Delivered Across APIs</div>
              </div>
            </div>

            <div className="double-bezel-outer">
              <div className="double-bezel-inner p-4 sm:p-5 space-y-2">
                <span className="text-xs font-mono uppercase text-slate-500 dark:text-zinc-400">LinkedIn Broadcasts</span>
                <div className="text-2xl sm:text-3xl font-bold text-sky-600 dark:text-sky-400 font-mono">
                  {data?.stats?.linkedinCount || 0}
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-500">Official REST /rest/posts</div>
              </div>
            </div>

            <div className="double-bezel-outer">
              <div className="double-bezel-inner p-4 sm:p-5 space-y-2">
                <span className="text-xs font-mono uppercase text-slate-500 dark:text-zinc-400">X (Twitter) Posts</span>
                <div className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-zinc-200 font-mono">
                  {data?.stats?.xCount || 0}
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-500">Twitter API v2 Threads</div>
              </div>
            </div>

            <div className="double-bezel-outer">
              <div className="double-bezel-inner p-4 sm:p-5 space-y-2">
                <span className="text-xs font-mono uppercase text-slate-500 dark:text-zinc-400">Delivery Success</span>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {data?.stats?.publicationSuccessRate || '100%'}
                </div>
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified 200 OK</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Content Feedback Loop Section */}
          <div className="double-bezel-outer">
            <div className="double-bezel-inner p-5 sm:p-7 md:p-8 space-y-4">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Content Feedback Insights</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">Autonomous observations without unprompted profile alteration</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {data?.insights?.map((insight: string, idx: number) => (
                  <div key={idx} className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-200 leading-relaxed font-sans">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
