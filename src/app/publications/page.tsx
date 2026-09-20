'use client';

import React, { useState, useEffect } from 'react';
import { Send, ExternalLink, CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';

export default function PublicationsPage() {
  const [publications, setPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPubs = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/analytics');
        const data = await res.json();
        if (data.success) {
          setPublications(data.publications || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPubs();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Card */}
      <div className="double-bezel-outer">
        <div className="double-bezel-inner p-5 sm:p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono uppercase tracking-wider mb-2 font-semibold">
              <Send className="w-3.5 h-3.5" />
              <span>DELIVERY LEDGER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Publication History &amp; Audit Log
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1">
              Permanent immutable ledger of all posts delivered to official LinkedIn and X REST APIs.
            </p>
          </div>

          <span className="font-mono text-xs px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 self-start md:self-auto">
            {publications.length} Deliveries Recorded
          </span>
        </div>
      </div>

      {loading ? (
        <div className="double-bezel-outer">
          <div className="double-bezel-inner p-16 text-center text-slate-400 dark:text-zinc-400 font-mono text-sm animate-pulse">
            Loading publication history ledger...
          </div>
        </div>
      ) : publications.length === 0 ? (
        <div className="double-bezel-outer">
          <div className="double-bezel-inner p-12 sm:p-16 text-center text-slate-500 dark:text-zinc-400 font-mono text-sm">
            No publications recorded yet. Approve and publish drafts from the Content Studio.
          </div>
        </div>
      ) : (
        <div className="double-bezel-outer">
          <div className="double-bezel-inner overflow-hidden p-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono min-w-[650px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-zinc-400 uppercase text-[10px]">
                    <th className="p-4">Platform</th>
                    <th className="p-4">Associated Trend</th>
                    <th className="p-4">Platform Post ID</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Published At</th>
                    <th className="p-4 text-right">Live Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-zinc-300">
                  {publications.map((pub) => (
                    <tr key={pub.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <span
                          className={`font-mono font-bold px-2.5 py-1 rounded-full text-[10px] border ${
                            pub.platform === 'LINKEDIN'
                              ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-300 border-slate-300 dark:border-zinc-700'
                          }`}
                        >
                          {pub.platform}
                        </span>
                      </td>
                      <td className="p-4 font-sans font-bold text-slate-900 dark:text-white max-w-xs truncate">
                        {pub.contentVariant?.contentItem?.trend?.title || 'Published Content'}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-500 dark:text-zinc-500 truncate max-w-xs">
                        {pub.platformPostId || 'pending'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold ${
                            pub.status === 'SUCCESS' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {pub.status === 'SUCCESS' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {pub.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-500 dark:text-zinc-400">
                        {pub.publishedAt ? new Date(pub.publishedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-4 text-right">
                        {pub.postUrl ? (
                          <a
                            href={pub.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-mono text-xs"
                          >
                            <span>Open Post</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-600 font-mono">Internal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
