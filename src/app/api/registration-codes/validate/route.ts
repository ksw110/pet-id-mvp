import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const { registration_code } = await req.json();
  const code = String(registration_code || '').trim().toUpperCase();

  if (!code) {
    return NextResponse.json(
      { error: '등록코드를 입력해주세요.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('registration_codes')
    .select('code, pet_id')
    .eq('code', code)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: '유효하지 않은 등록코드입니다.' },
      { status: 404 }
    );
  }

  if (data.pet_id) {
    return NextResponse.json(
      { error: '이미 사용된 등록코드입니다.' },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, code });
}
