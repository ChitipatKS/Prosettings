'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (!isAdmin) {
      console.warn('Unauthorized admin access attempt redirected.');
      router.push('/');
    }
  }, [user, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex-1 w-full min-h-[60vh] flex flex-col justify-center items-center space-y-4 bg-[#0A0A0F]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
        <span className="text-zinc-500 text-xs font-mono">Verifying admin privileges...</span>
      </div>
    );
  }

  if (!isAdmin) return null;

  return <>{children}</>;
}