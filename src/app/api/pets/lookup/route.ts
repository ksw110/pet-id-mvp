import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const { registration_code } = await req.json();
  const code = String(registration_code || '').trim().toUpperCase();

  if (!code) {
    return NextResponse.json(
      { error: '등록번호를 입력해주세요.' },
      { status: 400 }
    );
  }

  const { data: pet, error } = await supabaseAdmin
    .from('pets')
    .select('id, pet_name')
    .eq('registration_code', code)
    .single();

  if (error || !pet) {
    return NextResponse.json(
      { error: '등록된 정보를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  return NextResponse.json({
    pet_name: pet.pet_name,
    url: `${baseUrl}/pet/${pet.id}`,
  });
}
