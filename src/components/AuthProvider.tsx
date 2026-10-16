'use client';

import React, { createContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { normalizeDiscordAvatar } from '@/lib/avatar';

export interface UserProfileData {
  id: string;
  username?: string | null;
  real_name?: string | null;
  profile_img_url?: string | null;
  is_admin?: boolean | null;
  is_profile_created?: boolean | null;
  social_links?: any;
  game_settings?: any;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfileData | null;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isAdmin: false,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ฟังก์ชันเช็คโปรไฟล์และสิทธิ์ Admin จากตาราง user_profiles
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('id, username, real_name, is_admin, is_profile_created, social_links, game_settings')
        .eq('id', userId)
        .maybeSingle();

      if (prof) {
        setProfile({
          ...prof,
          profile_img_url: normalizeDiscordAvatar(prof.social_links?.profile_img_url),
        });
      } else {
        setProfile(null);
      }
      setIsAdmin(!!prof?.is_admin);
    } catch {
      setProfile(null);
      setIsAdmin(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // 1. ดึง Session เริ่มต้นเมื่อเข้าเว็บ
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        fetchUserProfile(currentUser.id).finally(() => setIsLoading(false));
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsLoading(false);
      }
    });

    // 2. ฟัง Event การล็อกอิน / ล็อกเอาต์ แบบ Real-time
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchUserProfile(currentUser.id);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      isAdmin,
      isLoading,
      signOut,
      refreshProfile,
    }),
    [user, session, profile, isAdmin, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}