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
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-cyan-400" />
          Content Analytics &amp; Feedback Loop
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Post-publication metrics and automated feedback insights for continuous content refinement.
        </p>
      </div>

      {loading ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center text-zinc-400 font-mono text-sm">
          Loading analytics...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <span className="text-xs font-mono uppercase text-zinc-400">Total Publications</span>
              <div className="text-3xl font-bold text-white font-mono mt-2">
                {data?.stats?.totalPublications || 0}
              </div>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <span className="text-xs font-mono uppercase text-zinc-400">LinkedIn Posts</span>
              <div className="text-3xl font-bold text-blue-400 font-mono mt-2">
                {data?.stats?.linkedinCount || 0}
              </div>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <span className="text-xs font-mono uppercase text-zinc-400">X (Twitter) Posts</span>
              <div className="text-3xl font-bold text-sky-400 font-mono mt-2">
                {data?.stats?.xCount || 0}
              </div>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <span className="text-xs font-mono uppercase text-zinc-400">Publication Success</span>
              <div className="text-3xl font-bold text-emerald-400 font-mono mt-2">
                {data?.stats?.publicationSuccessRate || '100%'}
              </div>
            </div>
          </div>

          {/* AI Content Feedback Loop Section */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#30363d] pb-3">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-semibold text-white">AI Content Feedback Insights</h3>
            </div>
            <p className="text-xs text-zinc-400">
              The agent continuously observes engagement trends and surfaces actionable recommendations without altering your personal voice profile without consent:
            </p>

            <div className="space-y-3">
              {data?.insights?.map((insight: string, idx: number) => (
                <div key={idx} className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-zinc-200 leading-relaxed font-sans">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
