import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeAvatar } from '@/lib/avatar';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;
      const meta = user.user_metadata || {};
      const provider = (
        user.app_metadata?.provider ||
        (meta.iss?.includes('google')
          ? 'google'
          : meta.iss?.includes('twitter')
          ? 'twitter'
          : meta.iss?.includes('discord')
          ? 'discord'
          : '')
      ).toLowerCase();
      const isDiscord = provider === 'discord';
      const isTwitter = provider === 'twitter';

      // ดึง avatar และชื่อจาก OAuth (Google / Discord / Twitter (X) / etc.)
      const rawAvatar =
        meta.avatar_url ||
        meta.picture ||
        meta.profile_image_url_https ||
        meta.profile_image_url ||
        '';
      const oauthAvatar = normalizeAvatar(rawAvatar);
      const oauthFullName = meta.full_name || meta.name || null;
      const oauthDisplayName =
        meta.custom_claims?.global_name ||
        meta.full_name ||
        meta.name ||
        '';
      const oauthHandle =
        meta.preferred_username ||
        meta.user_name ||
        meta.screen_name ||
        '';
      const oauthUsername =
        (isTwitter
          ? oauthHandle || (user.email ? user.email.split('@')[0] : '')
          : isDiscord
          ? (oauthDisplayName || oauthHandle)
          : (user.email ? user.email.split('@')[0] : '')) ||
        oauthHandle ||
        oauthDisplayName ||
        '';

      // ตรวจสอบ profile ในฐานข้อมูล
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, username, real_name, is_profile_created, social_links')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        // สร้าง Profile เริ่มต้นพร้อมข้อมูลจาก Google/Discord/Twitter (X)
        await supabase.from('user_profiles').insert({
          id: user.id,
          username: oauthUsername,
          real_name: oauthFullName,
          social_links: {
            ...(isDiscord && oauthHandle ? { discord: oauthHandle } : {}),
            ...(isTwitter && oauthHandle ? { twitter: oauthHandle } : {}),
            profile_img_url: oauthAvatar || null,
          },
          is_profile_created: false,
        });

        return NextResponse.redirect(`${origin}${next || '/profile'}`);
      } else if (!profile.is_profile_created) {
        // หากยังไม่ได้สร้าง profile เสร็จ ให้อัปเดตชื่อและรูปภาพเริ่มต้น
        const updatePayload: any = {};
        if (oauthUsername && !profile.username) {
          updatePayload.username = oauthUsername;
        }
        if (oauthFullName && !profile.real_name) {
          updatePayload.real_name = oauthFullName;
        }
        const currentAvatar = profile.social_links?.profile_img_url;
        const needsAvatarUpdate =
          oauthAvatar &&
          (!currentAvatar || currentAvatar.includes('.png') || currentAvatar.includes('_normal.'));
        const needsDiscordSocial = isDiscord && oauthHandle && !profile.social_links?.discord;
        const needsTwitterSocial = isTwitter && oauthHandle && !profile.social_links?.twitter;

        if (needsAvatarUpdate || needsDiscordSocial || needsTwitterSocial) {
          updatePayload.social_links = {
            ...(profile.social_links || {}),
            ...(needsAvatarUpdate ? { profile_img_url: oauthAvatar } : {}),
            ...(needsDiscordSocial ? { discord: oauthHandle } : {}),
            ...(needsTwitterSocial ? { twitter: oauthHandle } : {}),
          };
        }

        if (Object.keys(updatePayload).length > 0) {
          await supabase
            .from('user_profiles')
            .update(updatePayload)
            .eq('id', user.id);
        }

        return NextResponse.redirect(`${origin}${next || '/profile'}`);
      }

      // หากเคยตั้งค่าโปรไฟล์เรียบร้อยแล้ว ให้ไปหน้าเป้าหมายหรือหน้า profile
      return NextResponse.redirect(`${origin}${next || '/profile'}`);
    }
  }

  // หากเกิดข้อผิดพลาดในการแลก Token ให้พาไปหน้า login พร้อม error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
