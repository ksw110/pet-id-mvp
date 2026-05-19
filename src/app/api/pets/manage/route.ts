import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { hashPetPassword } from '@/lib/pet-password';

// 수정 페이지 로그인용 API입니다.
// 고객 ID와 비밀번호를 확인한 뒤, 수정 폼에 채울 반려견 정보를 돌려줍니다.
export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // 클라이언트가 보내는 JSON 예시:
    // {
    //   user_id: "meonggrey01",
    //   password: "123456"
    // }
    const { user_id, password } = await req.json();

    // normalizedUserId:
    // 사용자가 대문자/공백을 섞어 입력해도 같은 ID로 취급되게 정리한 값입니다.
    const normalizedUserId = String(user_id || '').trim().toLowerCase();

    // plainPassword:
    // 사용자가 입력한 원문 비밀번호입니다.
    // DB에는 원문이 없으므로 아래에서 해시로 바꿔 비교합니다.
    const plainPassword = String(password || '');

    if (!normalizedUserId || !plainPassword) {
      return NextResponse.json(
        { error: '고객 ID와 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('pets')
      .select('id, registration_code, user_id, password_hash, pet_name, owner_name, phone, emergency_phone, gender, birth_year, animal_registration_number, emergency_note, image_url, location')
      .eq('user_id', normalizedUserId)
      .single();

    // 저장된 비밀번호 원문은 DB에 없으므로,
    // 사용자가 입력한 비밀번호를 같은 규칙으로 다시 해시해서 비교합니다.
    const passwordHash = data ? hashPetPassword(plainPassword, data.registration_code) : '';

    if (error || !data || data.password_hash !== passwordHash) {
      return NextResponse.json(
        { error: '고객 ID 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      // 이 응답 객체는 edit/page.tsx가 그대로 받아서
      // 수정 입력칸의 기본값으로 사용합니다.
      pet: {
        id: data.id,
        registration_code: data.registration_code,
        user_id: data.user_id,
        pet_name: data.pet_name,
        owner_name: data.owner_name,
        phone: data.phone,
        emergency_phone: data.emergency_phone,
        gender: data.gender,
        birth_year: data.birth_year,
        animal_registration_number: data.animal_registration_number,
        emergency_note: data.emergency_note,
        image_url: data.image_url,
        location: data.location,
      },
    });
  } catch {
    return NextResponse.json(
      { error: '서버 오류' },
      { status: 500 }
    );
  }
}
