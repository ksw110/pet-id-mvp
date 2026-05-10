import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

function normalizeUserId(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    const { user_id } = await req.json();
    const normalizedUserId = normalizeUserId(user_id);

    if (!normalizedUserId) {
      return NextResponse.json(
        { error: '고객 ID를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9._-]{4,20}$/.test(normalizedUserId)) {
      return NextResponse.json(
        { error: '고객 ID는 4~20자의 영문 소문자, 숫자, 점(.), 밑줄(_), 하이픈(-)만 사용할 수 있어요.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('pets')
      .select('id')
      .eq('user_id', normalizedUserId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      available: !data,
    });
  } catch {
    return NextResponse.json(
      { error: '고객 ID 중복 확인 중 오류가 발생했어요.' },
      { status: 500 }
    );
  }
}
