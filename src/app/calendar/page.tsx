'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, Clock, Send, CheckCircle2, ArrowRight, ArrowUpRight } from 'lucide-react';

export default function CalendarPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
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
    fetchItems();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Card */}
      <div className="double-bezel-outer">
        <div className="double-bezel-inner p-5 sm:p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-mono uppercase tracking-wider mb-2 font-semibold">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>TIMELINE SCHEDULE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Content Calendar &amp; Slots
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1">
              Automated publication slots, scheduled drafts, and timeline history.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="double-bezel-outer">
          <div className="double-bezel-inner p-16 text-center text-slate-400 dark:text-zinc-400 font-mono text-sm animate-pulse">
            Loading timeline schedule...
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Today & Scheduled */}
          <div className="double-bezel-outer">
            <div className="double-bezel-inner p-5 sm:p-6 space-y-4 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-white/[0.06] mb-4">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Scheduled / Queued</h3>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500">Ready for automated broadcast</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {items
                    .filter((i) => i.status === 'SCHEDULED' || i.status === 'APPROVED')
                    .map((i) => (
                      <div key={i.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] space-y-1.5 hover:border-slate-300 dark:hover:border-white/[0.1] transition-colors">
                        <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">
                          Ready
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-200 line-clamp-1">{i.trend?.title}</h4>
                        <Link
                          href={`/content/${i.id}`}
                          className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 pt-1"
                        >
                          <span>Review slot</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    ))}
                  {items.filter((i) => i.status === 'SCHEDULED' || i.status === 'APPROVED').length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono py-6 text-center">No approved posts queued.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Drafts in Review */}
          <div className="double-bezel-outer">
            <div className="double-bezel-inner p-5 sm:p-6 space-y-4 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-white/[0.06] mb-4">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Drafts Under Review</h3>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500">Awaiting human sign-off</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {items
                    .filter((i) => i.status === 'DRAFT' || i.status === 'REVIEWING')
                    .map((i) => (
                      <div key={i.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] space-y-1.5 hover:border-slate-300 dark:hover:border-white/[0.1] transition-colors">
                        <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase">
                          Needs Approval
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-200 line-clamp-1">{i.trend?.title}</h4>
                        <Link
                          href={`/content/${i.id}`}
                          className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1 pt-1"
                        >
                          <span>Open Editor</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recently Published */}
          <div className="double-bezel-outer">
            <div className="double-bezel-inner p-5 sm:p-6 space-y-4 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-white/[0.06] mb-4">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Published</h3>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500">Delivered across channels</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {items
                    .filter((i) => i.status === 'PUBLISHED')
                    .map((i) => (
                      <div key={i.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] space-y-1.5 hover:border-slate-300 dark:hover:border-white/[0.1] transition-colors">
                        <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">
                          Published
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-200 line-clamp-1">{i.trend?.title}</h4>
                        <Link
                          href={`/content/${i.id}`}
                          className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 pt-1"
                        >
                          <span>View live analytics</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    ))}
                  {items.filter((i) => i.status === 'PUBLISHED').length === 0 && (
                    <p className="text-xs text-slate-400 dark:text-zinc-500 font-mono py-6 text-center">No posts published yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
