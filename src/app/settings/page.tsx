'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Sliders, Shield, Key, Save, CheckCircle2, AlertTriangle, Linkedin, Twitter, ExternalLink, Link2 } from 'lucide-react';

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
      <div className="max-w-5xl mx-auto py-12 text-center font-mono text-sm text-zinc-500">
        Loading system configuration...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* OAuth Connection Status Banner */}
      {connectBanner && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            connectBanner.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {connectBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{connectBanner.message}</span>
          </div>
          <button
            onClick={() => setConnectBanner(null)}
            className="text-xs opacity-70 hover:opacity-100 font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-zinc-400" />
            System Configuration &amp; Voice Profile
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Configure technical tone, thresholds for publication, and 1-Click social integrations.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? (
            'Saving...'
          ) : saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Changes
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Voice Persona Controls */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-[#30363d] pb-3">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">Voice &amp; Persona Weights</h3>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-mono text-zinc-300 mb-1">
                <span>Technical Depth:</span>
                <span className="text-emerald-400 font-bold">{technicalDepth} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={technicalDepth}
                onChange={(e) => setTechnicalDepth(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-[#0d1117]"
              />
              <span className="text-[11px] text-zinc-500">1: High-level overview &bull; 10: Code snippets &amp; architecture</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-zinc-300 mb-1">
                <span>Humor &amp; Wit:</span>
                <span className="text-emerald-400 font-bold">{humorLevel} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={humorLevel}
                onChange={(e) => setHumorLevel(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-[#0d1117]"
              />
              <span className="text-[11px] text-zinc-500">0: Dry &amp; academic &bull; 10: Playful &amp; ironic</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-zinc-300 mb-1">
                <span>Emoji Usage:</span>
                <span className="text-emerald-400 font-bold">{emojiLevel} / 5</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={emojiLevel}
                onChange={(e) => setEmojiLevel(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-[#0d1117]"
              />
              <span className="text-[11px] text-zinc-500">0: Zero emojis &bull; 1: Maximum 1 &bull; 5: Expressive</span>
            </div>
          </div>
        </div>

        {/* Automation Mode & Thresholds */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-[#30363d] pb-3">
            <Shield className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-semibold text-white">Automation &amp; Safety Thresholds</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-zinc-300 block mb-1">Publishing Mode:</label>
              <select
                value={publishingMode}
                onChange={(e) => setPublishingMode(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] text-zinc-200 text-xs rounded-lg p-2.5 font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value="MANUAL">MANUAL (Publishing triggered strictly by user)</option>
                <option value="APPROVAL_REQUIRED">APPROVAL_REQUIRED (Drafts generated, review required)</option>
                <option value="AUTOMATIC">AUTOMATIC (Auto-publish if score &gt; threshold &amp; verified)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-zinc-300 mb-1">
                <span>Minimum Trend Score to Research:</span>
                <span className="text-emerald-400 font-bold">{minTrendScore} / 100</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                value={minTrendScore}
                onChange={(e) => setMinTrendScore(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-[#0d1117]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-zinc-300 mb-1">
                <span>Minimum Quality Score to Approve:</span>
                <span className="text-emerald-400 font-bold">{minQualityScore} / 100</span>
              </div>
              <input
                type="range"
                min="70"
                max="98"
                value={minQualityScore}
                onChange={(e) => setMinQualityScore(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-[#0d1117]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-zinc-300 mb-1">
                <span>Maximum Posts Per Day:</span>
                <span className="text-emerald-400 font-bold">{maxPostsPerDay} posts/day</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={maxPostsPerDay}
                onChange={(e) => setMaxPostsPerDay(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-[#0d1117]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* External Integration Status Cards */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-[#30363d] pb-3">
          <Key className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-semibold text-white">Official API Integrations (1-Click OAuth)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LinkedIn Integration Card */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#0077b5]/10 rounded-lg border border-[#0077b5]/30">
                  <Linkedin className="w-5 h-5 text-[#0077b5]" />
                </div>
                <div>
                  <span className="font-semibold text-sm text-white block">LinkedIn Official REST API</span>
                  <span className="text-[11px] text-zinc-400">Personal member profiles &amp; company pages</span>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  data?.integrations?.linkedin?.connected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : data?.integrations?.linkedin?.configured
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {data?.integrations?.linkedin?.connected
                  ? 'Connected'
                  : data?.integrations?.linkedin?.configured
                  ? 'Ready to Connect'
                  : 'Needs Client ID in .env'}
              </span>
            </div>

            <div className="border-t border-[#21262d] pt-3">
              {data?.integrations?.linkedin?.connected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-zinc-200 font-medium">
                      Connected: {data.integrations.linkedin.accountName}
                    </span>
                  </div>
                  <a
                    href="/api/auth/linkedin"
                    className="text-[11px] text-zinc-400 hover:text-white underline font-mono"
                  >
                    Reconnect
                  </a>
                </div>
              ) : data?.integrations?.linkedin?.configured ? (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-400">
                    Your Client ID is set. Click below to authorize Antigravity to post to your LinkedIn profile.
                  </p>
                  <a
                    href="/api/auth/linkedin"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0077b5] hover:bg-[#006097] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                  >
                    <Linkedin className="w-4 h-4" />
                    Connect LinkedIn (1-Click OAuth)
                  </a>
                </div>
              ) : (
                <p className="text-xs text-zinc-400">
                  Add <code>LINKEDIN_CLIENT_ID</code> and <code>LINKEDIN_CLIENT_SECRET</code> to your <code>.env</code> file to enable 1-Click Connect.
                </p>
              )}
            </div>
          </div>

          {/* X (Twitter) Integration Card */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/30">
                  <Twitter className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <span className="font-semibold text-sm text-white block">X (Twitter) Official API v2</span>
                  <span className="text-[11px] text-zinc-400">Single tweets &amp; connected reply threads</span>
                </div>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  data?.integrations?.x?.connected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : data?.integrations?.x?.configured
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {data?.integrations?.x?.connected
                  ? 'Connected'
                  : data?.integrations?.x?.configured
                  ? 'Ready to Connect'
                  : 'Needs Client ID in .env'}
              </span>
            </div>

            <div className="border-t border-[#21262d] pt-3">
              {data?.integrations?.x?.connected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-zinc-200 font-medium">
                      Connected: @{data.integrations.x.username || data.integrations.x.accountName}
                    </span>
                  </div>
                  <a
                    href="/api/auth/x"
                    className="text-[11px] text-zinc-400 hover:text-white underline font-mono"
                  >
                    Reconnect
                  </a>
                </div>
              ) : data?.integrations?.x?.configured ? (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-400">
                    Your X Client ID is set. Click below to authorize tweet and thread publishing.
                  </p>
                  <a
                    href="/api/auth/x"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg border border-zinc-700 transition-colors shadow-sm"
                  >
                    <Twitter className="w-4 h-4 text-sky-400" />
                    Connect X (1-Click OAuth)
                  </a>
                </div>
              ) : (
                <p className="text-xs text-zinc-400">
                  Add <code>X_CLIENT_ID</code> and <code>X_CLIENT_SECRET</code> to your <code>.env</code> file to enable 1-Click Connect.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
