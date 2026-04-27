import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone')?.trim();

  if (!phone) {
    return NextResponse.json(
      { error: '연락처를 입력해주세요.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('pets')
    .select('id, pet_name, phone, qr_image_url')
    .eq('phone', phone);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ pets: data ?? [] });
}
