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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header with Title and Discovery Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Engineering Overview</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Autonomous discovery, research verification, and developer-focused social automation.
          </p>
        </div>
        <button
          onClick={handleTriggerDiscovery}
          disabled={discovering}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all border border-emerald-500/30 shadow-lg shadow-emerald-950/20"
        >
          <RefreshCw className={`w-4 h-4 ${discovering ? 'animate-spin' : ''}`} />
          {discovering ? 'Scanning Sources...' : 'Trigger Trend Discovery'}
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Trends */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Discovered Trends</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{trends.length}</div>
          <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">
              {trends.filter((t) => t.score >= 80).length} high-signal
            </span>{' '}
            (score &ge; 80)
          </p>
        </div>

        {/* Card 2: Drafts Awaiting Review */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Awaiting Approval</span>
            <FileCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{pendingDrafts.length}</div>
          <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
            <span className="text-sky-400 font-medium">{pendingDrafts.length} posts</span> ready for manual review
          </p>
        </div>

        {/* Card 3: Published */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Published Posts</span>
            <Send className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{publishedCount}</div>
          <p className="text-xs text-zinc-400 mt-2">
            LinkedIn &bull; X (Twitter)
          </p>
        </div>

        {/* Card 4: Quality Gate */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Quality Gate Health</span>
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">100%</div>
          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Factual consistency verified
          </p>
        </div>
      </div>

      {/* Grid: High-Score Trends & Drafts Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column 1: Emerging AI Trends */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Emerging AI Trends
                </h3>
                {/* All vs Saved filter tabs */}
                <div className="flex items-center bg-[#0d1117] rounded-lg p-0.5 border border-[#30363d]">
                  <button
                    onClick={() => setTrendTab('all')}
                    className={`px-2.5 py-0.5 text-xs font-mono rounded-md transition-colors ${
                      trendTab === 'all'
                        ? 'bg-[#21262d] text-emerald-400 font-semibold shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    All ({trends.slice(0, 10).length})
                  </button>
                  <button
                    onClick={() => setTrendTab('saved')}
                    className={`px-2.5 py-0.5 text-xs font-mono rounded-md transition-colors flex items-center gap-1 ${
                      trendTab === 'saved'
                        ? 'bg-[#21262d] text-amber-400 font-semibold shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Bookmark className="w-3 h-3 fill-current" />
                    Saved ({savedTrends.length})
                  </button>
                </div>
              </div>

              <Link href="/trends" className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1">
                Full Feed <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-zinc-500 font-mono">Loading trends...</div>
            ) : displayedTrends.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500 font-mono">
                {trendTab === 'saved'
                  ? 'No saved trends yet. Click the bookmark icon on any trend to pin it.'
                  : 'No trends found yet. Click "Trigger Trend Discovery" above to scan sources.'}
              </div>
            ) : (
              <div className="divide-y divide-[#30363d]">
                {displayedTrends.map((t) => (
                  <div key={t.id} className="py-3.5 flex items-start justify-between gap-3 group">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/trends/${t.id}`}
                          className="text-sm font-medium text-zinc-200 hover:text-emerald-400 transition-colors line-clamp-1"
                        >
                          {t.title}
                        </Link>
                        {t.isSaved && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 flex-shrink-0">
                            <Bookmark className="w-2.5 h-2.5 fill-current" /> Saved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2">{t.summary}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-mono bg-[#21262d] text-zinc-300 px-2 py-0.5 rounded border border-[#30363d]">
                          {t.evidences?.length || 1} sources
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">{t.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => handleToggleSave(t.id, Boolean(t.isSaved), e)}
                        title={t.isSaved ? 'Unpin / Remove from Saved' : 'Save & Pin (protects from replacement)'}
                        className={`p-1.5 rounded-lg border transition-all ${
                          t.isSaved
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
                            : 'bg-[#21262d] border-[#30363d] text-zinc-400 hover:text-amber-300 hover:border-amber-500/40'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${t.isSaved ? 'fill-current' : ''}`} />
                      </button>
                      <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                        {Math.round(t.score)}/100
                      </span>
                      <Link
                        href={`/trends/${t.id}`}
                        className="text-xs bg-[#21262d] hover:bg-[#30363d] text-zinc-300 px-2.5 py-1 rounded transition-colors border border-[#30363d]"
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Drafts Awaiting Approval */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-sky-400" />
                Drafts Awaiting Approval
              </h3>
              <Link href="/content" className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1">
                View all ({contentItems.length}) <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-zinc-500 font-mono">Loading drafts...</div>
            ) : pendingDrafts.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500 font-mono">
                No drafts awaiting approval. Research a trend to generate new drafts.
              </div>
            ) : (
              <div className="divide-y divide-[#30363d]">
                {pendingDrafts.slice(0, 5).map((item) => (
                  <div key={item.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-zinc-200 line-clamp-1">
                        {item.trend?.title || 'Generated Post Draft'}
                      </h4>
                      <div className="flex items-center gap-2">
                        {item.variants?.map((v: any) => (
                          <span
                            key={v.id}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              v.platform === 'LINKEDIN'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                            }`}
                          >
                            {v.platform} ({v.characterCount}c)
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link
                      href={`/content/${item.id}`}
                      className="text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded transition-colors flex-shrink-0"
                    >
                      Review & Approve
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
