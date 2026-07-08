'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
          return;
        }

        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error || !profile || !profile.is_admin) {
          console.warn('Unauthorized admin access attempt redirected.');
          router.push('/');
          return;
        }

        setAuthorized(true);
      } catch (err) {
        console.error('Error verifying admin status:', err);
        router.push('/');
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="flex-1 w-full min-h-[60vh] flex flex-col justify-center items-center space-y-4 bg-[#0A0A0F]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
        <span className="text-zinc-500 text-xs font-mono">Verifying admin privileges...</span>
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
