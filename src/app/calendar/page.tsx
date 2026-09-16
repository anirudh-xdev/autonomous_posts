'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, Clock, Send, CheckCircle2, ArrowRight } from 'lucide-react';

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
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-purple-400" />
          Content Publishing Schedule &amp; Calendar
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Automated publication slots, scheduled drafts, and timeline history.
        </p>
      </div>

      {loading ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center text-zinc-400 font-mono text-sm">
          Loading calendar...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today & Scheduled */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-[#30363d] pb-2">
              <Clock className="w-4 h-4 text-sky-400" />
              Scheduled / Queued
            </h3>
            <div className="space-y-3">
              {items
                .filter((i) => i.status === 'SCHEDULED' || i.status === 'APPROVED')
                .map((i) => (
                  <div key={i.id} className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase">Ready</span>
                    <h4 className="text-xs font-medium text-zinc-200 line-clamp-1">{i.trend?.title}</h4>
                    <Link
                      href={`/content/${i.id}`}
                      className="text-[11px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1 mt-2"
                    >
                      View slot <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              {items.filter((i) => i.status === 'SCHEDULED' || i.status === 'APPROVED').length === 0 && (
                <p className="text-xs text-zinc-500 font-mono">No approved posts queued.</p>
              )}
            </div>
          </div>

          {/* Drafts in Review */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-[#30363d] pb-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Drafts Under Review
            </h3>
            <div className="space-y-3">
              {items
                .filter((i) => i.status === 'DRAFT' || i.status === 'REVIEWING')
                .map((i) => (
                  <div key={i.id} className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 space-y-1">
                    <span className="text-[10px] font-mono text-amber-400 uppercase">Needs Approval</span>
                    <h4 className="text-xs font-medium text-zinc-200 line-clamp-1">{i.trend?.title}</h4>
                    <Link
                      href={`/content/${i.id}`}
                      className="text-[11px] text-zinc-400 hover:text-sky-400 flex items-center gap-1 mt-2"
                    >
                      Open Editor <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
            </div>
          </div>

          {/* Recently Published */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-[#30363d] pb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Recently Published
            </h3>
            <div className="space-y-3">
              {items
                .filter((i) => i.status === 'PUBLISHED')
                .map((i) => (
                  <div key={i.id} className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase">Live</span>
                    <h4 className="text-xs font-medium text-zinc-200 line-clamp-1">{i.trend?.title}</h4>
                    <Link
                      href="/publications"
                      className="text-[11px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1 mt-2"
                    >
                      View Live Metrics <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              {items.filter((i) => i.status === 'PUBLISHED').length === 0 && (
                <p className="text-xs text-zinc-500 font-mono">No published posts yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
