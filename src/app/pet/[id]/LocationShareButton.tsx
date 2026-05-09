'use client';

import { useState } from 'react';

type LocationShareButtonProps = {
  petName: string;
  phone: string;
};

export default function LocationShareButton({ petName, phone }: LocationShareButtonProps) {
  const [loading, setLoading] = useState(false);

  async function getAddress(latitude: number, longitude: number) {
    try {
      const res = await fetch(`/api/location/address?lat=${latitude}&lng=${longitude}`);

      if (!res.ok) {
        return '';
      }

      const data = await res.json();
      return typeof data.address === 'string' ? data.address : '';
    } catch {
      return '';
    }
  }

  function handleShareLocation() {
    if (!navigator.geolocation) {
      alert('현재 브라우저에서는 위치 공유를 지원하지 않아요.');
      return;
    }

    const allowed = window.confirm(
      '현재 위치를 주소로 변환하고 보호자에게 문자로 보내기 위해 위치 권한을 요청합니다. 좌표는 주소 변환을 위해 카카오 API로 전송될 수 있어요. 계속할까요?'
    );

    if (!allowed) {
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await getAddress(latitude, longitude);
        const mapUrl = address
          ? `https://map.kakao.com/link/map/${encodeURIComponent(address)},${latitude},${longitude}`
          : `https://map.kakao.com/link/map/${latitude},${longitude}`;
        const locationText = address ? `현재 위치: ${address}\n` : '';
        const message = `${petName}를 발견했어요.\n${locationText}카카오맵에서 위치를 확인해주세요: ${mapUrl}`;

        window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
        setLoading(false);
      },
      () => {
        alert('현재 위치를 가져오지 못했어요. 위치 권한을 확인해주세요.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  }

  return (
    <button
      type="button"
      onClick={handleShareLocation}
      disabled={loading}
      className="mt-3 flex h-14 w-full items-center justify-center rounded-xl border border-[#cfe8d3] bg-white px-5 text-center text-base font-black text-[#24963a] shadow-sm transition hover:bg-[#f3fbf4] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? '현재 위치 확인 중...' : '⌖ 현재 위치 보내기'}
    </button>
  );
}
