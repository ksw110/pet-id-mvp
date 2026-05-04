import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { nanoid } from 'nanoid';
import { hashPetPassword } from '@/lib/pet-password';
import QRCode from 'qrcode';
import { Buffer } from 'node:buffer';

function getFormString(formData: FormData, name: string) {
  return String(formData.get(name) || '').trim();
}

function getUploadFileName(file: File, fallbackName: string) {
  const extension = file.type === 'image/png' ? 'png' : 'jpg';
  const safeBaseName = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40) || fallbackName;

  return `${Date.now()}-${safeBaseName}.${extension}`;
}

async function uploadFileToStorage(
  file: File,
  path: string,
  contentType: string
) {
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

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const formData = await req.formData();
    const pet_name = getFormString(formData, 'pet_name');
    const owner_name = getFormString(formData, 'owner_name');
    const phone = getFormString(formData, 'phone');
    const emergency_phone = getFormString(formData, 'emergency_phone');
    const animal_registration_number = getFormString(formData, 'animal_registration_number');
    const emergency_note = getFormString(formData, 'emergency_note');
    const location = getFormString(formData, 'location');
    const code = getFormString(formData, 'registration_code').toUpperCase();
    const plainPassword = getFormString(formData, 'password');
    const imageFile = formData.get('image_file');

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

    const { data: registrationCodeData, error: registrationCodeError } = await supabaseAdmin
      .from('registration_codes')
      .select('code, pet_id')
      .eq('code', code)
      .single();

    if (registrationCodeError || !registrationCodeData) {
      return NextResponse.json(
        { error: '유효하지 않은 등록코드입니다.' },
        { status: 404 }
      );
    }

    if (registrationCodeData.pet_id) {
      return NextResponse.json(
        { error: '이미 사용된 등록코드입니다.' },
        { status: 409 }
      );
    }

    const id = nanoid(8);
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/pet/${id}`;
    const passwordHash = hashPetPassword(plainPassword, code);
    let imageUrl = '';

    if (imageFile instanceof File && imageFile.size > 0) {
      const imagePath = `pet_photos/${id}-${getUploadFileName(imageFile, 'pet-photo')}`;
      imageUrl = await uploadFileToStorage(
        imageFile,
        imagePath,
        imageFile.type || 'image/jpeg'
      );
    }

    const qrPath = `qr_code/${id}.png`;
    const qrBuffer = await QRCode.toBuffer(url, {
      width: 800,
      errorCorrectionLevel: 'H',
    });
    const qrImageUrl = await uploadBufferToStorage(qrBuffer, qrPath, 'image/png');

    const { error } = await supabaseAdmin.from('pets').insert({
      id,
      registration_code: code,
      password_hash: passwordHash,
      pet_name,
      owner_name,
      phone,
      emergency_phone,
      animal_registration_number,
      emergency_note,
      image_url: imageUrl,
      qr_image_url: qrImageUrl,
      location,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const { error: registrationCodeUpdateError } = await supabaseAdmin
      .from('registration_codes')
      .update({
        pet_id: id,
        used_at: new Date().toISOString(),
      })
      .eq('code', code)
      .is('pet_id', null);

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
    const code = getFormString(formData, 'registration_code').toUpperCase();
    const plainPassword = getFormString(formData, 'password');
    const imageFile = formData.get('image_file');

    if (!code || !plainPassword) {
      return NextResponse.json(
        { error: '등록코드와 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    const passwordHash = hashPetPassword(plainPassword, code);

    const { data: pet, error: petError } = await supabaseAdmin
      .from('pets')
      .select('id, password_hash, image_url')
      .eq('registration_code', code)
      .single();

    if (petError || !pet || pet.password_hash !== passwordHash) {
      return NextResponse.json(
        { error: '등록코드 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    let imageUrl = pet.image_url || '';

    if (imageFile instanceof File && imageFile.size > 0) {
      const imagePath = `pet_photos/${pet.id}-${getUploadFileName(imageFile, 'pet-photo')}`;
      imageUrl = await uploadFileToStorage(
        imageFile,
        imagePath,
        imageFile.type || 'image/jpeg'
      );
    }

    const updateData = {
      pet_name: getFormString(formData, 'pet_name'),
      owner_name: getFormString(formData, 'owner_name'),
      phone: getFormString(formData, 'phone'),
      emergency_phone: getFormString(formData, 'emergency_phone'),
      animal_registration_number: getFormString(formData, 'animal_registration_number'),
      emergency_note: getFormString(formData, 'emergency_note'),
      image_url: imageUrl,
      location: getFormString(formData, 'location'),
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
