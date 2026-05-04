'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function HomePage() {
  const [lookupCode, setLookupCode] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');
  const [lookupResult, setLookupResult] = useState<{
    pet_name: string;
    url: string;
  } | null>(null);

  async function handleLookup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLookupLoading(true);
    setLookupMessage('');
    setLookupResult(null);

    try {
      const res = await fetch('/api/pets/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_code: lookupCode.trim().toUpperCase(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLookupMessage(data.error || 'URL을 찾을 수 없습니다.');
        return;
      }

      setLookupResult(data);
      setLookupMessage('등록된 URL을 찾았어요.');
    } catch {
      setLookupMessage('URL 조회 중 오류가 발생했어요.');
    } finally {
      setLookupLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-5 text-[#171717] sm:px-6 sm:py-10">
      <section className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#ece7dd] bg-white shadow-[0_24px_70px_rgba(55,45,30,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex min-h-[620px] flex-col justify-between bg-[linear-gradient(160deg,#fffaf0_0%,#ffffff_48%,#fff4cf_100%)] p-5 sm:p-8 lg:p-10">
          <header className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 font-bold">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#fff0ba] text-lg">🐾</span>
              Pet ID
            </div>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-[#6f6657] shadow-sm">
              QR 반려견 인식표
            </span>
          </header>

          <div className="py-12 sm:py-16 lg:max-w-lg">
            <p className="mb-4 text-sm font-black text-[#d69b14]">반려견 보호 정보 관리</p>
            <h1 className="text-4xl font-black leading-[1.15] tracking-normal sm:text-5xl">
              잃어버렸을 때
              <br />
              바로 연결되는
              <br />
              따뜻한 인식표 <span className="text-[#f5c548]">♥</span>
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-7 text-[#60594e]">
              등록코드로 반려견 정보를 등록하고, QR 스캔 시 보호자 연락처와 필요한 정보를 바로 확인할 수 있어요.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-13 items-center justify-center rounded-xl bg-[#ffd766] px-6 text-sm font-black text-[#211a0c] shadow-[0_10px_24px_rgba(229,173,36,0.28)] transition hover:bg-[#ffcc3d]"
              >
                정보 등록하기
              </Link>
              <Link
                href="/edit"
                className="inline-flex h-13 items-center justify-center rounded-xl border border-[#e7e2da] bg-white px-6 text-sm font-black text-[#211a0c] shadow-[0_10px_24px_rgba(55,45,30,0.08)] transition hover:border-[#d9d2c7] hover:bg-[#fffdf8]"
              >
                정보 수정하기
              </Link>
            </div>

            <form
              onSubmit={handleLookup}
              className="mt-8 rounded-[24px] border border-[#eee8dc] bg-white/90 p-5 shadow-[0_14px_36px_rgba(55,45,30,0.1)] sm:p-6"
            >
              <div className="mb-4">
                <p className="text-sm font-black text-[#d69b14]">URL 조회</p>
                <h2 className="mt-2 text-xl font-black">등록번호로 공개 URL 찾기</h2>
              </div>

              <div className="flex flex-col gap-3">
                <input
                  placeholder="예) PET-ABCD1234"
                  className="h-13 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm uppercase outline-none transition placeholder:normal-case placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                  value={lookupCode}
                  onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                  required
                />
                <button
                  disabled={lookupLoading}
                  className="h-13 w-full rounded-xl bg-[#171717] px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {lookupLoading ? '조회 중...' : '조회하기'}
                </button>
              </div>

              {lookupMessage && (
                <p className="mt-3 text-sm font-bold text-[#6f6657]">
                  {lookupMessage}
                </p>
              )}

              {lookupResult && (
                <div className="mt-3 rounded-xl bg-[#fffdf8] p-3">
                  <p className="text-xs font-bold text-[#8b8378]">
                    {lookupResult.pet_name} 공개 URL
                  </p>
                  <a
                    href={lookupResult.url}
                    className="mt-1 block break-all text-sm font-black text-[#2f9d46] underline underline-offset-4"
                  >
                    {lookupResult.url}
                  </a>
                </div>
              )}
            </form>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['01', '등록코드 입력'],
              ['02', '반려견 정보 등록'],
              ['03', 'QR로 보호자 연결'],
            ].map(([step, title]) => (
              <div key={step} className="rounded-2xl border border-[#eee8dc] bg-white/80 p-4">
                <p className="text-xs font-black text-[#d69b14]">{step}</p>
                <p className="mt-2 text-sm font-black">{title}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[560px] items-center justify-center border-t border-[#f0ece4] bg-white p-5 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
          <div className="w-full max-w-sm">
            <div className="overflow-hidden rounded-[28px] border border-[#ece7dd] bg-[#fbfaf7] shadow-[0_22px_55px_rgba(55,45,30,0.14)]">
              <div className="relative h-64 bg-[linear-gradient(145deg,#fff2c7_0%,#fffdf8_100%)]">
                <div className="absolute left-5 top-5 rounded-full bg-white/85 px-3 py-1 text-xs font-black text-[#2ead4b] shadow-sm">
                  보호 정보 활성화
                </div>
                <div className="absolute inset-x-0 bottom-0 mx-auto grid h-52 w-52 place-items-center rounded-t-full bg-white shadow-[0_18px_45px_rgba(201,151,41,0.2)]">
                  <span className="text-[118px] leading-none">🐶</span>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <p className="text-sm font-bold text-[#2ead4b]">이 아이는 보호받고 있어요</p>
                  <h2 className="mt-3 text-3xl font-black">코코 🐾</h2>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-[92px_1fr] gap-3">
                    <span className="font-bold text-[#7b7266]">보호자</span>
                    <span className="font-black">김시우</span>
                  </div>
                  <div className="grid grid-cols-[92px_1fr] gap-3">
                    <span className="font-bold text-[#7b7266]">연락처</span>
                    <span className="font-black text-[#2ead4b]">010-1234-5678</span>
                  </div>
                  <div className="grid grid-cols-[92px_1fr] gap-3">
                    <span className="font-bold text-[#7b7266]">활동 지역</span>
                    <span className="font-black">서울 강남구</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#edf8ef] p-4">
                  <p className="text-sm font-black text-[#2ead4b]">발견했다면 바로 연락해주세요</p>
                  <p className="mt-2 text-xs leading-5 text-[#5f715f]">
                    QR 스캔 후 보호자 연락과 위치 전달을 빠르게 할 수 있어요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
