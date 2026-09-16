'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Sliders, Shield, Key, Save, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-zinc-400" />
            System Configuration &amp; Voice Profile
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Fine-tune agent persona, automation thresholds, safety gates, and official API connections.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-xs font-semibold transition-all shadow-lg shadow-emerald-950/20"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Configuration'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Voice Profile Card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-[#30363d] pb-3">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">Personal Voice Profile</h3>
          </div>

          <div className="space-y-4">
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
              <span className="text-[11px] text-zinc-500">
                1: High-level overview &bull; 7: Senior Engineer &bull; 10: Deep kernel/model architecture
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-zinc-300 mb-1">
                <span>Humor Level:</span>
                <span className="text-emerald-400 font-bold">{humorLevel} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={humorLevel}
                onChange={(e) => setHumorLevel(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-[#0d1117]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-zinc-300 mb-1">
                <span>Emoji Level:</span>
                <span className="text-emerald-400 font-bold">{emojiLevel} / 10</span>
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
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#30363d] pb-3">
          <Key className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-semibold text-white">Official API Integrations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-white">LinkedIn Official REST API</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  data?.integrations?.linkedin?.configured
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {data?.integrations?.linkedin?.mode}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Configure <code>LINKEDIN_CLIENT_ID</code> and <code>LINKEDIN_CLIENT_SECRET</code> in <code>.env</code> to enable live posting.
            </p>
          </div>

          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-white">X (Twitter) Official API v2</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  data?.integrations?.x?.configured
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {data?.integrations?.x?.mode}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Configure <code>X_CLIENT_ID</code> and <code>X_CLIENT_SECRET</code> in <code>.env</code> to enable live tweets and threads.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
