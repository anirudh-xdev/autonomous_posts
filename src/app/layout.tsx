import './globals.css';
import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Flame,
  FileText,
  Calendar,
  Send,
  BarChart3,
  Settings,
  Cpu,
  ShieldCheck,
} from 'lucide-react';

export const metadata = {
  title: 'AI Trend Content Automation Agent',
  description: 'Production-grade autonomous AI trend discovery, research, and multi-platform content engine',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="flex h-screen overflow-hidden bg-[#0d1117] text-[#e6edf3]">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[#30363d] bg-[#161b22] flex flex-col justify-between p-4 flex-shrink-0">
          <div>
            {/* Brand Header */}
            <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-[#30363d]">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-semibold text-sm tracking-tight text-white">AI Content Engine</h1>
                <p className="text-[11px] text-zinc-400 font-mono">Autonomous Pipeline</p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-[#21262d] text-zinc-300 hover:text-white transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-zinc-400" />
                Dashboard
              </Link>
              <Link
                href="/trends"
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-[#21262d] text-zinc-300 hover:text-white transition-colors"
              >
                <Flame className="w-4 h-4 text-amber-400" />
                Trends
              </Link>
              <Link
                href="/content"
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-[#21262d] text-zinc-300 hover:text-white transition-colors"
              >
                <FileText className="w-4 h-4 text-sky-400" />
                Content & Drafts
              </Link>
              <Link
                href="/calendar"
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-[#21262d] text-zinc-300 hover:text-white transition-colors"
              >
                <Calendar className="w-4 h-4 text-purple-400" />
                Calendar
              </Link>
              <Link
                href="/publications"
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-[#21262d] text-zinc-300 hover:text-white transition-colors"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                Publications
              </Link>
              <Link
                href="/analytics"
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-[#21262d] text-zinc-300 hover:text-white transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Analytics
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-[#21262d] text-zinc-300 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4 text-zinc-400" />
                Settings
              </Link>
            </nav>
          </div>

          {/* System Status Footer */}
          <div className="pt-4 border-t border-[#30363d] text-xs font-mono text-zinc-400">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                System Ready
              </span>
              <span className="text-[10px] bg-[#21262d] px-1.5 py-0.5 rounded border border-[#30363d]">v1.0.0</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Quality Gate Active
            </div>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <main className="flex-1 overflow-y-auto bg-[#0d1117] p-8">{children}</main>
      </body>
    </html>
  );
}
