import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowUpRight,
  Flame,
  FileText,
  Radio,
  Cpu,
  ShieldCheck,
  Zap,
  Globe,
  Layers,
  CheckCircle2,
  Terminal,
  Activity,
  Compass,
  Database,
  Share2,
  Settings,
} from 'lucide-react';
import { prisma } from '@/packages/database';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Fetch real telemetry from database for live bento grid
  const [trendsCount, contentCount, publishedCount, topTrends] = await Promise.all([
    prisma.trend.count(),
    prisma.contentItem.count(),
    prisma.publication.count({ where: { status: 'PUBLISHED' } }),
    prisma.trend.findMany({
      take: 4,
      orderBy: { score: 'desc' },
      include: { evidences: true, researchReport: true },
    }),
  ]);

  return (
    <div className="space-y-24 sm:space-y-32 md:space-y-44">
      {/* =========================================================================
          1. ATTENTION (HERO SECTION)
          AIDA: Wide 2-line display typography, live engine pulse, nested CTAs
      ========================================================================= */}
      <section className="relative pt-4 sm:pt-8 md:pt-12 text-center flex flex-col items-center">
        {/* Subtle Ambient Orb Glow behind Hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[22rem] sm:w-[35rem] h-[16rem] sm:h-[20rem] bg-emerald-500/10 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none -z-10" />

        {/* Live Engine Telemetry Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-white/[0.04] border border-emerald-500/20 dark:border-white/[0.08] shadow-sm mb-6 sm:mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] sm:text-xs font-mono tracking-wider text-emerald-700 dark:text-emerald-300 uppercase font-semibold">
            AUTONOMOUS AGENT ENGINE • 24 STREAMS ACTIVE
          </span>
        </div>

        {/* Wide 2-Line Headline */}
        <h1 className="max-w-5xl text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-gradient-silver leading-[1.12] mb-5 sm:mb-6 px-2">
          Autonomous intelligence discovering tech trends &amp; crafting developer content.
        </h1>

        {/* Subtitle with High-Legibility Whitespace */}
        <p className="max-w-2xl text-sm sm:text-base md:text-lg text-slate-600 dark:text-zinc-400 font-normal leading-relaxed mb-8 sm:mb-10 px-4">
          Scans 24 verified sources across ArXiv, GitHub, Hacker News, and top AI engineers.
          Extracts verified facts with Qwen-72B and synthesizes authentic LinkedIn and X posts.
        </p>

        {/* Dual High-Contrast Nested CTAs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none px-4">
          <Link href="/dashboard" className="btn-island-primary justify-center w-full sm:w-auto">
            <span>Launch Mission Control</span>
            <div className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/20 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5 text-current" />
            </div>
          </Link>

          <Link href="/trends" className="btn-island-secondary justify-center w-full sm:w-auto">
            <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Explore Emerging Signals</span>
          </Link>
        </div>

        {/* Floating Metrics Strip */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-4xl px-2">
          {[
            { label: 'Discovered Trends', value: `${trendsCount}+`, detail: '7-Factor Scored' },
            { label: 'Synthesized Posts', value: `${contentCount}`, detail: 'LinkedIn & X' },
            { label: 'Published Variants', value: `${publishedCount}`, detail: 'Multi-Channel' },
            { label: 'Inference Engine', value: '72B', detail: 'Hugging Face Free' },
          ].map((stat, i) => (
            <div
              key={i}
              className="double-bezel-outer text-left p-1"
            >
              <div className="double-bezel-inner p-3.5 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mt-0.5">{stat.label}</div>
                <div className="text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-zinc-500 mt-1">{stat.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          2. INTEREST (INTERACTIVE PIPELINE VISUALIZATION)
          Demonstrates the 5-Stage Autonomous Architecture
      ========================================================================= */}
      <section className="space-y-8 sm:space-y-10">
        <div className="text-center max-w-3xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono uppercase tracking-wider mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>PIPELINE ORCHESTRATION</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            From raw repository commit to published technical post.
          </h2>
          <p className="text-slate-600 dark:text-zinc-400 mt-3 text-sm sm:text-base">
            Zero hallucinations. Every post is anchored in verified source evidence and evaluated through a 5-pillar developer quality gate.
          </p>
        </div>

        {/* 5-Stage Pipeline Flow Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            {
              step: '01',
              title: 'Multi-Source Radar',
              desc: 'Continuous ingestion across 24 channels: GitHub velocity, ArXiv preprints, HN, Reddit, and Top AI engineers.',
              icon: Globe,
              color: 'text-emerald-600 dark:text-emerald-400',
              bg: 'bg-emerald-500/10',
            },
            {
              step: '02',
              title: 'Signal Scoring',
              desc: 'Transparent 7-factor formula measuring developer relevance, velocity, novelty, and cross-source authority.',
              icon: Zap,
              color: 'text-amber-600 dark:text-amber-400',
              bg: 'bg-amber-500/10',
            },
            {
              step: '03',
              title: 'Deep Research',
              desc: 'Qwen-72B reads raw READMEs, code repos, and paper abstracts to extract genuine technical changes.',
              icon: Terminal,
              color: 'text-sky-600 dark:text-sky-400',
              bg: 'bg-sky-500/10',
            },
            {
              step: '04',
              title: 'Platform Synthesis',
              desc: 'Generates structured 5-pillar LinkedIn posts and 5-tweet X threads with FLUX visual architecture cards.',
              icon: FileText,
              color: 'text-purple-600 dark:text-purple-400',
              bg: 'bg-purple-500/10',
            },
            {
              step: '05',
              title: 'Quality & Publish',
              desc: 'Autonomous verification for banned buzzwords, readability, and character limits before multi-channel publishing.',
              icon: ShieldCheck,
              color: 'text-rose-600 dark:text-rose-400',
              bg: 'bg-rose-500/10',
            },
          ].map((stage, i) => {
            const Icon = stage.icon;
            return (
              <div key={i} className="double-bezel-outer">
                <div className="double-bezel-inner p-4 sm:p-5 h-full flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 sm:p-2.5 rounded-xl ${stage.bg} ${stage.color}`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-xs font-mono text-slate-400 dark:text-zinc-500 font-bold">{stage.step}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight">{stage.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1.5 leading-relaxed">{stage.desc}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-white/[0.04] flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Autonomous</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          3. DESIRE (GAPLESS LIVE BENTO GRID)
      ========================================================================= */}
      <section className="space-y-8 sm:space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-mono uppercase tracking-wider mb-2">
              <Activity className="w-3.5 h-3.5" />
              <span>LIVE TELEMETRY BENTO</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Real-time intelligence from the frontier.
            </h2>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline group"
          >
            <span>OPEN FULL MISSION CONTROL</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Gapless Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Card 1: Live Top Emerging Trend Spotlight */}
          {topTrends[0] && (
            <div className="md:col-span-2 md:row-span-2 double-bezel-outer">
              <div className="double-bezel-inner p-5 sm:p-7 md:p-8 h-full flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-mono font-semibold flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      TOP EMERGING SIGNAL • SCORE {Math.round(topTrends[0].score)}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-zinc-500">
                      {topTrends[0].evidences.length} Citations
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                    {topTrends[0].title}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-zinc-300 mt-3 sm:mt-4 leading-relaxed line-clamp-3">
                    {topTrends[0].summary}
                  </p>

                  {/* 7-Factor Scoring Micro-Bars */}
                  <div className="mt-5 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] space-y-2">
                    <div className="text-[11px] font-mono text-slate-600 dark:text-zinc-400 flex justify-between">
                      <span>Developer Relevance</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {topTrends[0].developerRelevanceScore.toFixed(1)}/10
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 dark:bg-emerald-400 h-full rounded-full"
                        style={{ width: `${topTrends[0].developerRelevanceScore * 10}%` }}
                      />
                    </div>

                    <div className="text-[11px] font-mono text-slate-600 dark:text-zinc-400 flex justify-between pt-1">
                      <span>Velocity &amp; Momentum</span>
                      <span className="text-sky-600 dark:text-sky-400 font-bold">
                        {topTrends[0].velocityScore.toFixed(1)}/10
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-500 dark:bg-sky-400 h-full rounded-full"
                        style={{ width: `${topTrends[0].velocityScore * 10}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                  <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                    Status: <span className="text-emerald-600 dark:text-emerald-400 uppercase font-semibold">{topTrends[0].status}</span>
                  </span>
                  <Link
                    href={`/trends/${topTrends[0].id}`}
                    className="btn-island-primary !text-xs !py-1.5 !px-3 !gap-1.5"
                  >
                    <span>View Dossier</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Card 2: 24-Source Authority Radar Breakdown */}
          <div className="md:col-span-1 double-bezel-outer">
            <div className="double-bezel-inner p-4 sm:p-5 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-2">
                  <Database className="w-4 h-4" />
                  <span>5-TIER TRUST HIERARCHY</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Multi-Source Feeds</h4>
                <div className="mt-3 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-white/[0.04]">
                    <span className="text-slate-600 dark:text-zinc-400">Tier 1 Primary Labs</span>
                    <span className="text-emerald-600 dark:text-emerald-300 font-bold">6 Feeds</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-white/[0.04]">
                    <span className="text-slate-600 dark:text-zinc-400">Tier 2 ArXiv Preprints</span>
                    <span className="text-sky-600 dark:text-sky-300 font-bold">4 Feeds</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-white/[0.04]">
                    <span className="text-slate-600 dark:text-zinc-400">Tier 3 Dev &amp; Engineers</span>
                    <span className="text-purple-600 dark:text-purple-300 font-bold">9 Feeds</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 dark:text-zinc-400">Tier 4-5 Social &amp; News</span>
                    <span className="text-amber-600 dark:text-amber-300 font-bold">5 Feeds</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/[0.04] text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                Idempotent SHA-256 deduplication
              </div>
            </div>
          </div>

          {/* Card 3: AI Visual Studio Teaser */}
          <div className="md:col-span-1 double-bezel-outer">
            <div className="double-bezel-inner p-4 sm:p-5 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-purple-600 dark:text-purple-400 mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>FREE FLUX.1 ENGINE</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Visual Studio</h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  Generates 1200×630 developer architecture diagrams and benchmark visuals with zero API costs.
                </p>
                <div className="mt-3 p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                  Ratio: 1200 × 630 • PNG • LinkedIn / X
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/[0.04] text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Zero-Key Serverless Fallback</span>
              </div>
            </div>
          </div>

          {/* Card 4: Transparent 7-Factor Scoring Formula */}
          <div className="md:col-span-2 double-bezel-outer">
            <div className="double-bezel-inner p-5 sm:p-6 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    DETERMINISTIC RANKING ALGORITHM
                  </span>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">100-POINT SCALE</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                  Transparent 7-Factor Trend Scoring
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                  Filters out spam and marketing fluff, highlighting genuine developer value.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                  {[
                    { name: 'Developer Impact', weight: '25%' },
                    { name: 'Velocity', weight: '20%' },
                    { name: 'Novelty', weight: '15%' },
                    { name: 'Authority', weight: '15%' },
                  ].map((f, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04]">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{f.weight}</div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 mt-0.5">{f.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/[0.04] flex items-center justify-between text-xs font-mono text-slate-500 dark:text-zinc-500">
                <span>+ Cross-Source (10%), Technical Depth (10%), Content Potential (5%)</span>
                <Link href="/trends" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                  View Trends →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. ACTION (AWWWARDS-TIER CALL TO ACTION)
      ========================================================================= */}
      <section className="double-bezel-outer">
        <div className="double-bezel-inner p-6 sm:p-12 md:p-16 text-center flex flex-col items-center relative overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-purple-500/10 opacity-50 pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-5 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] text-xs font-mono text-slate-700 dark:text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>READY FOR AUTONOMOUS DEPLOYMENT</span>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight px-2">
              Start monitoring frontier AI &amp; automating high-signal content.
            </h2>

            <p className="text-slate-600 dark:text-zinc-400 text-sm sm:text-base max-w-xl mx-auto px-4">
              Equipped with free Hugging Face inference (Qwen-72B), FLUX visual generation, and official LinkedIn and X REST API publishers.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none mx-auto">
              <Link href="/dashboard" className="btn-island-primary !text-sm sm:!text-base !py-3 !px-6 justify-center">
                <span>Enter Mission Control</span>
                <div className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/20 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-current" />
                </div>
              </Link>
              <Link href="/settings" className="btn-island-secondary !text-sm sm:!text-base !py-3 !px-6 justify-center">
                <Settings className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                <span>Configure API Keys</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
