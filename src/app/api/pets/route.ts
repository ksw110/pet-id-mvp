import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { pet_name, owner_name, phone, emergency_note } = body;

    if (!pet_name || !phone) {
      return NextResponse.json(
        { error: '필수값 없음' },
        { status: 400 }
      );
    }

    const id = generateId();

    // 🔥 DB 저장
    const { error } = await supabase.from('pets').insert({
      id,
      pet_name,
      owner_name,
      phone,
      emergency_note,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const url = `${baseUrl}/pet/${id}`;

    return NextResponse.json({ id, url });
  } catch (e) {
    return NextResponse.json(
      { error: '서버 오류' },
      { status: 500 }
    );
  }
}