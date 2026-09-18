'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, RefreshCw, ArrowRight, ExternalLink, Sparkles, Filter, Bookmark } from 'lucide-react';

export default function TrendsPage() {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [minScoreFilter, setMinScoreFilter] = useState(0);
  const [tabFilter, setTabFilter] = useState<'all' | 'saved'>('all');

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

  useEffect(() => {
    fetchTrends();
  }, [minScoreFilter]);

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

  const savedTrends = trends.filter((t) => t.isSaved);
  const displayedTrends = tabFilter === 'saved' ? savedTrends : trends;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-400" />
            Discovered Technology Trends
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Normalized, deduplicated, and ranked using transparent 5-factor scoring.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Tab filter: All vs Saved */}
          <div className="flex items-center bg-[#161b22] rounded-lg p-0.5 border border-[#30363d]">
            <button
              onClick={() => setTabFilter('all')}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
                tabFilter === 'all'
                  ? 'bg-[#21262d] text-emerald-400 font-semibold shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({trends.length})
            </button>
            <button
              onClick={() => setTabFilter('saved')}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors flex items-center gap-1.5 ${
                tabFilter === 'saved'
                  ? 'bg-[#21262d] text-amber-400 font-semibold shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              Saved ({savedTrends.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Min Score:</span>
            <select
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(Number(e.target.value))}
              className="bg-[#161b22] border border-[#30363d] text-zinc-300 text-xs rounded-lg px-3 py-1.5 font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value={0}>All Scores (0+)</option>
              <option value={70}>High-Signal (70+)</option>
              <option value={85}>Top Picks (85+)</option>
              <option value={90}>Tier 1 (90+)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trends List */}
      {loading ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center text-zinc-400 font-mono text-sm">
          Loading trends...
        </div>
      ) : displayedTrends.length === 0 ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center text-zinc-400 font-mono text-sm">
          {tabFilter === 'saved'
            ? 'No saved trends yet. Click "Save" on any trend to bookmark and pin it.'
            : 'No trends found matching filter criteria.'}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedTrends.map((trend) => (
            <div
              key={trend.id}
              className={`bg-[#161b22] border rounded-xl p-5 transition-all space-y-4 ${
                trend.isSaved ? 'border-amber-500/40 shadow-sm shadow-amber-500/5' : 'border-[#30363d] hover:border-zinc-500/50'
              }`}
            >
              {/* Row 1: Title, Score Badge, Actions */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {trend.isSaved && (
                      <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                        <Bookmark className="w-3 h-3 fill-current" />
                        Saved
                      </span>
                    )}
                    <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                      Score: {Math.round(trend.score)}/100
                    </span>
                    <span className="text-xs font-mono uppercase text-zinc-400 bg-[#21262d] px-2 py-0.5 rounded border border-[#30363d]">
                      {trend.status}
                    </span>
                    {trend.topics?.map((item: any) => (
                      <span
                        key={item.topicId}
                        className="text-[11px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20"
                      >
                        #{item.topic?.name || 'AI'}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-base font-semibold text-white hover:text-emerald-400 transition-colors">
                    <Link href={`/trends/${trend.id}`}>{trend.title}</Link>
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">{trend.summary}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => handleToggleSave(trend.id, Boolean(trend.isSaved), e)}
                    title={trend.isSaved ? 'Unpin / Remove from Saved' : 'Save & Pin (protects from replacement)'}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${
                      trend.isSaved
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30'
                        : 'bg-[#21262d] border-[#30363d] text-zinc-400 hover:text-amber-300 hover:border-amber-500/40'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${trend.isSaved ? 'fill-current' : ''}`} />
                    <span>{trend.isSaved ? 'Saved' : 'Save'}</span>
                  </button>
                  <Link
                    href={`/trends/${trend.id}`}
                    className="flex items-center gap-1.5 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Deep Research &amp; Draft
                  </Link>
                </div>
              </div>

              {/* Row 2: 5-Factor Score Breakdown */}
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
                <div>
                  <span className="text-zinc-500 block">Freshness</span>
                  <span className="text-zinc-200 font-bold">{trend.freshnessScore}/10</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Dev Relevance</span>
                  <span className="text-emerald-400 font-bold">{trend.developerRelevanceScore}/10</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Engagement</span>
                  <span className="text-zinc-200 font-bold">{trend.engagementScore}/10</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Novelty</span>
                  <span className="text-zinc-200 font-bold">{trend.noveltyScore}/10</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Credibility</span>
                  <span className="text-zinc-200 font-bold">{trend.credibilityScore}/10</span>
                </div>
              </div>

              {/* Row 3: Transparent Scoring Explanation & Evidence Provenance */}
              <div className="text-xs text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#30363d] pt-3">
                <p className="italic">
                  <span className="font-mono text-zinc-500 not-italic">Scoring Reason: </span>
                  {trend.scoreReason || 'Evaluated across multi-source consensus.'}
                </p>
                <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500 flex-shrink-0">
                  <span>{trend.evidences?.length || 1} independent sources</span>
                  &bull;
                  <span>First detected {new Date(trend.firstDetectedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
