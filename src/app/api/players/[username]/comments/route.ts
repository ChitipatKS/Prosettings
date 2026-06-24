import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type RouteParams = {
  params: Promise<{ username: string }> | { username: string };
};

// GET: ดึงความเห็นทั้งหมดของผู้เล่นรายบุคคล
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
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // 2. ดึง comments ทั้งหมดของ player_id นี้ เรียงลำดับจากล่าสุด
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('id, author_name, mouse_model, content, created_at')
      .eq('player_id', player.id)
      .order('created_at', { ascending: false });

    if (commentsError) {
      return NextResponse.json({ error: commentsError.message }, { status: 500 });
    }

    return NextResponse.json({ comments });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: เพิ่มคอมเมนต์ใหม่
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const resolvedParams = 'then' in context.params ? await context.params : context.params;
    const username = resolvedParams.username;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // 1. รับข้อมูลจาก request body
    const body = await request.json();
    const { author_name, mouse_model, content } = body;

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
    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert([
        {
          player_id: player.id,
          author_name: author_name.trim(),
          mouse_model: mouse_model ? mouse_model.trim() : null,
          content: content.trim()
        }
      ])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ comment: newComment });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
