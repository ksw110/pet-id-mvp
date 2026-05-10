'use client';

import Image from 'next/image';
import { useState } from 'react';

type PetQr = {
  id: string;
  pet_name: string;
  phone: string;
  qr_image_url: string | null;
};

function formatPhoneNumber(value: string) {
  const numbers = value.replace(/\D/g, '').slice(0, 11);

  if (numbers.length <= 3) {
    return numbers;
  }

  if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  }

  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
}

export default function QrCodeLookupPage() {
  const [adminPassword, setAdminPassword] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [phone, setPhone] = useState('');
  const [pets, setPets] = useState<PetQr[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  async function downloadQrImage(url: string, fileName: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = objectUrl;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      alert('QR 다운로드에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  }

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSearched(false);
    setError('');
    setPets([]);

    try {
      const searchParams = new URLSearchParams({
        phone: phone.trim(),
        password: adminPassword,
      });
      const res = await fetch(`/api/pets/qr?${searchParams.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'QR 조회에 실패했어요.');
        return;
      }

      setPets(data.pets ?? []);
      setSearched(true);
    } catch {
      setError('QR 조회 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPets([]);
    setSearched(false);

    if (!adminPassword.trim()) {
      setError('관리자 비밀번호를 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/pets/qr/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '관리자 인증에 실패했어요.');
        return;
      }

      setAdminUnlocked(true);
    } catch {
      setError('관리자 인증 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-6 text-[#171717] sm:px-6 sm:py-10">
      <section className="mx-auto w-full max-w-2xl overflow-hidden rounded-[28px] border border-[#ece7dd] bg-white p-5 shadow-[0_24px_70px_rgba(55,45,30,0.12)] sm:p-8">
        <header className="mb-8 border-b border-[#f0ece4] pb-5">
          <div className="mb-8 flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#fff0ba] text-lg">🐾</span>
            Meong Grey
          </div>

          <p className="mb-3 text-sm font-bold text-[#d69b14]">QR 코드 조회</p>
          <h1 className="text-3xl font-black leading-tight sm:text-4xl">
            연락처로 저장된
            <br />
            QR 코드를 찾아요
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#6f6657]">
            등록할 때 입력한 보호자 연락처를 그대로 입력하면 저장된 QR 이미지를 확인할 수 있어요.
          </p>
        </header>

        {!adminUnlocked ? (
          <form onSubmit={handleUnlock} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">관리자 비밀번호</span>
              <input
                type="password"
                placeholder="관리자 비밀번호 입력"
                className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </label>

            <button
              disabled={loading}
              className="h-13 w-full rounded-xl bg-[#171717] px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '확인 중...' : '관리자 모드 열기'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSearch} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">보호자 연락처</span>
              <input
                placeholder="예) 010-1234-5678"
                className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                required
              />
            </label>

            <button
              disabled={loading}
              className="h-13 w-full rounded-xl bg-[#ffd766] px-5 text-sm font-black text-[#211a0c] shadow-[0_10px_24px_rgba(229,173,36,0.28)] transition hover:bg-[#ffcc3d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '조회 중...' : 'QR 코드 조회하기'}
            </button>
          </form>
        )}

        {error && (
          <p className="mt-5 rounded-xl bg-[#fff0ee] px-4 py-3 text-sm font-bold text-[#c34838]">
            {error}
          </p>
        )}

        {searched && pets.length === 0 && (
          <p className="mt-5 rounded-xl bg-[#f7f3ec] px-4 py-3 text-sm font-bold text-[#6f6657]">
            해당 연락처로 저장된 QR 코드가 없어요.
          </p>
        )}

        {pets.length > 0 && (
          <div className="mt-7 space-y-4">
            {pets.map((pet) => (
              <article
                key={pet.id}
                className="rounded-2xl border border-[#eee8dc] bg-[#fffdf8] p-5 text-center"
              >
                <p className="text-sm font-bold text-[#8b8378]">{pet.pet_name}</p>
                <p className="mt-1 text-xs text-[#8b8378]">{pet.phone}</p>

                {pet.qr_image_url ? (
                  <>
                    <Image
                      src={pet.qr_image_url}
                      alt={`${pet.pet_name} QR 코드`}
                      width={220}
                      height={220}
                      unoptimized
                      className="mx-auto mt-4 rounded-xl bg-white p-3 shadow-sm"
                    />

                    <button
                      type="button"
                      onClick={() => downloadQrImage(pet.qr_image_url!, `pet-${pet.phone}.png`)}
                      className="mt-4 block w-full rounded-xl bg-[#171717] p-3 text-sm font-bold text-white"
                    >
                      QR 다운로드
                    </button>
                  </>
                ) : (
                  <p className="mt-4 rounded-xl bg-[#fff0ee] px-4 py-3 text-sm font-bold text-[#c34838]">
                    저장된 QR 이미지가 없어요. 새로 등록하면 자동 저장됩니다.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
