import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 연락처로 저장된 QR 이미지를 찾는 관리자용 조회 API입니다.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone')?.trim();
  const password = searchParams.get('password') || '';
  const adminPassword = process.env.QR_ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json(
      { error: '관리자 비밀번호가 올바르지 않습니다.' },
      { status: 401 }
    );
  }

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
