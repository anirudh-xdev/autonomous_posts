'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Filter,
  Bookmark,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sliders,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Database,
  Activity,
} from 'lucide-react';

export default function TrendsPage() {
  const [trends, setTrends] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [minScoreFilter, setMinScoreFilter] = useState(0);
  const [tabFilter, setTabFilter] = useState<'all' | 'saved' | 'sources'>('all');

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/trends?minScore=${minScoreFilter}`);
      const data = await res.json();
      if (data.success) {
        setTrends(data.trends || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      setSourcesLoading(true);
      const res = await fetch('/api/sources');
      const data = await res.json();
      if (data.success) {
        setSources(data.sources || []);
      }
    } catch (err) {
      console.error('Failed to fetch sources', err);
    } finally {
      setSourcesLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [minScoreFilter]);

  useEffect(() => {
    if (tabFilter === 'sources') {
      fetchSources();
    }
  }, [tabFilter]);

  const handleToggleSave = async (trendId: string, currentSaved: boolean, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
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

  const handleToggleSource = async (sourceId: string, currentEnabled: boolean) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, enabled: !currentEnabled } : s))
    );

    try {
      const res = await fetch('/api/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sourceId, enabled: !currentEnabled }),
      });
      const data = await res.json();
      if (!data.success) {
        setSources((prev) =>
          prev.map((s) => (s.id === sourceId ? { ...s, enabled: currentEnabled } : s))
        );
      }
    } catch (err) {
      console.error('Failed to toggle source', err);
      setSources((prev) =>
        prev.map((s) => (s.id === sourceId ? { ...s, enabled: currentEnabled } : s))
      );
    }
  };

  const handleAdjustTrust = async (sourceId: string, delta: number) => {
    const target = sources.find((s) => s.id === sourceId);
    if (!target) return;
    const newTrust = Math.min(10, Math.max(0, Math.round((target.trustScore + delta) * 10) / 10));

    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, trustScore: newTrust } : s))
    );

    try {
      await fetch('/api/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sourceId, trustScore: newTrust }),
      });
    } catch (err) {
      console.error('Failed to adjust trust score', err);
    }
  };

  const savedTrends = trends.filter((t) => t.isSaved);
  const displayedTrends = tabFilter === 'saved' ? savedTrends : trends;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PRIMARY':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30';
      case 'RESEARCH':
        return 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30';
      case 'DEVELOPER':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'COMMUNITY':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'NEWS':
        return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-white/[0.08]';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Bar */}
      <div className="double-bezel-outer">
        <div className="double-bezel-inner p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-mono uppercase tracking-wider mb-2 font-semibold">
              <Flame className="w-3.5 h-3.5" />
              <span>RADAR INTELLIGENCE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Emerging AI Trends
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1">
              Multi-source discovery, 4-layer deduplication, and transparent 7-factor scoring.
            </p>
          </div>

          {/* Filter Bar Controls */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="flex items-center bg-slate-100 dark:bg-white/[0.03] rounded-full p-1 border border-slate-200 dark:border-white/[0.06]">
              <button
                onClick={() => setTabFilter('all')}
                className={`px-3 py-1.5 text-xs font-mono rounded-full transition-all ${
                  tabFilter === 'all'
                    ? 'bg-white dark:bg-white/[0.1] text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm dark:shadow-specular'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                All Signals ({trends.length})
              </button>
              <button
                onClick={() => setTabFilter('saved')}
                className={`px-3 py-1.5 text-xs font-mono rounded-full transition-all flex items-center gap-1.5 ${
                  tabFilter === 'saved'
                    ? 'bg-white dark:bg-white/[0.1] text-amber-700 dark:text-amber-400 font-semibold shadow-sm dark:shadow-specular'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <Bookmark className="w-3 h-3 fill-current" />
                Pinned ({savedTrends.length})
              </button>
              <button
                onClick={() => setTabFilter('sources')}
                className={`px-3 py-1.5 text-xs font-mono rounded-full transition-all flex items-center gap-1.5 ${
                  tabFilter === 'sources'
                    ? 'bg-white dark:bg-white/[0.1] text-sky-700 dark:text-sky-400 font-semibold shadow-sm dark:shadow-specular'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <Radio className="w-3 h-3" />
                Sources
              </button>
            </div>

            {tabFilter !== 'sources' && (
              <div className="flex items-center gap-2">
                <select
                  value={minScoreFilter}
                  onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                  className="bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-zinc-300 text-xs rounded-full px-3.5 py-1.5 font-mono focus:outline-none focus:border-emerald-500 shadow-sm dark:shadow-specular"
                >
                  <option value={0} className="bg-white text-slate-900 dark:bg-[#090D16] dark:text-zinc-200">All Scores (0+)</option>
                  <option value={70} className="bg-white text-slate-900 dark:bg-[#090D16] dark:text-zinc-200">High-Signal (70+)</option>
                  <option value={80} className="bg-white text-slate-900 dark:bg-[#090D16] dark:text-zinc-200">Top Picks (80+)</option>
                  <option value={88} className="bg-white text-slate-900 dark:bg-[#090D16] dark:text-zinc-200">Frontier (88+)</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- TAB CONTENT: SOURCE INTELLIGENCE REGISTRY --- */}
      {tabFilter === 'sources' ? (
        <div className="double-bezel-outer">
          <div className="double-bezel-inner p-5 sm:p-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-200 dark:border-white/[0.06]">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  5-Tier Source Intelligence Registry
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                  Hierarchical authority architecture feeding raw signals into deduplication &amp; clustering.
                </p>
              </div>
              <button
                onClick={fetchSources}
                className="btn-island-secondary !text-xs !py-1.5 !px-3"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Registry</span>
              </button>
            </div>

            {sourcesLoading ? (
              <div className="py-16 text-center text-slate-500 dark:text-zinc-400 font-mono text-xs">
                Loading source registry...
              </div>
            ) : sources.length === 0 ? (
              <div className="py-16 text-center text-slate-500 dark:text-zinc-400 font-mono text-xs">
                No sources registered yet. Run discovery to auto-seed default 5-tier sources.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono min-w-[650px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-zinc-400 uppercase text-[10px]">
                      <th className="pb-3 pr-4">Source</th>
                      <th className="pb-3 pr-4">Tier</th>
                      <th className="pb-3 pr-4">Method</th>
                      <th className="pb-3 pr-4">Trust Authority</th>
                      <th className="pb-3 pr-4">Health Status</th>
                      <th className="pb-3 pr-4">Last Run</th>
                      <th className="pb-3 text-right">Enabled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {sources.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pr-4">
                          <div className="font-bold text-slate-900 dark:text-zinc-200">{s.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-500 truncate max-w-xs">{s.url || s.apiUrl || 'Internal Adapter'}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getTierColor(s.type)}`}>
                            {s.type}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-zinc-400">{s.collectionMethod}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-900 dark:text-zinc-200 font-bold">{s.trustScore.toFixed(1)}/10</span>
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => handleAdjustTrust(s.id, -0.2)}
                                className="w-4 h-4 flex items-center justify-center bg-slate-200 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded text-[10px]"
                                title="Decrease trust"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleAdjustTrust(s.id, 0.2)}
                                className="w-4 h-4 flex items-center justify-center bg-slate-200 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded text-[10px]"
                                title="Increase trust"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          {s.failureCount > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Failing ({s.failureCount})
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Healthy
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-slate-500 dark:text-zinc-400 text-[11px]">
                          {s.lastSuccessAt ? new Date(s.lastSuccessAt).toLocaleTimeString() : 'Pending'}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleToggleSource(s.id, s.enabled)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                              s.enabled
                                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-zinc-500'
                            }`}
                          >
                            {s.enabled ? 'ON' : 'OFF'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* --- TAB CONTENT: DISCOVERED TRENDS LIST --- */
        <div className="space-y-4">
          {loading ? (
            <div className="double-bezel-outer">
              <div className="double-bezel-inner p-16 text-center text-slate-400 dark:text-zinc-400 font-mono text-sm">
                Loading developer trends...
              </div>
            </div>
          ) : displayedTrends.length === 0 ? (
            <div className="double-bezel-outer">
              <div className="double-bezel-inner p-16 text-center text-slate-400 dark:text-zinc-400 font-mono text-sm">
                {tabFilter === 'saved'
                  ? 'No saved trends yet. Click "Save" on any trend to bookmark and protect it from rotation.'
                  : 'No trends found matching filter criteria.'}
              </div>
            </div>
          ) : (
            displayedTrends.map((trend) => (
              <div key={trend.id} className="double-bezel-outer">
                <div className="double-bezel-inner p-5 sm:p-6 space-y-4">
                  {/* Row 1: Header, Scores, Save & Deep Research Buttons */}
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {trend.isSaved && (
                          <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Bookmark className="w-3 h-3 fill-current" />
                            Pinned
                          </span>
                        )}
                        <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-current" />
                          Score: {Math.round(trend.score)}/100
                        </span>
                        {trend.confidence && (
                          <span className="text-xs font-mono bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded-full">
                            {Math.round(trend.confidence)}% Confidence
                          </span>
                        )}
                        <span className="text-xs font-mono uppercase text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white/[0.08]">
                          {trend.status}
                        </span>
                        {trend.topics?.map((item: any) => (
                          <span
                            key={item.topicId}
                            className="text-[11px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20"
                          >
                            #{item.topic?.name || 'AI'}
                          </span>
                        ))}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                        <Link href={`/trends/${trend.id}`}>{trend.title}</Link>
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">{trend.summary}</p>

                      {trend.whatChanged && (
                        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-xl p-3 text-xs text-slate-700 dark:text-zinc-300">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">What Changed: </span>
                          {trend.whatChanged}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-start">
                      <button
                        onClick={(e) => handleToggleSave(trend.id, Boolean(trend.isSaved), e)}
                        title={trend.isSaved ? 'Unpin / Remove from Saved' : 'Save & Pin (protects from replacement)'}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                          trend.isSaved
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30'
                            : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-400 hover:text-amber-700 dark:hover:text-amber-300 hover:border-amber-500/40'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${trend.isSaved ? 'fill-current' : ''}`} />
                        <span>{trend.isSaved ? 'Pinned' : 'Pin'}</span>
                      </button>

                      <Link
                        href={`/trends/${trend.id}`}
                        className="btn-island-primary !text-xs !py-1.5 !px-3 !gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Research &amp; Draft</span>
                      </Link>
                    </div>
                  </div>

                  {/* Row 2: 7-Factor Transparent Scoring Formula Breakdown */}
                  <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 dark:text-zinc-500 block text-[10px]">Dev Relevance (25%)</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{trend.developerRelevanceScore || 7}/10</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-zinc-500 block text-[10px]">Velocity (20%)</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">{trend.velocityScore || trend.freshnessScore || 7}/10</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-zinc-500 block text-[10px]">Novelty (15%)</span>
                      <span className="text-slate-800 dark:text-zinc-200 font-bold">{trend.noveltyScore || 7}/10</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-zinc-500 block text-[10px]">Authority (15%)</span>
                      <span className="text-purple-600 dark:text-purple-400 font-bold">{trend.sourceAuthorityScore || trend.credibilityScore || 8}/10</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-zinc-500 block text-[10px]">Cross-Source (10%)</span>
                      <span className="text-sky-600 dark:text-sky-400 font-bold">{trend.crossSourceScore || 7}/10</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-zinc-500 block text-[10px]">Tech Depth (10%)</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{trend.technicalDepthScore || 7.5}/10</span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-zinc-500 block text-[10px]">Content Potential (5%)</span>
                      <span className="text-slate-800 dark:text-zinc-200 font-bold">{trend.contentPotentialScore || 8}/10</span>
                    </div>
                  </div>

                  {/* Row 3: Recommended Angle Quote */}
                  {trend.recommendedAngle && (
                    <div className="text-xs bg-slate-50 dark:bg-white/[0.02] border-l-2 border-emerald-500 pl-3 py-1.5 italic text-slate-700 dark:text-zinc-300 rounded-r-lg">
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 not-italic font-bold">Recommended Angle: </span>
                      &ldquo;{trend.recommendedAngle}&rdquo;
                    </div>
                  )}

                  {/* Row 4: Scoring Reason & Multi-Tier Evidence Breakdown */}
                  <div className="text-xs text-slate-500 dark:text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200 dark:border-white/[0.04] pt-3">
                    <p className="italic text-[11px]">
                      <span className="font-mono text-slate-400 dark:text-zinc-500 not-italic">Scoring Rationale: </span>
                      {trend.scoreReason || 'Evaluated across multi-tier consensus and developer code velocity.'}
                    </p>
                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 dark:text-zinc-500 flex-shrink-0">
                      <span>{trend.evidences?.length || 1} independent signals</span>
                      &bull;
                      <span>First detected {new Date(trend.firstDetectedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
