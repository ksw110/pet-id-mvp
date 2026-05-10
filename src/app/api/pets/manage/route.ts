import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { hashPetPassword } from '@/lib/pet-password';

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { user_id, password } = await req.json();
    const normalizedUserId = String(user_id || '').trim().toLowerCase();
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

    const passwordHash = data ? hashPetPassword(plainPassword, data.registration_code) : '';

    if (error || !data || data.password_hash !== passwordHash) {
      return NextResponse.json(
        { error: '고객 ID 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
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
