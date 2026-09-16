'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Flame,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Send,
} from 'lucide-react';

export default function TrendDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [trend, setTrend] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchTrend = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/trends/${id}`);
      const data = await res.json();
      if (data.success) {
        setTrend(data.trend);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTrend();
  }, [id]);

  const handleRunResearch = async () => {
    setResearching(true);
    try {
      const res = await fetch(`/api/trends/${id}/research`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchTrend();
      }
    } catch (err) {
      console.error('Research failed', err);
    } finally {
      setResearching(false);
    }
  };

  const handleGenerateContent = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trendId: id }),
      });
      const data = await res.json();
      if (data.success && data.contentItemId) {
        router.push(`/content/${data.contentItemId}`);
      }
    } catch (err) {
      console.error('Content generation failed', err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center font-mono text-sm text-zinc-500">
        Loading trend details...
      </div>
    );
  }

  if (!trend) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center font-mono text-sm text-zinc-500">
        Trend not found.
      </div>
    );
  }

  const report = trend.researchReport;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/trends"
          className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Trends
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                Trend Score: {Math.round(trend.score)}/100
              </span>
              <span className="text-xs font-mono uppercase text-zinc-400 bg-[#21262d] px-2 py-0.5 rounded border border-[#30363d]">
                {trend.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{trend.title}</h2>
            <p className="text-sm text-zinc-300">{trend.summary}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunResearch}
              disabled={researching}
              className="flex items-center gap-2 bg-[#21262d] hover:bg-[#30363d] text-zinc-200 border border-[#30363d] px-4 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              <Sparkles className={`w-3.5 h-3.5 ${researching ? 'animate-spin' : 'text-amber-400'}`} />
              {researching ? 'Verifying Sources...' : report ? 'Re-run Research' : 'Run Technical Research'}
            </button>

            {report && (
              <button
                onClick={handleGenerateContent}
                disabled={generating}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors shadow-lg shadow-emerald-950/20"
              >
                <FileText className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Drafting Posts...' : 'Generate Platform Posts'}
              </button>
            )}
          </div>
        </div>

        {/* Transparent Score Breakdown */}
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

        <p className="text-xs text-zinc-400 italic">
          <span className="font-mono text-zinc-500 not-italic">Scoring Reason: </span>
          {trend.scoreReason}
        </p>
      </div>

      {/* Research Report Section */}
      {report ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Verified Technical Research Report
            </h3>
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded">
              Confidence Score: {report.confidence}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <h4 className="text-xs font-mono uppercase text-zinc-400">What Changed</h4>
              <p className="text-xs text-zinc-200 leading-relaxed">{report.whatChanged}</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-mono uppercase text-zinc-400">Why It Matters</h4>
              <p className="text-xs text-zinc-200 leading-relaxed">{report.whyItMatters}</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-mono uppercase text-emerald-400">Developer Impact</h4>
              <p className="text-xs text-zinc-200 leading-relaxed">{report.developerImpact}</p>
            </div>
          </div>

          {/* Key Facts */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase text-zinc-400">Verified Key Facts</h4>
            <ul className="space-y-1.5">
              {report.keyFacts?.map((fact: string, idx: number) => (
                <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                  <span className="text-emerald-400 font-mono font-bold mt-0.5">&bull;</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Uncertainties */}
          {report.uncertainties && report.uncertainties.length > 0 && (
            <div className="space-y-2 bg-[#0d1117] border border-amber-500/20 rounded-lg p-3">
              <h4 className="text-xs font-mono uppercase text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Uncertainties &amp; Caveats
              </h4>
              <ul className="space-y-1">
                {report.uncertainties.map((u: string, idx: number) => (
                  <li key={idx} className="text-xs text-zinc-400">
                    - {u}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Supporting Citations */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase text-zinc-400">Supporting Citations</h4>
            <div className="flex flex-wrap gap-2">
              {report.sources?.map((s: any, idx: number) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-[#0d1117] hover:bg-[#21262d] text-zinc-300 px-3 py-1.5 rounded border border-[#30363d] transition-colors"
                >
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center space-y-3">
          <p className="text-sm text-zinc-400">
            This trend has not been deeply researched yet.
          </p>
          <button
            onClick={handleRunResearch}
            disabled={researching}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4 text-white" />
            {researching ? 'Running Research...' : 'Trigger Research Agent Now'}
          </button>
        </div>
      )}

      {/* Supporting Evidence Provenance */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Discovered Evidence Sources ({trend.evidences?.length || 0})</h3>
        <div className="divide-y divide-[#30363d]">
          {trend.evidences?.map((ev: any) => (
            <div key={ev.id} className="py-3 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">{ev.sourceName}</span>
                <h4 className="text-xs font-medium text-zinc-200">{ev.rawTitle}</h4>
                {ev.snippet && <p className="text-[11px] text-zinc-400">{ev.snippet}</p>}
              </div>
              <a
                href={ev.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1 flex-shrink-0"
              >
                Source <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
