'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  Clock,
  Send,
  XCircle,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';

export default function ContentListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/content');
        const data = await res.json();
        if (data.success) {
          setItems(data.items || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Bar */}
      <div className="double-bezel-outer">
        <div className="double-bezel-inner p-5 sm:p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-400 text-xs font-mono uppercase tracking-wider mb-2 font-semibold">
              <FileText className="w-3.5 h-3.5" />
              <span>CONTENT STUDIO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Synthesized Posts &amp; Drafts
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1">
              Platform-tailored LinkedIn and X variants generated with authentic developer voice.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs text-slate-600 dark:text-zinc-400">
            <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
              {items.length} Posts Total
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="double-bezel-outer">
          <div className="double-bezel-inner p-16 text-center text-slate-400 dark:text-zinc-400 font-mono text-sm animate-pulse">
            Loading synthesized content drafts...
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="double-bezel-outer">
          <div className="double-bezel-inner p-12 sm:p-16 text-center text-slate-500 dark:text-zinc-400 font-mono text-sm space-y-4">
            <p>No content generated yet. Go to Emerging Trends and select &quot;Research &amp; Draft&quot;.</p>
            <Link href="/trends" className="btn-island-primary !py-2 !px-4">
              <span>Explore Emerging Signals</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="double-bezel-outer">
              <div className="double-bezel-inner p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
                <div className="space-y-2.5 sm:space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                        item.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                          : item.status === 'APPROVED'
                          ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {item.status}
                    </span>

                    <span className="text-xs font-mono text-slate-500 dark:text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Created {new Date(item.createdAt).toLocaleDateString()}
                    </span>

                    {item.imageUrl && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                        <ImageIcon className="w-3 h-3" />
                        Visual Attached
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    <Link
                      href={`/content/${item.id}`}
                      className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                    >
                      {item.trend?.title || 'Generated Post Container'}
                    </Link>
                  </h3>

                  <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                    {item.variants?.map((v: any) => (
                      <span
                        key={v.id}
                        className={`text-xs font-mono px-3 py-1 rounded-full border ${
                          v.platform === 'LINKEDIN'
                            ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20'
                            : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700/60'
                        }`}
                      >
                        {v.platform} &bull; {v.characterCount} chars
                        {v.isThread && ' (5-Tweet Thread)'}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 self-end md:self-center">
                  <Link
                    href={`/content/${item.id}`}
                    className="btn-island-primary !text-xs !py-2 !px-4 !gap-1.5"
                  >
                    <span>Review Side-by-Side</span>
                    <div className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/20 flex items-center justify-center">
                      <ArrowUpRight className="w-3 h-3 text-current" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
