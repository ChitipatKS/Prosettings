'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import SocialLoginButtons from '@/components/SocialLoginButtons';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/profile';
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push(redirectTo);
    }
  }, [user, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase is not configured.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          setErrorMsg('Invalid email or password');
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          setErrorMsg('Please confirm your email address before signing in.');
        } else {
          setErrorMsg(error.message);
        }
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('invalid login credentials')) {
        setErrorMsg('Invalid email or password');
      } else {
        setErrorMsg(msg || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-card border border-border-custom p-8 rounded-2xl shadow-xl backdrop-blur-md">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white font-display">Welcome Back</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs font-mono">Sign in to manage settings & favorites</p>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs font-mono p-4 rounded-xl mb-6">
          {errorMsg}
        </div>
      )}

      {/* Social Login Buttons */}
      <SocialLoginButtons redirectTo={redirectTo} />

      {/* OR Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800"></div>
        <span className="text-[10px] uppercase font-mono text-zinc-400 dark:text-zinc-500 tracking-wider shrink-0 select-none">
          Or continue with email
        </span>
        <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full h-11 bg-white dark:bg-black/40 border border-border-custom rounded-xl px-4 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-accent transition-all font-mono shadow-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full h-11 bg-white dark:bg-black/40 border border-border-custom rounded-xl px-4 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-accent transition-all shadow-xs"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-accent text-accent-fg hover:bg-accent/90 disabled:opacity-50 text-xs font-bold rounded-xl tracking-wider font-mono transition-all uppercase shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] active:scale-98 cursor-pointer mt-2"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 border-t border-zinc-200 dark:border-zinc-800/60 pt-5 text-center text-xs text-zinc-500 dark:text-zinc-400 font-mono">
        Don&apos;t have an account?{' '}
        <Link href={`/register${searchParams.toString() ? '?' + searchParams.toString() : ''}`} className="text-accent hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 w-full flex items-center justify-center px-6 py-20 bg-page-bg relative overflow-hidden">
      <div className="absolute top-[20%] left-[-20%] w-[500px] h-[500px] rounded-full bg-accent opacity-[0.015] blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-20%] w-[500px] h-[500px] rounded-full bg-accent opacity-[0.015] blur-[150px] pointer-events-none"></div>

      <Suspense fallback={
        <div className="w-full max-w-md bg-card border border-border-custom p-8 rounded-2xl flex items-center justify-center min-h-[300px]">
          <span className="text-zinc-500 text-xs font-mono">Loading form...</span>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}