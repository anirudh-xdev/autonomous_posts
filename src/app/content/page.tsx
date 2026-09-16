'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, CheckCircle2, Clock, Send, XCircle, ArrowRight } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-sky-400" />
            Generated Posts &amp; Drafts
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Platform-specific post variants generated with consistent developer voice.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center text-zinc-400 font-mono text-sm">
          Loading drafts...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center text-zinc-400 font-mono text-sm">
          No content generated yet. Go to Trends and select &quot;Generate Platform Posts&quot;.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-[#161b22] border border-[#30363d] hover:border-zinc-500/50 rounded-xl p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${
                      item.status === 'PUBLISHED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : item.status === 'APPROVED'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    Created {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-white">
                  {item.trend?.title || 'Generated Post Container'}
                </h3>

                <div className="flex items-center gap-3">
                  {item.variants?.map((v: any) => (
                    <span
                      key={v.id}
                      className={`text-xs font-mono px-2.5 py-1 rounded border ${
                        v.platform === 'LINKEDIN'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                      }`}
                    >
                      {v.platform} &bull; {v.characterCount} chars
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/content/${item.id}`}
                  className="flex items-center gap-1 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Review Side-by-Side <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
