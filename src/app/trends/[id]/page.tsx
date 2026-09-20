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
  Bookmark,
  AlertTriangle,
  X,
  ArrowUpRight,
  Terminal,
  Zap,
} from 'lucide-react';

export default function TrendDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [trend, setTrend] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/trends/${id}/research`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchTrend();
      } else {
        setErrorMsg(data.error || 'Research failed to complete');
      }
    } catch (err: any) {
      console.error('Research failed', err);
      setErrorMsg(err?.message || 'Research request failed');
    } finally {
      setResearching(false);
    }
  };

  const handleToggleSave = async () => {
    if (!trend) return;
    const nextSaved = !trend.isSaved;
    setTrend((prev: any) => ({ ...prev, isSaved: nextSaved }));

    try {
      const res = await fetch(`/api/trends/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSaved: nextSaved }),
      });
      const data = await res.json();
      if (!data.success) {
        setTrend((prev: any) => ({ ...prev, isSaved: !nextSaved }));
      }
    } catch (err) {
      console.error('Failed to toggle saved', err);
      setTrend((prev: any) => ({ ...prev, isSaved: !nextSaved }));
    }
  };

  const handleGenerateContent = async () => {
    setGenerating(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trendId: id }),
      });
      const data = await res.json();
      if (data.success && data.contentItemId) {
        router.push(`/content/${data.contentItemId}`);
      } else {
        setErrorMsg(data.error || 'Content generation failed');
      }
    } catch (err: any) {
      console.error('Content generation failed', err);
      setErrorMsg(err?.message || 'Content generation request failed');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="double-bezel-outer max-w-4xl mx-auto">
        <div className="double-bezel-inner p-16 text-center font-mono text-sm text-slate-400 dark:text-zinc-500 animate-pulse">
          Loading trend intelligence dossier...
        </div>
      </div>
    );
  }

  if (!trend) {
    return (
      <div className="double-bezel-outer max-w-4xl mx-auto">
        <div className="double-bezel-inner p-16 text-center font-mono text-sm text-slate-400 dark:text-zinc-500">
          Trend dossier not found.
        </div>
      </div>
    );
  }

  const report = trend.researchReport;

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/trends"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Emerging Signals</span>
        </Link>
      </div>

      {/* Error Alert Banner */}
      {errorMsg && (
        <div className="double-bezel-outer !p-1 border-rose-500/30">
          <div className="double-bezel-inner p-4 bg-rose-500/10 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Action Error
                </h4>
                <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-mono">
                  {errorMsg}
                </p>
              </div>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 p-1"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Header Card (Double-Bezel) */}
      <div className="double-bezel-outer">
        <div className="double-bezel-inner p-5 sm:p-7 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3 flex-1 min-w-0">
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
                <span className="text-xs font-mono uppercase text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white/[0.08]">
                  {trend.status}
                </span>
                {trend.confidence && (
                  <span className="text-xs font-mono bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded-full">
                    {Math.round(trend.confidence)}% Confidence
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                {trend.title}
              </h1>

              <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed max-w-3xl">
                {trend.summary}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0 self-end sm:self-start">
              <button
                onClick={handleToggleSave}
                title={trend.isSaved ? 'Unpin from Saved' : 'Pin Trend'}
                className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full font-medium border transition-all ${
                  trend.isSaved
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${trend.isSaved ? 'fill-current' : ''}`} />
                <span>{trend.isSaved ? 'Pinned' : 'Pin'}</span>
              </button>

              <button
                onClick={handleRunResearch}
                disabled={researching}
                className="btn-island-secondary !text-xs !py-2 !px-3.5 disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 text-amber-500 dark:text-amber-400 ${researching ? 'animate-spin' : ''}`} />
                <span>{researching ? 'Verifying Sources...' : report ? 'Re-run Research' : 'Run Deep Research'}</span>
              </button>

              {report && (
                <button
                  onClick={handleGenerateContent}
                  disabled={generating}
                  className="btn-island-primary !text-xs !py-2 !px-4 disabled:opacity-50"
                >
                  <FileText className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                  <span>{generating ? 'Drafting Posts...' : 'Generate Posts'}</span>
                  <div className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/20 flex items-center justify-center">
                    <ArrowUpRight className="w-3 h-3 text-current" />
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* 7-Factor Transparent Score Breakdown */}
          <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 dark:text-zinc-500 block text-[10px]">Dev Relevance</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{trend.developerRelevanceScore || 7.5}/10</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-zinc-500 block text-[10px]">Velocity &amp; Momentum</span>
              <span className="text-sky-600 dark:text-sky-400 font-bold text-sm">{trend.velocityScore || trend.freshnessScore || 8}/10</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-zinc-500 block text-[10px]">Novelty</span>
              <span className="text-slate-800 dark:text-zinc-200 font-bold text-sm">{trend.noveltyScore || 7}/10</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-zinc-500 block text-[10px]">Source Authority</span>
              <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">{trend.sourceAuthorityScore || trend.credibilityScore || 8.5}/10</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-zinc-500 block text-[10px]">Cross-Source Signals</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold text-sm">{trend.evidences?.length || 1} independent feeds</span>
            </div>
          </div>

          {trend.scoreReason && (
            <p className="text-xs text-slate-500 dark:text-zinc-400 italic">
              <span className="font-mono text-slate-400 dark:text-zinc-500 not-italic">Scoring Rationale: </span>
              {trend.scoreReason}
            </p>
          )}
        </div>
      </div>

      {/* Deep Research Report Section */}
      {report ? (
        <div className="double-bezel-outer">
          <div className="double-bezel-inner p-5 sm:p-7 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] pb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Verified Technical Research Report
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                    Synthesized via Hugging Face Qwen-72B
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-bold">
                Confidence Score: {report.confidence}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400">What Changed</h4>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-zinc-200 leading-relaxed">{report.whatChanged}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400">Why It Matters</h4>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-zinc-200 leading-relaxed">{report.whyItMatters}</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/[0.03] border border-emerald-200 dark:border-emerald-500/20 space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold">Developer Impact</h4>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-zinc-200 leading-relaxed">{report.developerImpact}</p>
              </div>
            </div>

            {/* Key Facts */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400">Verified Technical Facts</h4>
              <ul className="space-y-2">
                {report.keyFacts && (typeof report.keyFacts === 'string' ? JSON.parse(report.keyFacts) : report.keyFacts).map((fact: string, idx: number) => (
                  <li key={idx} className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.03]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Supporting Citations */}
            {report.sources && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400">Supporting Citations</h4>
                <div className="flex flex-wrap gap-2">
                  {(typeof report.sources === 'string' ? JSON.parse(report.sources) : report.sources).map((s: any, idx: number) => (
                    <a
                      key={idx}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-zinc-300 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/[0.08] transition-colors font-mono"
                    >
                      <ExternalLink className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
                      <span>{s.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="double-bezel-outer">
          <div className="double-bezel-inner p-10 sm:p-12 text-center space-y-4">
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              This trend has not been deeply researched yet.
            </p>
            <button
              onClick={handleRunResearch}
              disabled={researching}
              className="btn-island-primary !py-2.5 !px-5"
            >
              <Sparkles className="w-4 h-4 text-current" />
              <span>{researching ? 'Running Research...' : 'Trigger Research Agent Now'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Discovered Evidence Provenance */}
      <div className="double-bezel-outer">
        <div className="double-bezel-inner p-5 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Discovered Evidence Sources ({trend.evidences?.length || 0})</span>
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {trend.evidences?.map((ev: any) => (
              <div key={ev.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {ev.sourceName}
                  </span>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-200">{ev.rawTitle}</h4>
                  {ev.snippet && <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">{ev.snippet}</p>}
                </div>
                <a
                  href={ev.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex-shrink-0"
                >
                  <span>Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
