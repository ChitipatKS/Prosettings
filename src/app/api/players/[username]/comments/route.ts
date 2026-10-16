import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type RouteParams = {
  params: Promise<{ username: string }>;
};

const REPLY_MARKER_REGEX = /^<!--reply_to:(\d+)-->/;

// GET: ดึงความเห็นทั้งหมดของผู้เล่นรายบุคคล (รวมทั้ง reply, likes_count และ top-level)
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const resolvedParams = 'then' in context.params ? await context.params : context.params;
    const username = resolvedParams.username;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // 1. ดึงข้อมูล player เพื่อเอา player_id
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id')
      .ilike('username', username)
      .maybeSingle();

    if (playerError) {
      return NextResponse.json({ error: playerError.message }, { status: 500 });
    }

    if (!player) {
      return NextResponse.json({ comments: [] });
    }

    // 2. ดึง comments ทั้งหมดของ player_id นี้
    // พยายาม select พร้อม parent_id และ likes_count ก่อน หากตารางยังไม่มี column จะ fallback
    let rawComments: any[] | null = null;
    let commentsError: any = null;

    try {
      const result = await supabase
        .from('comments')
        .select('id, author_name, content, created_at, parent_id, likes_count')
        .eq('player_id', player.id)
        .order('created_at', { ascending: true });

      if (result.error && (result.error.code === '42703' || result.error.message?.includes('likes_count') || result.error.message?.includes('parent_id'))) {
        // Fallback 1: ลองแบบมี parent_id แต่ไม่มี likes_count
        const fallback1 = await supabase
          .from('comments')
          .select('id, author_name, content, created_at, parent_id')
          .eq('player_id', player.id)
          .order('created_at', { ascending: true });

        if (fallback1.error && (fallback1.error.code === '42703' || fallback1.error.message?.includes('parent_id'))) {
          // Fallback 2: ดั้งเดิม
          const fallback2 = await supabase
            .from('comments')
            .select('id, author_name, content, created_at')
            .eq('player_id', player.id)
            .order('created_at', { ascending: true });
          rawComments = fallback2.data;
          commentsError = fallback2.error;
        } else {
          rawComments = fallback1.data;
          commentsError = fallback1.error;
        }
      } else {
        rawComments = result.data;
        commentsError = result.error;
      }
    } catch {
      const fallback = await supabase
        .from('comments')
        .select('id, author_name, content, created_at')
        .eq('player_id', player.id)
        .order('created_at', { ascending: true });
      rawComments = fallback.data;
      commentsError = fallback.error;
    }

    if (commentsError) {
      return NextResponse.json({ error: commentsError.message }, { status: 500 });
    }

    // 3. หาข้อมูลโปรไฟล์ (รูปโปรไฟล์ และยศ admin) จาก user_profiles โดยอ้างอิงจาก author_name
    const authorNames = Array.from(new Set((rawComments || []).map(c => c.author_name).filter(Boolean)));
    const profilesMap: Record<string, { profile_img_url: string | null; is_community_member: boolean; is_admin: boolean; game?: string | null; game_role?: string | null }> = {};

    if (authorNames.length > 0) {
      const { data: matchingProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, username, real_name, is_admin, social_links, game_settings');

      if (!profilesError && matchingProfiles) {
        for (const author of authorNames) {
          const lowerAuthor = author.toLowerCase().trim();
          const matched = matchingProfiles.find(p => 
            (p.username && p.username.toLowerCase().trim() === lowerAuthor) ||
            (p.real_name && p.real_name.toLowerCase().trim() === lowerAuthor)
          );
          if (matched) {
            const rawAvatar = matched.social_links?.profile_img_url || null;
            const valSettings = matched.game_settings?.valorant;
            const csSettings = matched.game_settings?.cs2;
            const valRole = valSettings?.game_role;
            const csRole = csSettings?.game_role;

            let authorGame: string | null = null;
            let authorRole: string | null = null;

            if (valRole && valRole !== 'Community Member') {
              authorGame = 'valorant';
              authorRole = valRole;
            } else if (csRole && csRole !== 'Community Member') {
              authorGame = 'cs2';
              authorRole = csRole;
            } else if (valSettings) {
              authorGame = 'valorant';
            } else if (csSettings) {
              authorGame = 'cs2';
            }

            profilesMap[author] = {
              profile_img_url: rawAvatar,
              is_community_member: true,
              is_admin: Boolean(matched.is_admin),
              game: authorGame,
              game_role: authorRole,
            };
          }
        }
      }
    }

    const comments = (rawComments || []).map(c => {
      const prof = profilesMap[c.author_name];
      let parent_id = c.parent_id !== undefined ? c.parent_id : null;
      let cleanContent = c.content || '';

      // ตรวจสอบ fallback marker <!--reply_to:123-->
      const match = cleanContent.match(REPLY_MARKER_REGEX);
      if (match) {
        if (!parent_id) {
          parent_id = parseInt(match[1], 10);
        }
        cleanContent = cleanContent.replace(REPLY_MARKER_REGEX, '');
      }

      return {
        id: c.id,
        author_name: c.author_name,
        content: cleanContent,
        created_at: c.created_at,
        parent_id: parent_id ? Number(parent_id) : null,
        likes_count: typeof c.likes_count === 'number' ? c.likes_count : 0,
        profile_img_url: prof?.profile_img_url || null,
        is_community_member: !!prof?.is_community_member,
        is_admin: !!prof?.is_admin,
        game: prof?.game || null,
        game_role: prof?.game_role || null
      };
    });

    return NextResponse.json({ comments });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: เพิ่มคอมเมนต์ใหม่ หรือ ตอบกลับคอมเมนต์ (reply)
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const resolvedParams = 'then' in context.params ? await context.params : context.params;
    const username = resolvedParams.username;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // 1. รับข้อมูลจาก request body
    const body = await request.json();
    const { author_name, content, parent_id } = body;

    if (!author_name || !content) {
      return NextResponse.json({ error: 'Name and comment content are required' }, { status: 400 });
    }

    // 2. ค้นหา player เพื่อดึง id
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id')
      .ilike('username', username)
      .maybeSingle();

    if (playerError) {
      return NextResponse.json({ error: playerError.message }, { status: 500 });
    }

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // 3. บันทึกลงตาราง comments
    let newComment: any = null;
    let insertError: any = null;

    if (parent_id) {
      const primaryInsert = await supabase
        .from('comments')
        .insert([
          {
            player_id: player.id,
            author_name: author_name.trim(),
            content: content.trim(),
            parent_id: Number(parent_id),
          }
        ])
        .select()
        .single();

      if (primaryInsert.error && (primaryInsert.error.code === '42703' || primaryInsert.error.message?.includes('parent_id'))) {
        const fallbackContent = `<!--reply_to:${parent_id}-->${content.trim()}`;
        const fallbackInsert = await supabase
          .from('comments')
          .insert([
            {
              player_id: player.id,
              author_name: author_name.trim(),
              content: fallbackContent,
            }
          ])
          .select()
          .single();

        newComment = fallbackInsert.data;
        insertError = fallbackInsert.error;
      } else {
        newComment = primaryInsert.data;
        insertError = primaryInsert.error;
      }
    } else {
      const simpleInsert = await supabase
        .from('comments')
        .insert([
          {
            player_id: player.id,
            author_name: author_name.trim(),
            content: content.trim(),
          }
        ])
        .select()
        .single();

      newComment = simpleInsert.data;
      insertError = simpleInsert.error;
    }

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    let cleanContent = newComment.content || '';
    let parsedParentId = newComment.parent_id ?? null;
    const match = cleanContent.match(REPLY_MARKER_REGEX);
    if (match) {
      if (!parsedParentId) parsedParentId = parseInt(match[1], 10);
      cleanContent = cleanContent.replace(REPLY_MARKER_REGEX, '');
    }

    let isCommentAdmin = false;
    let isCommentMember = false;
    let profileImgUrl: string | null = null;

    try {
      const { data: authorProfile } = await supabase
        .from('user_profiles')
        .select('id, is_admin, social_links')
        .or(`username.ilike.${author_name.trim()},real_name.ilike.${author_name.trim()}`)
        .maybeSingle();

      if (authorProfile) {
        isCommentMember = true;
        isCommentAdmin = Boolean(authorProfile.is_admin);
        profileImgUrl = authorProfile.social_links?.profile_img_url || null;
      }
    } catch {}

    return NextResponse.json({
      comment: {
        ...newComment,
        content: cleanContent,
        parent_id: parsedParentId ? Number(parsedParentId) : null,
        likes_count: newComment.likes_count ?? 0,
        is_admin: isCommentAdmin,
        is_community_member: isCommentMember,
        profile_img_url: profileImgUrl
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: กดใจ (Like / Unlike) ให้คอมเมนต์
export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const resolvedParams = 'then' in context.params ? await context.params : context.params;
    const username = resolvedParams.username;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const body = await request.json();
    const { comment_id, delta = 1 } = body;

    if (!comment_id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    // ดึงค่า likes_count ปัจจุบัน
    const { data: comment, error: fetchErr } = await supabase
      .from('comments')
      .select('id, likes_count')
      .eq('id', comment_id)
      .maybeSingle();

    if (fetchErr && (fetchErr.code === '42703' || fetchErr.message?.includes('likes_count'))) {
      // ตารางยังไม่มี column likes_count ให้ตอบ success เพื่อให้ฝั่ง client ใช้งาน optimistic UI ได้ต่อเนื่อง
      return NextResponse.json({ success: true, likes_count: Math.max(0, delta) });
    }

    const currentLikes = comment?.likes_count || 0;
    const newLikes = Math.max(0, currentLikes + Number(delta));

    const { data: updated, error: updateErr } = await supabase
      .from('comments')
      .update({ likes_count: newLikes })
      .eq('id', comment_id)
      .select('id, likes_count')
      .maybeSingle();

    if (updateErr) {
      return NextResponse.json({ success: true, likes_count: newLikes });
    }

    return NextResponse.json({ success: true, likes_count: updated?.likes_count ?? newLikes });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: ลบคอมเมนต์ (สำหรับ Admin)
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const resolvedParams = 'then' in context.params ? await context.params : context.params;
    const username = resolvedParams.username;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const id = Number(commentId);

    // 1. ลบ replies ย่อยของ comment นี้ถ้ามี
    try {
      await supabase.from('comments').delete().eq('parent_id', id);
    } catch {}

    // ลบ fallback marker replies
    try {
      await supabase.from('comments').delete().ilike('content', `<!--reply_to:${id}-->%`);
    } catch {}

    // 2. ลบตัวคอมเมนต์เอง
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
