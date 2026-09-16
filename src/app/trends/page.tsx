'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, RefreshCw, ArrowRight, ExternalLink, Sparkles, Filter } from 'lucide-react';

export default function TrendsPage() {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [minScoreFilter, setMinScoreFilter] = useState(0);

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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-400" />
            Discovered Technology Trends
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Normalized, deduplicated, and ranked using transparent 5-factor scoring.
          </p>
        </div>

        {/* Score filter */}
        <div className="flex items-center gap-3">
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

      {/* Trends List */}
      {loading ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center text-zinc-400 font-mono text-sm">
          Loading trends...
        </div>
      ) : trends.length === 0 ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center text-zinc-400 font-mono text-sm">
          No trends found matching filter criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {trends.map((trend) => (
            <div
              key={trend.id}
              className="bg-[#161b22] border border-[#30363d] hover:border-zinc-500/50 rounded-xl p-5 transition-all space-y-4"
            >
              {/* Row 1: Title, Score Badge, Actions */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
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
