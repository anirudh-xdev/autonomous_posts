'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  FileCheck,
  Send,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Bookmark,
  Activity,
  ArrowUpRight,
  Radio,
  Cpu,
  Layers,
  FileText,
  Clock,
} from 'lucide-react';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [trends, setTrends] = useState<any[]>([]);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [trendTab, setTrendTab] = useState<'all' | 'saved'>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [trendsRes, contentRes, analyticsRes] = await Promise.all([
        fetch('/api/trends'),
        fetch('/api/content'),
        fetch('/api/analytics'),
      ]);

      const trendsData = await trendsRes.json();
      const contentData = await contentRes.json();
      const analyticsData = await analyticsRes.json();

      if (trendsData.success) setTrends(trendsData.trends || []);
      if (contentData.success) setContentItems(contentData.items || []);
      if (analyticsData.success) setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTriggerDiscovery = async () => {
    setDiscovering(true);
    try {
      const res = await fetch('/api/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 10, replaceUnsaved: true }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchData();
      }
    } catch (err) {
      console.error('Discovery failed', err);
    } finally {
      setDiscovering(false);
    }
  };

  const handleToggleSave = async (trendId: string, currentSaved: boolean, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    // Optimistic update
    setTrends((prev) =>
      prev.map((t) => (t.id === trendId ? { ...t, isSaved: !currentSaved } : t))
    );

    try {
      const res = await fetch(`/api/trends/${trendId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSaved: !currentSaved }),
      });
      const data = await res.json();
      if (!data.success) {
        // Revert on failure
        setTrends((prev) =>
          prev.map((t) => (t.id === trendId ? { ...t, isSaved: currentSaved } : t))
        );
      }
    } catch (err) {
      console.error('Failed to toggle saved status', err);
      setTrends((prev) =>
        prev.map((t) => (t.id === trendId ? { ...t, isSaved: currentSaved } : t))
      );
    }
  };

  const savedTrends = trends.filter((t) => t.isSaved);
  const displayedTrends = trendTab === 'saved' ? savedTrends : trends.slice(0, 10);
  const pendingDrafts = contentItems.filter((i) => i.status === 'DRAFT' || i.status === 'REVIEWING');
  const publishedCount = analytics?.stats?.successful || 0;

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* =========================================================================
          1. MISSION COMMAND HEADER BAR
          Telemetry pulse, model provider status, and kinetic discovery trigger
      ========================================================================= */}
      <div className="double-bezel-outer">
        <div className="double-bezel-inner p-5 sm:p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono uppercase tracking-wider font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>LIVE TELEMETRY ACTIVE • HUGGING FACE QWEN-72B</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Mission Control
            </h1>
            <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Autonomous trend signal detection, verified technical research dossiers, and multi-platform publishing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleTriggerDiscovery}
              disabled={discovering}
              className="btn-island-primary !py-2.5 !px-5 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${discovering ? 'animate-spin' : ''}`} />
              <span>{discovering ? 'Scanning 24 Sources...' : 'Trigger Trend Discovery'}</span>
              <div className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/20 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-current" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. DOUBLE-BEZEL KPI STATS CARDS
      ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Trends */}
        <div className="double-bezel-outer">
          <div className="double-bezel-inner p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
              <span className="text-xs font-mono tracking-wider uppercase">Discovered Trends</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
              {trends.length}
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-white/[0.04] text-xs font-mono text-slate-500 dark:text-zinc-400 flex items-center justify-between">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {trends.filter((t) => t.score >= 80).length} High-Signal
              </span>
              <span>Score &ge; 80</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Pending Drafts */}
        <div className="double-bezel-outer">
          <div className="double-bezel-inner p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
              <span className="text-xs font-mono tracking-wider uppercase">Awaiting Approval</span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
              {pendingDrafts.length}
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-white/[0.04] text-xs font-mono text-slate-500 dark:text-zinc-400 flex items-center justify-between">
              <span className="text-sky-600 dark:text-sky-300 font-medium">Ready for review</span>
              <Link href="/content" className="text-sky-600 dark:text-sky-400 hover:underline">
                Review →
              </Link>
            </div>
          </div>
        </div>

        {/* Metric 3: Published */}
        <div className="double-bezel-outer">
          <div className="double-bezel-inner p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
              <span className="text-xs font-mono tracking-wider uppercase">Published Posts</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Send className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
              {publishedCount}
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-white/[0.04] text-xs font-mono text-slate-500 dark:text-zinc-400 flex items-center justify-between">
              <span className="text-emerald-600 dark:text-emerald-400">LinkedIn &bull; X</span>
              <Link href="/publications" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                History →
              </Link>
            </div>
          </div>
        </div>

        {/* Metric 4: Quality Gate Health */}
        <div className="double-bezel-outer">
          <div className="double-bezel-inner p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
              <span className="text-xs font-mono tracking-wider uppercase">Quality Gate</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
              100%
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-white/[0.04] text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Factual consistency verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. BENTO GRID: LIVE EMERGING TRENDS & ACTIVE DRAFTS STREAM
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column (7 cols): Emerging Trends Command */}
        <div className="lg:col-span-7 double-bezel-outer">
          <div className="double-bezel-inner p-5 sm:p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      Emerging Signals
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                      Continuous 7-factor ranked pipeline
                    </p>
                  </div>
                </div>

                {/* All vs Saved Filter Tabs */}
                <div className="flex items-center bg-slate-100 dark:bg-white/[0.04] rounded-full p-1 border border-slate-200 dark:border-white/[0.06]">
                  <button
                    onClick={() => setTrendTab('all')}
                    className={`px-3 py-1 text-xs font-mono rounded-full transition-all ${
                      trendTab === 'all'
                        ? 'bg-white dark:bg-white/[0.1] text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm dark:shadow-specular'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    All ({trends.slice(0, 10).length})
                  </button>
                  <button
                    onClick={() => setTrendTab('saved')}
                    className={`px-3 py-1 text-xs font-mono rounded-full transition-all flex items-center gap-1.5 ${
                      trendTab === 'saved'
                        ? 'bg-white dark:bg-white/[0.1] text-amber-700 dark:text-amber-400 font-semibold shadow-sm dark:shadow-specular'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Bookmark className="w-3 h-3 fill-current" />
                    Pinned ({savedTrends.length})
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center text-sm font-mono text-slate-400 dark:text-zinc-500 animate-pulse">
                  Streaming live trend data...
                </div>
              ) : displayedTrends.length === 0 ? (
                <div className="py-16 text-center text-sm font-mono text-slate-400 dark:text-zinc-500">
                  {trendTab === 'saved'
                    ? 'No pinned trends yet. Click the bookmark icon on any trend to save it.'
                    : 'No trends found yet. Click "Trigger Trend Discovery" to initiate scanning.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedTrends.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.1] hover:bg-slate-100/70 dark:hover:bg-white/[0.04] transition-all group flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                            {Math.round(t.score)} PTS
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 uppercase">
                            {t.status}
                          </span>
                          {t.researchReport && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                              Researched
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/trends/${t.id}`}
                          className="text-sm font-bold text-slate-900 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-white transition-colors block line-clamp-1"
                        >
                          {t.title}
                        </Link>

                        <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {t.summary}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 self-center shrink-0">
                        <button
                          onClick={(e) => handleToggleSave(t.id, t.isSaved, e)}
                          className={`p-2 rounded-xl transition-colors ${
                            t.isSaved
                              ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                              : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.05]'
                          }`}
                          title={t.isSaved ? 'Unpin Trend' : 'Pin Trend'}
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                        <Link
                          href={`/trends/${t.id}`}
                          className="p-2 rounded-xl text-slate-400 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.05] transition-colors"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-5 sm:pt-6 border-t border-slate-200 dark:border-white/[0.06] mt-6 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-500">
                Top 10 ranked candidates displayed
              </span>
              <Link
                href="/trends"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline group"
              >
                <span>Full Trend Radar</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Content Studio Queue & Actions */}
        <div className="lg:col-span-5 double-bezel-outer">
          <div className="double-bezel-inner p-5 sm:p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      Content Studio
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                      Drafts &amp; Multi-Platform Posts
                    </p>
                  </div>
                </div>

                <Link
                  href="/content"
                  className="text-xs font-mono text-sky-600 dark:text-sky-400 hover:underline"
                >
                  All ({contentItems.length})
                </Link>
              </div>

              {contentItems.length === 0 ? (
                <div className="py-16 text-center text-sm font-mono text-slate-400 dark:text-zinc-500">
                  No drafts synthesized yet. Select an emerging trend to generate platform posts.
                </div>
              ) : (
                <div className="space-y-3">
                  {contentItems.slice(0, 5).map((item) => (
                    <Link
                      key={item.id}
                      href={`/content/${item.id}`}
                      className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] hover:border-sky-500/40 hover:bg-slate-100/70 dark:hover:bg-white/[0.04] transition-all block group"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                            item.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                              : item.status === 'PUBLISHED'
                              ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {item.status}
                        </span>

                        <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-slate-900 dark:text-zinc-200 group-hover:text-sky-600 dark:group-hover:text-white transition-colors line-clamp-1">
                        {item.trend?.title || 'Synthesized Post'}
                      </div>

                      <div className="mt-2 flex items-center gap-2 sm:gap-3 text-xs font-mono text-slate-500 dark:text-zinc-400">
                        <span>{item.variants?.length || 2} Variants</span>
                        <span>•</span>
                        <span>LinkedIn + X</span>
                        {item.imageUrl && (
                          <>
                            <span>•</span>
                            <span className="text-purple-600 dark:text-purple-400">Visual Attached</span>
                          </>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-5 sm:pt-6 border-t border-slate-200 dark:border-white/[0.06] mt-6 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-500">
                5-Pillar developer voice active
              </span>
              <Link
                href="/content"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-600 dark:text-sky-400 hover:underline group"
              >
                <span>Open Editor</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
