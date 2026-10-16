'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import SocialLoginButtons from '@/components/SocialLoginButtons';

function RegisterForm() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
    setSuccessMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase is not configured.');
      return;
    }

    const cleanUsername = username.trim();
    if (cleanUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters long.');
      return;
    }

    setLoading(true);

    try {
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (existingUser) {
        setErrorMsg(`The username "${cleanUsername}" is already taken. Please choose another one.`);
        setLoading(false);
        return;
      }

      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (existingPlayer) {
        setErrorMsg(`The username "${cleanUsername}" is already taken. Please choose another one.`);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: cleanUsername,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setErrorMsg('This email is already registered. Please sign in instead.');
        } else if (data.user && !data.session) {
          setSuccessMsg('Verification email sent! Please check your inbox and click the confirmation link.');
        } else {
          router.push(redirectTo);
          router.refresh();
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-card border border-border-custom p-8 rounded-2xl shadow-xl backdrop-blur-md">
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white font-display">Create Account</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs font-mono">Join the competitive gaming directory</p>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs font-mono p-4 rounded-xl mb-6">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-500 dark:text-green-400 text-xs font-mono p-4 rounded-xl mb-6">
          {successMsg}
        </div>
      )}

      {/* Social Login Buttons */}
      <SocialLoginButtons redirectTo={redirectTo} />

      {/* OR Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800"></div>
        <span className="text-[10px] uppercase font-mono text-zinc-400 dark:text-zinc-500 tracking-wider shrink-0 select-none">
          Or register with email
        </span>
        <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">Username</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full h-11 bg-white dark:bg-black/40 border border-border-custom rounded-xl px-4 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-accent transition-all font-mono shadow-xs"
          />
        </div>

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
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <div className="mt-6 border-t border-zinc-200 dark:border-zinc-800/60 pt-5 text-center text-xs text-zinc-500 dark:text-zinc-400 font-mono">
        Already have an account?{' '}
        <Link href={`/login${searchParams.toString() ? '?' + searchParams.toString() : ''}`} className="text-accent hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex-1 w-full flex items-center justify-center px-6 py-20 bg-page-bg relative overflow-hidden">
      <div className="absolute top-[20%] left-[-20%] w-[500px] h-[500px] rounded-full bg-accent opacity-[0.015] blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-20%] w-[500px] h-[500px] rounded-full bg-accent opacity-[0.015] blur-[150px] pointer-events-none"></div>

      <Suspense fallback={
        <div className="w-full max-w-md bg-card border border-border-custom p-8 rounded-2xl flex items-center justify-center min-h-[300px]">
          <span className="text-zinc-500 text-xs font-mono">Loading form...</span>
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </div>
  );
}