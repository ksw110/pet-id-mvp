import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      pet_name,
      owner_name,
      phone,
      emergency_phone,
      animal_registration_number,
      emergency_note,
      image_url,
      location,
    } = body;

    if (!pet_name || !phone) {
      return NextResponse.json(
        { error: '필수값 없음' },
        { status: 400 }
      );
    }

    const id = nanoid(8);
    const qrFileName = `qr_code/${id}.png`;
    const { data: qrPublicUrlData } = supabase.storage
      .from('pet-images')
      .getPublicUrl(qrFileName);

    const { error } = await supabase.from('pets').insert({
      id,
      pet_name,
      owner_name,
      phone,
      emergency_phone,
      animal_registration_number,
      emergency_note,
      image_url,
      qr_image_url: qrPublicUrlData.publicUrl,
      location,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const url = `${baseUrl}/pet/${id}`;

    return NextResponse.json({
      id,
      url,
      qr_image_url: qrPublicUrlData.publicUrl,
      qr_file_name: qrFileName,
    });
  } catch {
    return NextResponse.json(
      { error: '서버 오류' },
      { status: 500 }
    );
  }
}
