'use client';

import React, { useState, useEffect } from 'react';
import { Send, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';

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
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Send className="w-6 h-6 text-emerald-400" />
          Publication History &amp; Audit Log
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Permanent ledger of all posts published to official LinkedIn and X APIs.
        </p>
      </div>

      {loading ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center text-zinc-400 font-mono text-sm">
          Loading publication history...
        </div>
      ) : publications.length === 0 ? (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center text-zinc-400 font-mono text-sm">
          No publications recorded yet. Approve and publish drafts from the Content view.
        </div>
      ) : (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1117] border-b border-[#30363d] text-zinc-400 font-mono">
              <tr>
                <th className="p-4">Platform</th>
                <th className="p-4">Associated Trend</th>
                <th className="p-4">Platform Post ID</th>
                <th className="p-4">Status</th>
                <th className="p-4">Published At</th>
                <th className="p-4">Live Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d] text-zinc-300">
              {publications.map((pub) => (
                <tr key={pub.id} className="hover:bg-[#21262d]/50 transition-colors">
                  <td className="p-4">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        pub.platform === 'LINKEDIN'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      }`}
                    >
                      {pub.platform}
                    </span>
                  </td>
                  <td className="p-4 font-medium max-w-xs truncate">
                    {pub.contentVariant?.contentItem?.trend?.title || 'Published Content'}
                  </td>
                  <td className="p-4 font-mono text-[11px] text-zinc-400 truncate max-w-xs">
                    {pub.platformPostId || 'pending'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                        pub.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {pub.status === 'SUCCESS' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {pub.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-zinc-400">
                    {pub.publishedAt ? new Date(pub.publishedAt).toLocaleString() : 'N/A'}
                  </td>
                  <td className="p-4">
                    {pub.postUrl ? (
                      <a
                        href={pub.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-xs"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-zinc-500 font-mono">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
