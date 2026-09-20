'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Flame,
  FileText,
  Calendar,
  Send,
  BarChart3,
  Settings,
  LayoutDashboard,
  Compass,
  Menu,
  X,
  Radio,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

const NAV_ITEMS = [
  { name: 'Showcase', href: '/', icon: Compass },
  { name: 'Mission Control', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Trends', href: '/trends', icon: Flame },
  { name: 'Studio', href: '/content', icon: FileText },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Publish', href: '/publications', icon: Send },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function NavigationIsland() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Floating Island Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-3 sm:px-4 pt-3 sm:pt-4 pb-2 pointer-events-none">
        <nav className="glass-island pointer-events-auto rounded-full px-3 py-1.5 sm:px-4 sm:py-2 flex items-center justify-between gap-2 sm:gap-4 max-w-5xl w-full">
          {/* Brand Insignia */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group pl-0.5">
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-emerald-400/20 via-emerald-500/10 to-transparent border border-emerald-500/30 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-105 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 dark:text-emerald-400 transition-transform duration-300 group-hover:rotate-12" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-white block leading-tight font-sans">
                AUTONOMOUS
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-emerald-600 dark:text-emerald-400 uppercase block leading-tight">
                POSTS ENGINE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-100 dark:bg-white/[0.03] p-1 rounded-full border border-slate-200 dark:border-white/[0.04]">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-slate-900 dark:text-white bg-white dark:bg-white/[0.1] shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 transition-colors ${
                      isActive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-zinc-400'
                    }`}
                  />
                  <span>{item.name}</span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Compact Telemetry, Theme Switcher & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live Telemetry Pulse */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-600 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>24 LIVE</span>
            </div>

            {/* Light / Dark Mode Toggle */}
            <ThemeToggle />

            {/* Fast App Gateway */}
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex btn-island-primary !text-xs !py-1.5 !px-3 !gap-1.5"
            >
              <span>App</span>
              <div className="w-4 h-4 rounded-full bg-black/10 dark:bg-white/20 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3 text-current" />
              </div>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="xl:hidden p-2 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              aria-label={mobileOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Full-Screen Luxe Mobile Navigation Sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md xl:hidden flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-sm h-full bg-white dark:bg-[#090D16] border-l border-slate-200 dark:border-white/[0.08] shadow-2xl flex flex-col justify-between p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Sheet Header */}
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-white block font-sans">
                      AUTONOMOUS
                    </span>
                    <span className="text-[10px] font-mono tracking-widest text-emerald-600 dark:text-emerald-400 uppercase block">
                      ENGINE MENU
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-2 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-zinc-300"
                    aria-label="Close menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Badge */}
              <div className="my-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>24 SOURCES STREAMING</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">QWEN-72B</span>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1.5 mt-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between p-3 rounded-2xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                          : 'bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-200/60 dark:bg-white/[0.05] text-slate-500 dark:text-zinc-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Sheet Footer Action */}
            <div className="pt-6 border-t border-slate-200 dark:border-white/[0.08] space-y-3">
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="btn-island-primary w-full justify-center !py-3"
              >
                <span>Launch Mission Control</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
