import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { nanoid } from 'nanoid';
import { hashPetPassword } from '@/lib/pet-password';

// 이 파일은 반려견 등록(POST)과 수정(PATCH) 둘 다 담당하는 핵심 API입니다.
// 초심자 관점에서는 아래 순서로 읽으면 이해가 쉽습니다.
// 1) formData에서 값 꺼내기
// 2) 값 검증하기
// 3) DB/스토리지 조회
// 4) 파일 업로드와 QR 생성
// 5) 최종 저장 또는 수정
const MAX_PET_NAME_LENGTH = 20;
const MAX_OWNER_NAME_LENGTH = 20;
const MAX_LOCATION_LENGTH = 50;
const MAX_EMERGENCY_NOTE_LENGTH = 200;
const MAX_USER_ID_LENGTH = 20;
const ALLOWED_GENDERS = new Set(['', 'male', 'female']);

function getFormString(formData: FormData, name: string) {
  // FormData의 값은 File일 수도 있고 null일 수도 있으므로,
  // 문자열 입력 칸은 이렇게 안전하게 꺼내두면 이후 코드가 단순해집니다.
  return String(formData.get(name) || '').trim();
}

function parseBirthYear(value: string) {
  // birth_year는 선택값이라 비어 있으면 null을 허용합니다.
  // DB에는 빈 문자열보다 null이 더 자연스러운 표현입니다.
  if (!value) {
    return null;
  }

  if (!/^\d{4}$/.test(value)) {
    throw new Error('태어난 연도는 4자리 숫자로 입력해주세요.');
  }

  const year = Number(value);
  const currentYear = new Date().getFullYear();

  if (year < 2000 || year > currentYear) {
    throw new Error(`태어난 연도는 2000년부터 ${currentYear}년 사이로 입력해주세요.`);
  }

  return year;
}

function parseGender(value: string) {
  // 성별은 UI에서 radio 버튼으로 골라주지만,
  // 서버에서도 다시 허용값인지 검사해야 안전합니다.
  if (!ALLOWED_GENDERS.has(value)) {
    throw new Error('성별은 남아 또는 여아만 선택할 수 있어요.');
  }

  return value || null;
}

function parseUserId(value: string) {
  // 고객 ID는 로그인/조회 URL에 쓰이므로 형식을 엄격하게 제한합니다.
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    throw new Error('고객 ID를 입력해주세요.');
  }

  if (!/^[a-z0-9._-]{4,20}$/.test(normalized)) {
    throw new Error('고객 ID는 4~20자의 영문 소문자, 숫자, 점(.), 밑줄(_), 하이픈(-)만 사용할 수 있어요.');
  }

  return normalized;
}

function validateTextLength(value: string, maxLength: number, label: string) {
  // 긴 텍스트가 DB 컬럼 길이 또는 UI 설계를 깨지 않게 막는 공통 검사 함수입니다.
  if (value.length > maxLength) {
    throw new Error(`${label}은(는) ${maxLength}자 이하로 입력해주세요.`);
  }
}

function getUploadFileName(file: File, fallbackName: string) {
  // 업로드 파일명은 특수문자와 긴 이름을 정리해서 스토리지 경로 문제를 줄입니다.
  const extension = file.type === 'image/png' ? 'png' : 'jpg';
  const safeBaseName = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40) || fallbackName;

  return `${Date.now()}-${safeBaseName}.${extension}`;
}

function getPetImagePathFromPublicUrl(publicUrl: string) {
  // Supabase 공개 URL에서 "버킷 내부 실제 파일 경로"만 다시 뽑아냅니다.
  // 수정 시 예전 이미지를 삭제할 때 필요합니다.
  if (!publicUrl) {
    return null;
  }

  const marker = '/storage/v1/object/public/pet-images/';
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const path = publicUrl.slice(markerIndex + marker.length).split('?')[0];

  if (!path.startsWith('pet_photos/')) {
    return null;
  }

  return decodeURIComponent(path);
}

async function uploadFileToStorage(
  file: File,
  path: string,
  contentType: string
) {
  // 브라우저 File은 arrayBuffer()로 읽고, 서버에서는 Buffer로 바꿔 업로드합니다.
  const supabaseAdmin = getSupabaseAdmin();
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabaseAdmin.storage
    .from('pet-images')
    .upload(path, fileBuffer, {
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
  // 예전 사진을 정리하는 보조 함수입니다.
  // 삭제 실패가 전체 수정 실패가 되면 UX가 너무 나빠져서 여기서는 로그만 남깁니다.
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.storage
    .from('pet-images')
    .remove([path]);

  if (error) {
    console.error('Failed to remove old pet image:', error.message);
  }
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const formData = await req.formData();
    // 1. 요청에서 문자열 입력값과 파일을 꺼냅니다.
    const pet_name = getFormString(formData, 'pet_name');
    const owner_name = getFormString(formData, 'owner_name');
    const phone = getFormString(formData, 'phone');
    const emergency_phone = getFormString(formData, 'emergency_phone');
    const user_id = getFormString(formData, 'user_id');
    const gender = getFormString(formData, 'gender');
    const birth_year = getFormString(formData, 'birth_year');
    const animal_registration_number = getFormString(formData, 'animal_registration_number');
    const emergency_note = getFormString(formData, 'emergency_note');
    const location = getFormString(formData, 'location');
    const code = getFormString(formData, 'registration_code').toUpperCase();

    // plainPassword:
    // 사용자가 입력한 원본 비밀번호
    // 이후 hashPetPassword()로 변환해서 DB에 저장합니다.
    const plainPassword = getFormString(formData, 'password');

    // imageFile:
    // 클라이언트의 PetPhotoPicker가 준비한 최종 크롭 이미지 파일입니다.
    const imageFile = formData.get('image_file');

    // parsed* 변수들:
    // raw 문자열을 "서버가 신뢰할 수 있는 형태"로 바꾼 값입니다.
    const parsedUserId = parseUserId(user_id);
    const parsedGender = parseGender(gender);
    const parsedBirthYear = parseBirthYear(birth_year);

    // 2. 길이/형식 검증은 DB에 쓰기 전에 최대한 앞단에서 끝내는 편이 좋습니다.
    validateTextLength(parsedUserId, MAX_USER_ID_LENGTH, '고객 ID');
    validateTextLength(pet_name, MAX_PET_NAME_LENGTH, '반려견 이름');
    validateTextLength(owner_name, MAX_OWNER_NAME_LENGTH, '보호자 이름');
    validateTextLength(location, MAX_LOCATION_LENGTH, '활동 지역');
    validateTextLength(emergency_note, MAX_EMERGENCY_NOTE_LENGTH, '특이사항');

    if (!code || !plainPassword || !pet_name || !owner_name || !phone) {
      return NextResponse.json(
        { error: '필수값 없음' },
        { status: 400 }
      );
    }

    if (plainPassword.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 6자 이상 입력해주세요.' },
        { status: 400 }
      );
    }

    // 3. 등록코드가 실제로 존재하는지, 아직 사용되지 않았는지 확인합니다.
    const { data: registrationCodeData, error: registrationCodeError } = await supabaseAdmin
      .from('registration_codes')
      .select('code, pet_id, used_at, qr_image_url')
      .eq('code', code)
      .single();

    if (registrationCodeError || !registrationCodeData) {
      return NextResponse.json(
        { error: '유효하지 않은 등록코드입니다.' },
        { status: 404 }
      );
    }

    if (registrationCodeData.used_at) {
      return NextResponse.json(
        { error: '이미 사용된 등록코드입니다.' },
        { status: 409 }
      );
    }

    // 4. 고객 ID는 공개 URL 조회와 수정 로그인에 사용되므로 중복되면 안 됩니다.
    const { data: existingUserId, error: existingUserIdError } = await supabaseAdmin
      .from('pets')
      .select('id')
      .eq('user_id', parsedUserId)
      .maybeSingle();

    if (existingUserIdError) {
      return NextResponse.json(
        { error: existingUserIdError.message },
        { status: 500 }
      );
    }

    if (existingUserId) {
      return NextResponse.json(
        { error: '이미 사용 중인 고객 ID예요. 다른 ID를 입력해주세요.' },
        { status: 409 }
      );
    }

    // 5. 저장에 필요한 파생값을 만듭니다.
    // id: 관리자가 QR 생성 시 미리 예약해둔 공개 페이지 ID입니다.
    // registration_codes.pet_id에 저장된 값이 곧 pets.id가 됩니다.
    // passwordHash: DB에 저장할 비밀번호 해시
    // imageUrl: 사진 업로드 결과 URL
    const id = registrationCodeData.pet_id || nanoid(8);
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/pet/${id}`;

    // passwordHash:
    // 실제 DB에 저장되는 값입니다.
    // 사용자가 입력한 비밀번호 원문 대신, 등록코드와 함께 해시한 문자열이 들어갑니다.
    const passwordHash = hashPetPassword(plainPassword, code);

    // imageUrl:
    // 스토리지 업로드가 끝난 뒤 DB에 저장할 공개 URL입니다.
    // 사진이 없으면 빈 문자열로 남습니다.
    let imageUrl = '';

    if (imageFile instanceof File && imageFile.size > 0) {
      const imagePath = `pet_photos/${id}-${getUploadFileName(imageFile, 'pet-photo')}`;
      imageUrl = await uploadFileToStorage(
        imageFile,
        imagePath,
        imageFile.type || 'image/jpeg'
      );
    }

    // qrImageUrl:
    // 관리자가 등록코드 생성 시 미리 만든 QR 이미지 URL을 그대로 사용합니다.
    const qrImageUrl = registrationCodeData.qr_image_url || '';

    // 6. 관리자가 미리 만들어둔 빈 pets 행을 채우거나,
    //    혹시 행이 없다면 새로 만들어서 정보 등록을 완료합니다.
    const { error } = await supabaseAdmin.from('pets').upsert({
      id,
      registration_code: code,
      user_id: parsedUserId,
      password_hash: passwordHash,
      pet_name,
      owner_name,
      phone,
      emergency_phone,
      gender: parsedGender,
      birth_year: parsedBirthYear,
      animal_registration_number,
      emergency_note,
      image_url: imageUrl,
      qr_image_url: qrImageUrl,
      location,
    }, {
      onConflict: 'id',
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 7. 등록코드도 "이미 사용됨" 상태로 바꿔서 재사용을 막습니다.
    const { error: registrationCodeUpdateError } = await supabaseAdmin
      .from('registration_codes')
      .update({
        pet_id: id,
        used_at: new Date().toISOString(),
      })
      .eq('code', code)
      .is('used_at', null);

    if (registrationCodeUpdateError) {
      return NextResponse.json(
        { error: registrationCodeUpdateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id,
      url,
      qr_image_url: qrImageUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const formData = await req.formData();
    // 수정은 "현재 로그인한 사용자"와 "바꿀 값"을 함께 받습니다.
    const current_user_id = getFormString(formData, 'current_user_id');
    const user_id = getFormString(formData, 'user_id');
    const plainPassword = getFormString(formData, 'password');
    const imageFile = formData.get('image_file');
    const gender = getFormString(formData, 'gender');
    const pet_name = getFormString(formData, 'pet_name');
    const owner_name = getFormString(formData, 'owner_name');
    const location = getFormString(formData, 'location');
    const emergency_note = getFormString(formData, 'emergency_note');
    const currentParsedUserId = parseUserId(current_user_id);
    const parsedUserId = parseUserId(user_id);
    const parsedGender = parseGender(gender);
    const parsedBirthYear = parseBirthYear(getFormString(formData, 'birth_year'));

    validateTextLength(parsedUserId, MAX_USER_ID_LENGTH, '고객 ID');
    validateTextLength(pet_name, MAX_PET_NAME_LENGTH, '반려견 이름');
    validateTextLength(owner_name, MAX_OWNER_NAME_LENGTH, '보호자 이름');
    validateTextLength(location, MAX_LOCATION_LENGTH, '활동 지역');
    validateTextLength(emergency_note, MAX_EMERGENCY_NOTE_LENGTH, '특이사항');

    if (!currentParsedUserId || !parsedUserId || !plainPassword) {
      return NextResponse.json(
        { error: '고객 ID와 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 먼저 현재 사용자 인증을 통과해야 다른 값 수정이 가능합니다.
    const { data: pet, error: petError } = await supabaseAdmin
      .from('pets')
      .select('id, password_hash, image_url, registration_code')
      .eq('user_id', currentParsedUserId)
      .single();

    const passwordHash = pet ? hashPetPassword(plainPassword, pet.registration_code) : '';

    if (petError || !pet || pet.password_hash !== passwordHash) {
      return NextResponse.json(
        { error: '고객 ID 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 수정 시에도 고객 ID가 다른 반려견과 충돌하면 안 되므로 다시 검사합니다.
    const { data: duplicatedUserId, error: duplicatedUserIdError } = await supabaseAdmin
      .from('pets')
      .select('id')
      .eq('user_id', parsedUserId)
      .neq('id', pet.id)
      .maybeSingle();

    if (duplicatedUserIdError) {
      return NextResponse.json(
        { error: duplicatedUserIdError.message },
        { status: 500 }
      );
    }

    if (duplicatedUserId) {
      return NextResponse.json(
        { error: '이미 사용 중인 고객 ID예요. 다른 ID를 입력해주세요.' },
        { status: 409 }
      );
    }

    let imageUrl = pet.image_url || '';

    // oldImagePath:
    // 새 사진 업로드가 성공했을 때만 이전 파일을 지우기 위해 기억해두는 값입니다.
    let oldImagePath: string | null = null;

    // 새 이미지가 들어온 경우에만 업로드하고, 아니면 기존 URL을 유지합니다.
    if (imageFile instanceof File && imageFile.size > 0) {
      oldImagePath = getPetImagePathFromPublicUrl(pet.image_url || '');
      const imagePath = `pet_photos/${pet.id}-${getUploadFileName(imageFile, 'pet-photo')}`;
      imageUrl = await uploadFileToStorage(
        imageFile,
        imagePath,
        imageFile.type || 'image/jpeg'
      );
    }

    // updateData는 실제로 DB에 반영할 필드 묶음입니다.
    const updateData = {
      user_id: parsedUserId,
      pet_name,
      owner_name,
      phone: getFormString(formData, 'phone'),
      emergency_phone: getFormString(formData, 'emergency_phone'),
      gender: parsedGender,
      birth_year: parsedBirthYear,
      animal_registration_number: getFormString(formData, 'animal_registration_number'),
      emergency_note,
      image_url: imageUrl,
      location,
    };

    const { error: updateError } = await supabaseAdmin
      .from('pets')
      .update(updateData)
      .eq('id', pet.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // 수정이 성공한 뒤에만 예전 사진 정리를 시도합니다.
    if (oldImagePath) {
      const newImagePath = getPetImagePathFromPublicUrl(imageUrl);

      if (newImagePath && oldImagePath !== newImagePath) {
        await removeStorageFile(oldImagePath);
      }
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    return NextResponse.json({
      ok: true,
      id: pet.id,
      url: `${baseUrl}/pet/${pet.id}`,
      image_url: imageUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '서버 오류' },
      { status: 500 }
    );
  }
}
