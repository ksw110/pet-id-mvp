import { NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { hashPetPassword } from '@/lib/pet-password';

const createTemporaryPassword = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789', 10);

export async function POST(req: Request) {
  try {
    const { admin_password, registration_code } = await req.json();
    const adminPassword = process.env.QR_ADMIN_PASSWORD;
    const code = String(registration_code || '').trim().toUpperCase();

    if (!adminPassword || admin_password !== adminPassword) {
      return NextResponse.json(
        { error: '관리자 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: '등록코드를 입력해주세요.' },
        { status: 400 }
      );
    }

    const temporaryPassword = createTemporaryPassword();
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('pets')
      .update({ password_hash: hashPetPassword(temporaryPassword, code) })
      .eq('registration_code', code)
      .select('id')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: '해당 등록코드의 반려견 정보를 찾지 못했어요.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ temporary_password: temporaryPassword });
  } catch {
    return NextResponse.json(
      { error: '비밀번호 재설정 중 오류가 발생했어요.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { registration_code, current_password, new_password } = await req.json();
    const code = String(registration_code || '').trim().toUpperCase();
    const currentPassword = String(current_password || '');
    const newPassword = String(new_password || '');

    if (!code || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '등록코드, 현재 비밀번호, 새 비밀번호를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '새 비밀번호는 6자 이상 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const currentPasswordHash = hashPetPassword(currentPassword, code);
    const { data: pet, error: petError } = await supabaseAdmin
      .from('pets')
      .select('id, password_hash')
      .eq('registration_code', code)
      .single();

    if (petError || !pet || pet.password_hash !== currentPasswordHash) {
      return NextResponse.json(
        { error: '현재 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('pets')
      .update({ password_hash: hashPetPassword(newPassword, code) })
      .eq('id', pet.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: '비밀번호 변경 중 오류가 발생했어요.' },
      { status: 500 }
    );
  }
}
