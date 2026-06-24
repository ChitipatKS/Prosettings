import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const type = searchParams.get('type') || '';
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10); // ตั้ง Default ดึง 50 รายการ

    let query = supabase.from('products').select('*');

    // กรองตามหมวดหมู่ย่อย (เช่น mouse, keyboard, monitor)
    if (category) {
      query = query.eq('category', category.toLowerCase());
    }

    // กรองตามประเภทหลัก (เช่น gear, hardware)
    if (type) {
      query = query.eq('product_type', type.toLowerCase());
    }

    // ค้นหาตามชื่อรุ่นสินค้า
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // เรียงตามตัวอักษรและจำกัดจำนวนข้อมูล
    query = query.limit(limit).order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
