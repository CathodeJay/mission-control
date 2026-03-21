'use client';

import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

const WEBCHAT_URL = 'https://solar-clawd.tail3445ba.ts.net';

export default function ChatPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0c10]">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-sm shrink-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm">
                ⚡
              </div>
              <span className="text-sm font-bold text-slate-100">Mission Control</span>
            </Link>
            <span className="text-slate-700 hidden sm:inline">/</span>
            <span className="text-sm text-slate-400 hidden sm:inline">Chat</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <Link href="/" className="text-slate-500 hover:text-slate-300 transition-colors hidden sm:inline">
              Dashboard
            </Link>
            <div className="hidden sm:block text-slate-700">|</div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-3xl mb-6">
          💬
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-3">Chat with Jupiter</h1>
        <p className="text-slate-400 text-sm max-w-sm mb-2">
          The chat runs on your Tailscale network. Make sure Tailscale is active, then open the webchat.
        </p>
        <p className="text-slate-600 text-xs mb-8">
          🔒 Requires Tailscale to be connected
        </p>
        <a
          href={WEBCHAT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          Open Webchat
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
        <p className="text-slate-700 text-xs mt-4">
          {WEBCHAT_URL}
        </p>
      </div>
    </div>
  );
}
