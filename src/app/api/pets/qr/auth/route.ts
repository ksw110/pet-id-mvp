import { NextResponse } from 'next/server';

// 여러 관리자 화면에서 공통으로 쓰는 "관리자 비밀번호 검증" API입니다.
export async function POST(req: Request) {
  const { password } = await req.json();
  const adminPassword = process.env.QR_ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json(
      { error: '관리자 비밀번호가 올바르지 않습니다.' },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
