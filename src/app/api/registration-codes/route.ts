import { NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';
import QRCode from 'qrcode';
import { Buffer } from 'node:buffer';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// 등록코드를 새로 만드는 API입니다.
// 사용자가 직접 코드를 넣지 않으면 nanoid로 자동 생성합니다.
const createCodeSuffix = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

function normalizeCode(code: string) {
  // 공백이나 소문자 등 입력 흔들림을 줄여 중복 충돌 가능성을 낮춥니다.
  return code.trim().toUpperCase().replace(/\s+/g, '-');
}

async function uploadBufferToStorage(
  buffer: Buffer,
  path: string,
  contentType: string
) {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.storage
    .from('pet-images')
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabaseAdmin.storage
    .from('pet-images')
    .getPublicUrl(path);

  return data.publicUrl;
}

async function removeStorageFile(path: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.storage
    .from('pet-images')
    .remove([path]);

  if (error) {
    console.error('Failed to remove old qr image:', error.message);
  }
}

async function createPlaceholderPet(
  petId: string,
  registrationCode: string,
  qrImageUrl: string
) {
  const supabaseAdmin = getSupabaseAdmin();

  // 공개 URL이 바로 열리도록 pets 테이블에도 "빈 껍데기 행"을 먼저 만들어 둡니다.
  // 나중에 고객이 정보 등록을 완료하면 같은 id의 행을 채워 넣는 방식입니다.
  const { error } = await supabaseAdmin.from('pets').upsert(
    {
      id: petId,
      registration_code: registrationCode,
      pet_name: '',
      owner_name: '',
      phone: '',
      emergency_phone: '',
      user_id: null,
      gender: null,
      birth_year: null,
      animal_registration_number: '',
      emergency_note: '',
      image_url: '',
      qr_image_url: qrImageUrl,
      location: '',
      password_hash: '',
    },
    {
      onConflict: 'id',
    }
  );

  if (error) {
    throw new Error(error.message);
  }
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

  const { data: existingCode } = await supabaseAdmin
    .from('registration_codes')
    .select('code')
    .eq('code', registrationCode)
    .maybeSingle();

  if (existingCode) {
    return NextResponse.json(
      { error: '이미 존재하는 등록코드입니다.' },
      { status: 409 }
    );
  }

  const petId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8)();
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const qrUrl = `${baseUrl}/pet/${petId}`;
  const qrPath = `qr_code/${petId}.png`;
  const qrBuffer = await QRCode.toBuffer(qrUrl, {
    width: 800,
    errorCorrectionLevel: 'H',
  });
  const qrImageUrl = await uploadBufferToStorage(qrBuffer, qrPath, 'image/png');

  const { data, error } = await supabaseAdmin
    .from('registration_codes')
    .insert({
      code: registrationCode,
      pet_id: petId,
      qr_image_url: qrImageUrl,
    })
    .select('code, created_at, pet_id, qr_image_url')
    .single();

  if (error) {
    await removeStorageFile(qrPath);

    const isDuplicate = error.code === '23505';

    return NextResponse.json(
      { error: isDuplicate ? '이미 존재하는 등록코드입니다.' : error.message },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  try {
    await createPlaceholderPet(petId, registrationCode, qrImageUrl);
  } catch (petError) {
    await supabaseAdmin
      .from('registration_codes')
      .delete()
      .eq('code', registrationCode);
    await removeStorageFile(qrPath);

    return NextResponse.json(
      {
        error:
          petError instanceof Error
            ? petError.message
            : '빈 반려견 레코드를 만드는 데 실패했어요.',
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    code: data.code,
    created_at: data.created_at,
    pet_id: data.pet_id,
    qr_image_url: data.qr_image_url,
  });
}
