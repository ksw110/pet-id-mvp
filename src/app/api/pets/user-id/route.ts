import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// 등록 시 "고객 ID 중복 확인" 버튼이 호출하는 API입니다.
function normalizeUserId(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    // 클라이언트는 `{ user_id: "..." }` 형태의 JSON을 보냅니다.
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
      // data가 있으면 이미 누군가 쓰는 ID, 없으면 새로 사용 가능
      available: !data,
    });
  } catch {
    return NextResponse.json(
      { error: '고객 ID 중복 확인 중 오류가 발생했어요.' },
      { status: 500 }
    );
  }
}
