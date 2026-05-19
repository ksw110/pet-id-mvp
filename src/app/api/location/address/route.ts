import { NextResponse } from 'next/server';

// 이 API는 위도/경도를 받아 사람이 읽을 수 있는 주소 문자열로 바꿔줍니다.
// 외부 카카오 API를 감싼 "중간 서버" 역할이라고 생각하면 이해하기 쉽습니다.
type KakaoAddressDocument = {
  address?: {
    address_name?: string;
  } | null;
  road_address?: {
    address_name?: string;
  } | null;
};

type KakaoAddressResponse = {
  documents?: KakaoAddressDocument[];
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const latitude = searchParams.get('lat');
  const longitude = searchParams.get('lng');
  const kakaoRestApiKey = process.env.KAKAO_REST_API_KEY;

  if (!latitude || !longitude) {
    return NextResponse.json(
      { error: '좌표 정보가 필요합니다.' },
      { status: 400 }
    );
  }

  if (!kakaoRestApiKey) {
    return NextResponse.json(
      { error: 'Kakao REST API 키가 설정되어 있지 않습니다.' },
      { status: 500 }
    );
  }

  const kakaoUrl = new URL('https://dapi.kakao.com/v2/local/geo/coord2address.json');
  kakaoUrl.searchParams.set('x', longitude);
  kakaoUrl.searchParams.set('y', latitude);

  const kakaoRes = await fetch(kakaoUrl, {
    headers: {
      Authorization: `KakaoAK ${kakaoRestApiKey}`,
    },
  });

  if (!kakaoRes.ok) {
    return NextResponse.json(
      { error: '주소 변환에 실패했습니다.' },
      { status: kakaoRes.status }
    );
  }

  // road_address가 있으면 도로명 주소를 우선 사용하고,
  // 없으면 일반 지번 주소로 fallback합니다.
  const data = (await kakaoRes.json()) as KakaoAddressResponse;
  const address = data.documents?.[0]?.road_address?.address_name
    || data.documents?.[0]?.address?.address_name
    || '';

  return NextResponse.json({ address });
}
