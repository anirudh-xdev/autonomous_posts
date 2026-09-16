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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center font-mono text-sm text-zinc-500">
        Loading post review workspace...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center font-mono text-sm text-zinc-500">
        Content item not found.
      </div>
    );
  }

  const linkedinVariant = item.variants?.find((v: any) => v.platform === 'LINKEDIN');
  const xVariant = item.variants?.find((v: any) => v.platform === 'X');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back Link and Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/content"
          className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Drafts
        </Link>
        {statusMessage && (
          <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded">
            {statusMessage}
          </span>
        )}
      </div>

      {/* Post Context Banner */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-500">Source Trend</span>
          <h2 className="text-base font-semibold text-white">{item.trend?.title}</h2>
        </div>
        <Link
          href={`/trends/${item.trend?.id}`}
          className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1"
        >
          View Research Dossier <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Side-by-Side Editor Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= LinkedIn Column ================= */}
        {linkedinVariant && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                    LinkedIn Post
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 uppercase">
                    Status: {linkedinVariant.status}
                  </span>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {linkedinText.length} / 1500 chars
                </span>
              </div>

              {/* Quality Audit Scorecard */}
              {linkedinVariant.qualityChecks?.[0] && (
                <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Quality Score:
                    </span>
                    <span className="font-bold text-emerald-400">
                      {Math.round(linkedinVariant.qualityChecks[0].overallScore)}/100
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-zinc-400 border-t border-[#21262d] pt-2">
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
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-xs text-zinc-200 font-sans leading-relaxed focus:outline-none focus:border-blue-500"
                placeholder="Write or edit LinkedIn post..."
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#30363d] flex items-center justify-between gap-2 flex-wrap">
              <button
                onClick={() => handleSaveText(linkedinVariant.id, linkedinText)}
                disabled={savingVariantId === linkedinVariant.id}
                className="flex items-center gap-1.5 text-xs bg-[#21262d] hover:bg-[#30363d] text-zinc-200 px-3 py-1.5 rounded-lg font-medium transition-colors border border-[#30363d]"
              >
                <Save className="w-3.5 h-3.5" />
                {savingVariantId === linkedinVariant.id ? 'Saving...' : 'Save Edits'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAction(linkedinVariant.id, 'reject')}
                  className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction(linkedinVariant.id, 'approve')}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(linkedinVariant.id, 'publish')}
                  disabled={publishingVariantId === linkedinVariant.id}
                  className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-950/20"
                >
                  <Send className="w-3 h-3" />
                  {publishingVariantId === linkedinVariant.id ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= X (Twitter) Column ================= */}
        {xVariant && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded">
                    X (Twitter) {xVariant.isThread ? 'Thread' : 'Post'}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 uppercase">
                    Status: {xVariant.status}
                  </span>
                </div>
                <span className={`text-xs font-mono ${xText.length > 280 ? 'text-red-400 font-bold' : 'text-zinc-400'}`}>
                  {xText.length} / 280 chars
                </span>
              </div>

              {/* Quality Audit Scorecard */}
              {xVariant.qualityChecks?.[0] && (
                <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Quality Score:
                    </span>
                    <span className="font-bold text-emerald-400">
                      {Math.round(xVariant.qualityChecks[0].overallScore)}/100
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-zinc-400 border-t border-[#21262d] pt-2">
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
                className={`w-full bg-[#0d1117] border rounded-lg p-3 text-xs text-zinc-200 font-sans leading-relaxed focus:outline-none ${
                  xText.length > 280 ? 'border-red-500 focus:border-red-500' : 'border-[#30363d] focus:border-sky-500'
                }`}
                placeholder="Write or edit X post..."
              />

              {/* Thread preview if threadPosts exists */}
              {xVariant.isThread && xVariant.threadPosts && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase block">Connected Thread Tweets:</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {xVariant.threadPosts.map((post: string, idx: number) => (
                      <div key={idx} className="bg-[#0d1117] border border-[#30363d] rounded p-2 text-xs text-zinc-300">
                        <span className="text-[10px] font-mono text-zinc-500 block mb-1">Tweet #{idx + 1} ({post.length}c)</span>
                        {post}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#30363d] flex items-center justify-between gap-2 flex-wrap">
              <button
                onClick={() => handleSaveText(xVariant.id, xText)}
                disabled={savingVariantId === xVariant.id}
                className="flex items-center gap-1.5 text-xs bg-[#21262d] hover:bg-[#30363d] text-zinc-200 px-3 py-1.5 rounded-lg font-medium transition-colors border border-[#30363d]"
              >
                <Save className="w-3.5 h-3.5" />
                {savingVariantId === xVariant.id ? 'Saving...' : 'Save Edits'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAction(xVariant.id, 'reject')}
                  className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction(xVariant.id, 'approve')}
                  className="text-xs bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(xVariant.id, 'publish')}
                  disabled={publishingVariantId === xVariant.id || xText.length > 280}
                  className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-950/20"
                >
                  <Send className="w-3 h-3" />
                  {publishingVariantId === xVariant.id ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
