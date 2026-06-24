import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type RouteParams = {
  params: Promise<{ username: string }> | { username: string };
};

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    // แก้ปัญหาความแตกต่างของ params ระหว่าง Next.js 14 และ 15 (Promise compatibility)
    const resolvedParams = 'then' in context.params ? await context.params : context.params;
    const username = resolvedParams.username;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // 1. ดึงข้อมูลประวัติผู้เล่น (Player Profile)
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .ilike('username', username)
      .maybeSingle();

    if (playerError) {
      return NextResponse.json({ error: playerError.message }, { status: 500 });
    }

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // 2. ดึงค่าการตั้งค่าเกมทั้งหมดของผู้เล่นคนนี้ (Game Settings)
    const { data: settingsData, error: settingsError } = await supabase
      .from('player_game_settings')
      .select(`
        id,
        game_role,
        mouse_dpi,
        mouse_hz,
        in_game_sens,
        edpi,
        resolution,
        aspect_ratio,
        refresh_rate,
        settings_data,
        games (
          id,
          name,
          slug
        )
      `)
      .eq('player_id', player.id);

    if (settingsError) {
      return NextResponse.json({ error: settingsError.message }, { status: 500 });
    }

    // 3. ดึงรายการอุปกรณ์ (Gears & Hardware) ที่ผู้เล่นคนนี้ใช้งาน
    const { data: productsData, error: productsError } = await supabase
      .from('player_products')
      .select(`
        products (
          id,
          name,
          category,
          product_type,
          shopee_url,
          lazada_url,
          amazon_url,
          image_url,
          estimated_price_thb
        )
      `)
      .eq('player_id', player.id);

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    // ปรับโครงสร้างข้อมูลสินค้าให้อ่านง่าย
    const products = (productsData || [])
      .map((item: any) => item.products)
      .filter((p: any) => p !== null);

    // แบ่งประเภทสินค้าเป็น Gears และ Hardware specs
    const gears = products.filter((p: any) => p.product_type === 'gear');
    const hardware = products.filter((p: any) => p.product_type === 'hardware');

    // จัดกลุ่มสไตล์เซ็ตติ้งตามเกม
    const formattedSettings = (settingsData || []).map((item: any) => ({
      game: item.games.name,
      game_slug: item.games.slug,
      role: item.game_role,
      mouse: {
        dpi: item.mouse_dpi,
        hz: item.mouse_hz,
        sens: item.in_game_sens,
        edpi: item.edpi
      },
      video: {
        resolution: item.resolution,
        aspect_ratio: item.aspect_ratio,
        refresh_rate: item.refresh_rate
      },
      specific_settings: item.settings_data
    }));

    return NextResponse.json({
      player: {
        id: player.id,
        username: player.username,
        real_name: player.real_name,
        team: player.team,
        birth_date: player.birth_date,
        nationality: player.nationality,
        country_code: player.country_code,
        profile_img_url: player.profile_img_url,
        created_at: player.created_at
      },
      settings: formattedSettings,
      equipment: {
        gears,
        hardware
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
