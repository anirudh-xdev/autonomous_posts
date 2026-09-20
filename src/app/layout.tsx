import './globals.css';
import React from 'react';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { NavigationIsland } from '@/components/navigation-island';
import { ThemeProvider } from '@/components/theme-provider';
import Link from 'next/link';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '700'],
});

export const metadata = {
  title: 'Autonomous AI Content Automation Engine — Awwwards Showcase',
  description:
    'Award-winning autonomous intelligence system that monitors 24 global tech signals, runs deep technical research, and synthesizes developer content for LinkedIn and X.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${mono.variable} dark`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.style.colorScheme = 'light';
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                  document.documentElement.style.colorScheme = 'dark';
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="ambient-bg min-h-[100dvh] flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-700 dark:selection:text-emerald-200">
        <ThemeProvider>
          {/* Floating Island Navigation */}
          <NavigationIsland />

          {/* Primary Page Canvas */}
          <main className="flex-1 w-full max-w-7xl mx-auto pt-24 sm:pt-28 md:pt-32 pb-20 px-4 sm:px-6 lg:px-8">
            {children}
          </main>

          {/* Awwwards-Tier Micro-Footer */}
          <footer className="w-full border-t border-slate-200 dark:border-white/[0.06] bg-slate-50/80 dark:bg-[#05070B]/80 backdrop-blur-xl py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500 dark:text-zinc-500">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-center sm:text-left">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>SYSTEM AUTONOMOUS</span>
                </div>
                <span className="text-slate-300 dark:text-zinc-700">/</span>
                <span>24 SOURCES STREAMING</span>
                <span className="text-slate-300 dark:text-zinc-700">/</span>
                <span>HUGGINGFACE QWEN-72B</span>
              </div>

              <div className="flex items-center gap-6 text-slate-600 dark:text-zinc-400">
                <Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Command Center
                </Link>
                <Link href="/trends" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Radar
                </Link>
                <Link href="/content" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Studio
                </Link>
                <Link href="/settings" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Config
                </Link>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
