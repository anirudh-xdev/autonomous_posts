'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Send,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Edit3,
  Save,
  MessageSquare,
  Image as ImageIcon,
  Layers,
  BarChart3,
  Monitor,
  Lightbulb,
  Wand2,
  Download,
  RefreshCw,
  ArrowUpRight,
  Clock,
} from 'lucide-react';

export default function ContentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'both' | 'linkedin' | 'x'>('both');

  // Local editing states
  const [linkedinText, setLinkedinText] = useState('');
  const [xText, setXText] = useState('');
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null);
  const [publishingVariantId, setPublishingVariantId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Free AI Image Generation states
  const [generatingImage, setGeneratingImage] = useState(false);
  const [customImagePrompt, setCustomImagePrompt] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/content/${id}`);
      const data = await res.json();
      if (data.success) {
        setItem(data.contentItem);
        const lVar = data.contentItem.variants.find((v: any) => v.platform === 'LINKEDIN');
        const xVar = data.contentItem.variants.find((v: any) => v.platform === 'X');
        if (lVar) setLinkedinText(lVar.text);
        if (xVar) setXText(xVar.text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchItem();
  }, [id]);

  const handleSaveText = async (variantId: string, text: string) => {
    setSavingVariantId(variantId);
    try {
      const res = await fetch(`/api/content/variants/${variantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('Edits saved and re-audited by Quality Gate!');
        await fetchItem();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingVariantId(null);
    }
  };

  const handleAction = async (variantId: string, action: 'approve' | 'reject' | 'publish') => {
    if (action === 'publish') setPublishingVariantId(variantId);
    try {
      const res = await fetch(`/api/content/variants/${variantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Action '${action.toUpperCase()}' completed successfully!`);
        await fetchItem();
      } else {
        setStatusMessage(`Action error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPublishingVariantId(null);
    }
  };

  const handleGenerateImage = async () => {
    setGeneratingImage(true);
    setImageError(null);
    try {
      const res = await fetch(`/api/content/${id}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPrompt: customImagePrompt || undefined }),
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setItem((prev: any) => ({ ...prev, imageUrl: data.imageUrl }));
        setStatusMessage(`AI Visual successfully generated with ${data.model}!`);
      } else {
        setImageError(data.error || 'Failed to generate visual image');
      }
    } catch (err: any) {
      console.error(err);
      setImageError(err?.message || 'Network error generating image');
    } finally {
      setGeneratingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="double-bezel-outer max-w-4xl mx-auto">
        <div className="double-bezel-inner p-16 text-center font-mono text-sm text-slate-400 dark:text-zinc-500 animate-pulse">
          Loading post review workspace...
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="double-bezel-outer max-w-4xl mx-auto">
        <div className="double-bezel-inner p-16 text-center font-mono text-sm text-slate-400 dark:text-zinc-500">
          Content item not found.
        </div>
      </div>
    );
  }

  const linkedinVariant = item.variants?.find((v: any) => v.platform === 'LINKEDIN');
  const xVariant = item.variants?.find((v: any) => v.platform === 'X');

  const visualReferences: any[] = Array.isArray(item.visualReferences)
    ? item.visualReferences
    : Array.isArray(linkedinVariant?.visualReferences)
    ? linkedinVariant.visualReferences
    : Array.isArray(xVariant?.visualReferences)
    ? xVariant.visualReferences
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Back Link and Status Feedback */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/content"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Synthesized Drafts</span>
        </Link>
        {statusMessage && (
          <span className="text-xs font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-3.5 py-1 rounded-full shadow-sm dark:shadow-specular font-semibold">
            {statusMessage}
          </span>
        )}
      </div>

      {/* Source Trend Context Card (Double-Bezel) */}
      <div className="double-bezel-outer">
        <div className="double-bezel-inner p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-500 font-bold">
              SOURCE TREND SIGNAL
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {item.trend?.title}
            </h2>
          </div>
          <Link
            href={`/trends/${item.trend?.id}`}
            className="btn-island-secondary !text-xs !py-1.5 !px-3 self-start sm:self-center"
          >
            <span>View Research Dossier</span>
            <ExternalLink className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* Visual & AI Image Studio (Double-Bezel) */}
      <div className="double-bezel-outer">
        <div className="double-bezel-inner p-5 sm:p-7 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] pb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                  Visual &amp; AI Image Studio
                </h3>
                <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                  Generate 1200×630 technical architecture diagrams with FLUX.1
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-full font-semibold">
              FLUX.1-schnell Free Serverless
            </span>
          </div>

          {/* Error Alert if Image Generation Fails */}
          {imageError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-700 dark:text-rose-300 flex items-center justify-between">
              <span>{imageError}</span>
              <button onClick={() => setImageError(null)} className="text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300">
                ✕
              </button>
            </div>
          )}

          {/* Generated Image Preview or Generator Input */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {item?.imageUrl ? (
              <div className="lg:col-span-6 space-y-2.5">
                <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-white/[0.08] bg-slate-900 shadow-2xl">
                  <img
                    src={item.imageUrl}
                    alt="Generated Post Visual"
                    className="w-full h-auto object-cover max-h-72 rounded-2xl transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                    <a
                      href={item.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-white/20 hover:bg-white/30 text-white text-xs px-3.5 py-2 rounded-full font-mono flex items-center gap-1.5 border border-white/30"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Full Size
                    </a>
                    <a
                      href={item.imageUrl}
                      download="post-visual.png"
                      className="btn-island-primary !text-xs !py-1.5 !px-3"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-500 px-1">
                  <span>Asset: 1200×630 PNG</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Ready for Publishing</span>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-6 border-2 border-dashed border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-2.5 bg-slate-50 dark:bg-white/[0.01] min-h-[180px]">
                <Wand2 className="w-8 h-8 text-slate-400 dark:text-zinc-600" />
                <p className="text-xs font-mono text-slate-600 dark:text-zinc-400">No visual generated for this post yet.</p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-500 max-w-sm">
                  Click generate below to synthesize a tailored technical architecture diagram using FLUX.1.
                </p>
              </div>
            )}

            {/* Generator Controls */}
            <div className="lg:col-span-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-700 dark:text-zinc-400 block font-semibold">
                  Visual Prompt Customization (Optional)
                </label>
                <input
                  type="text"
                  value={customImagePrompt}
                  onChange={(e) => setCustomImagePrompt(e.target.value)}
                  placeholder={`e.g. Modern dark blueprint diagram of ${item.trend?.title || 'system architecture'}`}
                  className="w-full bg-slate-50 dark:bg-[#05070B] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-200 font-mono focus:outline-none focus:border-purple-500 shadow-sm dark:shadow-specular placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                />
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 block font-mono">
                  Leave blank to automatically synthesize an architecture diagram from research findings.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={handleGenerateImage}
                  disabled={generatingImage}
                  className="btn-island-primary !bg-gradient-to-r !from-purple-600 !to-indigo-600 !text-white !border-none !py-2 !px-4 disabled:opacity-50"
                >
                  {generatingImage ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing with FLUX...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>{item?.imageUrl ? 'Regenerate Free AI Visual' : 'Generate Free AI Visual'}</span>
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                        <ArrowUpRight className="w-3 h-3 text-white" />
                      </div>
                    </>
                  )}
                </button>
                <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500">
                  Zero Cost • 1200×630 Preview Card
                </span>
              </div>
            </div>
          </div>

          {/* Recommended Visual References from Research */}
          {visualReferences.length > 0 && (
            <div className="border-t border-slate-200 dark:border-white/[0.06] pt-4 space-y-3">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-bold">
                Recommended Architecture References ({visualReferences.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visualReferences.map((visual: any, idx: number) => {
                  const getBadge = (type: string) => {
                    switch (type) {
                      case 'architecture_diagram':
                        return { label: 'Architecture Diagram', color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30', icon: Layers };
                      case 'product_screenshot':
                        return { label: 'Product Screenshot', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30', icon: Monitor };
                      case 'benchmark_chart':
                        return { label: 'Benchmark Chart', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', icon: BarChart3 };
                      case 'official_image':
                        return { label: 'Official Release Visual', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30', icon: ImageIcon };
                      default:
                        return { label: 'Concept Diagram', color: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30', icon: Lightbulb };
                    }
                  };
                  const badge = getBadge(visual.type);
                  const BadgeIcon = badge.icon;

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] flex flex-col justify-between space-y-2 hover:border-slate-300 dark:hover:border-white/[0.1] transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 font-semibold ${badge.color}`}>
                            <BadgeIcon className="w-3 h-3" />
                            {badge.label}
                          </span>
                          {visual.suggestedSourceUrl && (
                            <a
                              href={visual.suggestedSourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              <span>Source</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">{visual.title}</h4>
                        <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">{visual.description}</p>
                      </div>
                      {visual.reasonWhyHelpful && (
                        <div className="border-t border-slate-200/60 dark:border-white/[0.03] pt-2 text-[10px] text-slate-500 dark:text-zinc-500 font-mono">
                          <span className="text-slate-600 dark:text-zinc-400 font-semibold">Why it helps:</span> {visual.reasonWhyHelpful}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Editor Columns (Double-Bezel) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* ================= LinkedIn Column ================= */}
        {linkedinVariant && (
          <div className="double-bezel-outer">
            <div className="double-bezel-inner p-5 sm:p-6 space-y-4 flex flex-col justify-between h-full">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded-full">
                      LinkedIn Post
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 uppercase">
                      Status: {linkedinVariant.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 font-mono text-xs text-slate-500 dark:text-zinc-400">
                    <span className={linkedinText.split(/\n\s*\n/).filter((p) => p.trim()).length >= 3 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400'}>
                      {linkedinText.split(/\n\s*\n/).filter((p) => p.trim()).length} paragraphs
                    </span>
                    <span>•</span>
                    <span>{linkedinText.trim() ? linkedinText.trim().split(/\s+/).length : 0} words</span>
                    <span>•</span>
                    <span className={linkedinText.length > 3000 ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                      {linkedinText.length} / 3000 chars
                    </span>
                  </div>
                </div>

                {/* Quality Audit Scorecard */}
                {linkedinVariant.qualityChecks?.[0] && (
                  <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 font-semibold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Quality Gate:
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {Math.round(linkedinVariant.qualityChecks[0].overallScore)}/100
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-500 dark:text-zinc-400 border-t border-slate-200 dark:border-white/[0.04] pt-2">
                      <div>Factual: {linkedinVariant.qualityChecks[0].factualAccuracy}%</div>
                      <div>Originality: {linkedinVariant.qualityChecks[0].originality}%</div>
                      <div>Spam: {linkedinVariant.qualityChecks[0].spamScore}%</div>
                    </div>
                  </div>
                )}

                {/* Editable Text Area */}
                <textarea
                  value={linkedinText}
                  onChange={(e) => setLinkedinText(e.target.value)}
                  rows={14}
                  className="w-full bg-slate-50 dark:bg-[#05070B] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 text-xs sm:text-sm text-slate-900 dark:text-zinc-200 font-sans leading-relaxed focus:outline-none focus:border-sky-500 shadow-sm dark:shadow-specular"
                  placeholder="Write or edit LinkedIn post..."
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
                <button
                  onClick={() => handleSaveText(linkedinVariant.id, linkedinText)}
                  disabled={savingVariantId === linkedinVariant.id}
                  className="btn-island-secondary !text-xs !py-1.5 !px-3"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingVariantId === linkedinVariant.id ? 'Saving...' : 'Save Edits'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(linkedinVariant.id, 'reject')}
                    className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-full font-medium transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(linkedinVariant.id, 'approve')}
                    className="text-xs bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-200 border border-sky-500/40 px-3 py-1.5 rounded-full font-medium transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(linkedinVariant.id, 'publish')}
                    disabled={publishingVariantId === linkedinVariant.id}
                    className="btn-island-primary !text-xs !py-1.5 !px-3.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>{publishingVariantId === linkedinVariant.id ? 'Publishing...' : 'Publish'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= X (Twitter) Column ================= */}
        {xVariant && (
          <div className="double-bezel-outer">
            <div className="double-bezel-inner p-5 sm:p-6 space-y-4 flex flex-col justify-between h-full">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 px-2.5 py-0.5 rounded-full">
                      X (Twitter) {xVariant.isThread ? 'Thread' : 'Post'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 uppercase">
                      Status: {xVariant.status}
                    </span>
                  </div>
                  <span className={`text-xs font-mono ${xText.length > 280 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-zinc-400'}`}>
                    {xText.length} / 280 chars
                  </span>
                </div>

                {/* Quality Audit Scorecard */}
                {xVariant.qualityChecks?.[0] && (
                  <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 font-semibold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Quality Gate:
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {Math.round(xVariant.qualityChecks[0].overallScore)}/100
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-500 dark:text-zinc-400 border-t border-slate-200 dark:border-white/[0.04] pt-2">
                      <div>Factual: {xVariant.qualityChecks[0].factualAccuracy}%</div>
                      <div>Originality: {xVariant.qualityChecks[0].originality}%</div>
                      <div>Spam: {xVariant.qualityChecks[0].spamScore}%</div>
                    </div>
                  </div>
                )}

                {/* Editable Text Area */}
                <textarea
                  value={xText}
                  onChange={(e) => setXText(e.target.value)}
                  rows={xVariant.isThread ? 6 : 14}
                  className={`w-full bg-slate-50 dark:bg-[#05070B] border rounded-xl p-4 text-xs sm:text-sm text-slate-900 dark:text-zinc-200 font-sans leading-relaxed focus:outline-none shadow-sm dark:shadow-specular ${
                    xText.length > 280 ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 dark:border-white/[0.08] focus:border-slate-400 dark:focus:border-zinc-400'
                  }`}
                  placeholder="Write or edit X post..."
                />

                {/* Thread preview if threadPosts exists */}
                {xVariant.isThread && xVariant.threadPosts && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-mono text-slate-600 dark:text-zinc-400 uppercase block tracking-wider font-semibold">
                      Connected Thread Tweets:
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(typeof xVariant.threadPosts === 'string' ? JSON.parse(xVariant.threadPosts) : xVariant.threadPosts).map((post: string, idx: number) => (
                        <div key={idx} className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] rounded-xl p-3 text-xs text-slate-700 dark:text-zinc-300">
                          <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 block mb-1">
                            Tweet #{idx + 1} ({post.length}c)
                          </span>
                          {post}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
                <button
                  onClick={() => handleSaveText(xVariant.id, xText)}
                  disabled={savingVariantId === xVariant.id}
                  className="btn-island-secondary !text-xs !py-1.5 !px-3"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingVariantId === xVariant.id ? 'Saving...' : 'Save Edits'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(xVariant.id, 'reject')}
                    className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-full font-medium transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(xVariant.id, 'approve')}
                    className="text-xs bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-900 dark:text-white px-3 py-1.5 rounded-full font-medium transition-colors border border-slate-300 dark:border-zinc-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(xVariant.id, 'publish')}
                    disabled={publishingVariantId === xVariant.id || xText.length > 280}
                    className="btn-island-primary !text-xs !py-1.5 !px-3.5 disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>{publishingVariantId === xVariant.id ? 'Publishing...' : 'Publish'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
