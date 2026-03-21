'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 disabled:opacity-50 transition-colors"
      title="Sign out"
    >
      <span>⏻</span>
      <span className="hidden sm:inline">{loading ? 'Signing out…' : 'Logout'}</span>
    </button>
  );
}
