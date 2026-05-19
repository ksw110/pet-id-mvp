import { NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// 등록코드를 새로 만드는 API입니다.
// 사용자가 직접 코드를 넣지 않으면 nanoid로 자동 생성합니다.
const createCodeSuffix = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

function normalizeCode(code: string) {
  // 공백이나 소문자 등 입력 흔들림을 줄여 중복 충돌 가능성을 낮춥니다.
  return code.trim().toUpperCase().replace(/\s+/g, '-');
}

export async function POST(req: Request) {
  const { password, code } = await req.json();
  const adminPassword = process.env.QR_ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json(
      { error: '관리자 비밀번호가 올바르지 않습니다.' },
      { status: 401 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  const registrationCode = code
    ? normalizeCode(String(code))
    : `PET-${createCodeSuffix()}`;

  if (!registrationCode) {
    return NextResponse.json(
      { error: '등록코드를 입력해주세요.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('registration_codes')
    .insert({ code: registrationCode })
    .select('code, created_at')
    .single();

  if (error) {
    const isDuplicate = error.code === '23505';

    return NextResponse.json(
      { error: isDuplicate ? '이미 존재하는 등록코드입니다.' : error.message },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  return NextResponse.json({ code: data.code, created_at: data.created_at });
}
