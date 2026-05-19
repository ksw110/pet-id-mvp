import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// 고객 ID로 공개 URL을 찾는 간단한 조회 API입니다.
export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const { user_id } = await req.json();
  const normalizedUserId = String(user_id || '').trim().toLowerCase();

  if (!normalizedUserId) {
    return NextResponse.json(
      { error: '고객 ID를 입력해주세요.' },
      { status: 400 }
    );
  }

  const { data: pet, error } = await supabaseAdmin
    .from('pets')
    .select('id, pet_name')
    .eq('user_id', normalizedUserId)
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
