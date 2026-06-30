'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type FavoriteButtonProps = {
  playerId: number;
};

export default function FavoriteButton({ playerId }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setLoading(false);
          return;
        }
        setUserId(session.user.id);
        
        const { data, error } = await supabase
          .from('user_favorites')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('player_id', playerId)
          .maybeSingle();
        
        if (data) {
          setIsFavorited(true);
        }
      } catch (err) {
        console.error('Error checking favorite:', err);
      } finally {
        setLoading(false);
      }
    };
    checkFavorite();
  }, [playerId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    if (!userId) {
      // User is not logged in, redirect to login page and pass return URL
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    try {
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('player_id', playerId);

        if (!error) {
          setIsFavorited(false);
        } else {
          console.error('Failed to remove favorite:', error.message);
        }
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: userId,
            player_id: playerId
          });

        if (!error) {
          setIsFavorited(true);
        } else {
          console.error('Failed to add favorite:', error.message);
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-9 w-9 rounded-lg bg-zinc-800/40 border border-zinc-700/30 animate-pulse flex items-center justify-center">
        <span className="h-4.5 w-4.5 rounded-full bg-zinc-700/50"></span>
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={`h-9 w-9 flex items-center justify-center rounded-lg border transition-all duration-300 active:scale-90 cursor-pointer ${
        isFavorited
          ? 'bg-accent/15 border-accent/40 text-accent shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:bg-accent/25'
          : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700/80 text-zinc-500 hover:text-zinc-300'
      }`}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg
        className={`h-4.5 w-4.5 transition-transform duration-300 ${isFavorited ? 'scale-110 fill-accent' : 'fill-none'}`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499c.176-.436.782-.436.958 0l2.122 5.24 5.68.82c.488.07.68.671.327 1.01l-4.107 4.007 1.083 5.68c.093.488-.42.86-.856.63L12 18.902l-5.086 2.67c-.436.229-.949-.142-.856-.63l1.083-5.68-4.107-4.007c-.353-.34-.16-.94.327-1.01l5.68-.82 2.122-5.24z"
        />
      </svg>
    </button>
  );
}
