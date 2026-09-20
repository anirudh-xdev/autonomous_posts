'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Sliders, Shield, Key, Save, CheckCircle2, AlertTriangle, Linkedin, Twitter, ExternalLink, Link2, Sparkles, ArrowUpRight } from 'lucide-react';

export default function SettingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [connectBanner, setConnectBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [technicalDepth, setTechnicalDepth] = useState(7);
  const [humorLevel, setHumorLevel] = useState(2);
  const [emojiLevel, setEmojiLevel] = useState(1);
  const [publishingMode, setPublishingMode] = useState('APPROVAL_REQUIRED');
  const [minTrendScore, setMinTrendScore] = useState(70);
  const [minQualityScore, setMinQualityScore] = useState(85);
  const [maxPostsPerDay, setMaxPostsPerDay] = useState(2);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.voice) {
          setTechnicalDepth(json.voice.technicalDepth || 7);
          setHumorLevel(json.voice.humorLevel || 2);
          setEmojiLevel(json.voice.emojiLevel || 1);
        }
        if (json.settings) {
          setPublishingMode(json.settings.publishingMode || 'APPROVAL_REQUIRED');
          setMinTrendScore(json.settings.minTrendScore || 70);
          setMinQualityScore(json.settings.minQualityScore || 85);
          setMaxPostsPerDay(json.settings.maxPostsPerDay || 2);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Check for OAuth redirect params in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const connected = params.get('connected');
      const name = params.get('name');
      const error = params.get('error');

      if (connected) {
        setConnectBanner({
          type: 'success',
          message: `🎉 Successfully connected ${connected === 'linkedin' ? 'LinkedIn' : 'X'} for ${name || 'your account'}! Live publishing is now active.`,
        });
        window.history.replaceState({}, '', window.location.pathname);
      } else if (error) {
        setConnectBanner({
          type: 'error',
          message: `⚠️ Connection failed: ${decodeURIComponent(error)}`,
        });
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice: {
            technicalDepth,
            humorLevel,
            emojiLevel,
          },
          settings: {
            publishingMode,
            minTrendScore,
            minQualityScore,
            maxPostsPerDay,
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="double-bezel-outer max-w-4xl mx-auto">
        <div className="double-bezel-inner p-16 text-center font-mono text-sm text-slate-400 dark:text-zinc-500 animate-pulse">
          Loading system telemetry and configurations...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* OAuth Connection Status Banner */}
      {connectBanner && (
        <div className="double-bezel-outer !p-1">
          <div
            className={`double-bezel-inner p-4 flex items-center justify-between text-xs sm:text-sm font-mono ${
              connectBanner.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              {connectBanner.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>{connectBanner.message}</span>
            </div>
            <button
              onClick={() => setConnectBanner(null)}
              className="text-xs opacity-70 hover:opacity-100 p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="double-bezel-outer">
        <div className="double-bezel-inner p-5 sm:p-7 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-mono uppercase tracking-wider mb-2 border border-slate-200 dark:border-white/[0.08] font-semibold">
              <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span>SYSTEM PREFERENCES</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              System Configuration &amp; Voice Profile
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1">
              Configure technical tone, thresholds for publication, and 1-Click social integrations.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-island-primary !py-2.5 !px-5 self-start sm:self-center disabled:opacity-50"
          >
            {saving ? (
              <span>Saving...</span>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Voice Persona Controls */}
        <div className="double-bezel-outer">
          <div className="double-bezel-inner p-5 sm:p-7 md:p-8 space-y-6 h-full flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Voice &amp; Persona Weights</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">Governs synthesis style in LLM prompts</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-slate-700 dark:text-zinc-300 font-semibold">
                    <span>Technical Depth:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{technicalDepth} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={technicalDepth}
                    onChange={(e) => setTechnicalDepth(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-200 dark:bg-[#05070B] cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-500 block">
                    1: High-level overview &bull; 10: Concrete architecture &amp; code
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-slate-700 dark:text-zinc-300 font-semibold">
                    <span>Humor &amp; Wit:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{humorLevel} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={humorLevel}
                    onChange={(e) => setHumorLevel(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-200 dark:bg-[#05070B] cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-500 block">
                    0: Academic &bull; 10: Conversational &amp; witty
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-slate-700 dark:text-zinc-300 font-semibold">
                    <span>Emoji Usage:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{emojiLevel} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={emojiLevel}
                    onChange={(e) => setEmojiLevel(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-200 dark:bg-[#05070B] cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-500 block">
                    0: Zero emojis &bull; 1: Maximum 1 &bull; 5: Expressive
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Automation Mode & Thresholds */}
        <div className="double-bezel-outer">
          <div className="double-bezel-inner p-5 sm:p-7 md:p-8 space-y-6 h-full flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Automation &amp; Safety Thresholds</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">Safeguards and quality requirements</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-700 dark:text-zinc-300 block font-semibold">Publishing Mode:</label>
                  <select
                    value={publishingMode}
                    onChange={(e) => setPublishingMode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#05070B] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-zinc-200 text-xs rounded-xl p-3 font-mono focus:outline-none focus:border-emerald-500 shadow-sm dark:shadow-specular"
                  >
                    <option value="MANUAL" className="bg-white text-slate-900 dark:bg-[#090D16] dark:text-zinc-200">MANUAL (Publishing triggered strictly by user)</option>
                    <option value="APPROVAL_REQUIRED" className="bg-white text-slate-900 dark:bg-[#090D16] dark:text-zinc-200">APPROVAL_REQUIRED (Drafts generated, review required)</option>
                    <option value="AUTOMATIC" className="bg-white text-slate-900 dark:bg-[#090D16] dark:text-zinc-200">AUTOMATIC (Auto-publish if score &gt; threshold &amp; verified)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-slate-700 dark:text-zinc-300 font-semibold">
                    <span>Minimum Trend Score to Research:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{minTrendScore} / 100</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={minTrendScore}
                    onChange={(e) => setMinTrendScore(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-200 dark:bg-[#05070B] cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-slate-700 dark:text-zinc-300 font-semibold">
                    <span>Minimum Quality Score to Approve:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{minQualityScore} / 100</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="98"
                    value={minQualityScore}
                    onChange={(e) => setMinQualityScore(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-200 dark:bg-[#05070B] cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-slate-700 dark:text-zinc-300 font-semibold">
                    <span>Maximum Posts Per Day:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{maxPostsPerDay} posts/day</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={maxPostsPerDay}
                    onChange={(e) => setMaxPostsPerDay(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-200 dark:bg-[#05070B] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* External Integration Status Cards */}
      <div className="double-bezel-outer">
        <div className="double-bezel-inner p-5 sm:p-7 md:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-white/[0.06]">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Official API Integrations (1-Click OAuth)</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">LinkedIn REST API &bull; X API v2</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* LinkedIn Integration Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-[#0077b5]/10 rounded-xl border border-[#0077b5]/30">
                    <Linkedin className="w-5 h-5 text-[#0077b5]" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white block">LinkedIn Official REST API</span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">Personal profile &amp; organization pages</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${
                    data?.integrations?.linkedin?.connected
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : data?.integrations?.linkedin?.configured
                      ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                  }`}
                >
                  {data?.integrations?.linkedin?.connected
                    ? 'Connected'
                    : data?.integrations?.linkedin?.configured
                    ? 'Ready to Connect'
                    : 'Needs Client ID'}
                </span>
              </div>

              <div className="border-t border-slate-200 dark:border-white/[0.04] pt-3">
                {data?.integrations?.linkedin?.connected ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs text-slate-800 dark:text-zinc-200 font-mono font-medium">
                        Connected: {data.integrations.linkedin.accountName}
                      </span>
                    </div>
                    <a
                      href="/api/auth/linkedin"
                      className="text-[11px] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white underline font-mono"
                    >
                      Reconnect
                    </a>
                  </div>
                ) : data?.integrations?.linkedin?.configured ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-zinc-400">
                      Your Client ID is set. Click below to authorize posting to your LinkedIn profile.
                    </p>
                    <a
                      href="/api/auth/linkedin"
                      className="btn-island-primary !bg-[#0077b5] !text-white !py-2 !px-4"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span>Connect LinkedIn (1-Click OAuth)</span>
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-zinc-500 font-mono">
                    Add <code>LINKEDIN_CLIENT_ID</code> to your <code>.env</code> file.
                  </p>
                )}
              </div>
            </div>

            {/* X (Twitter) Integration Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-slate-200 dark:bg-white/[0.05] rounded-xl border border-slate-300 dark:border-white/[0.1]">
                    <Twitter className="w-5 h-5 text-slate-800 dark:text-zinc-200" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white block">X (Twitter) Official API v2</span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">Single tweets &amp; connected reply threads</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${
                    data?.integrations?.x?.connected
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : data?.integrations?.x?.configured
                      ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                  }`}
                >
                  {data?.integrations?.x?.connected
                    ? 'Connected'
                    : data?.integrations?.x?.configured
                    ? 'Ready to Connect'
                    : 'Needs Client ID'}
                </span>
              </div>

              <div className="border-t border-slate-200 dark:border-white/[0.04] pt-3">
                {data?.integrations?.x?.connected ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs text-slate-800 dark:text-zinc-200 font-mono font-medium">
                        Connected: @{data.integrations.x.username || data.integrations.x.accountName}
                      </span>
                    </div>
                    <a
                      href="/api/auth/x"
                      className="text-[11px] text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white underline font-mono"
                    >
                      Reconnect
                    </a>
                  </div>
                ) : data?.integrations?.x?.configured ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-zinc-400">
                      Your X Client ID is set. Click below to authorize tweet and thread publishing.
                    </p>
                    <a
                      href="/api/auth/x"
                      className="btn-island-primary !py-2 !px-4"
                    >
                      <Twitter className="w-4 h-4" />
                      <span>Connect X (1-Click OAuth)</span>
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-zinc-500 font-mono">
                    Add <code>X_CLIENT_ID</code> to your <code>.env</code> file.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
