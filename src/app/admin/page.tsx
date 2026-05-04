'use client';

import Image from 'next/image';
import { useState } from 'react';

type CreatedCode = {
  code: string;
  created_at: string;
};

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

export default function AdminPage() {
  const [adminPassword, setAdminPassword] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'codes' | 'password' | 'qr'>('codes');
  const [customCode, setCustomCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [pets, setPets] = useState<PetQr[]>([]);
  const [createdCodes, setCreatedCodes] = useState<CreatedCode[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleUnlock(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

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

  async function handleCreateCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/registration-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: adminPassword,
          code: customCode.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '등록코드 생성에 실패했어요.');
        return;
      }

      setCreatedCodes((prev) => [data, ...prev]);
      setCustomCode('');
    } catch {
      setError('등록코드 생성 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTemporaryPassword('');

    try {
      const res = await fetch('/api/pets/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_password: adminPassword,
          registration_code: resetCode.trim().toUpperCase(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '임시 비밀번호 생성에 실패했어요.');
        return;
      }

      setTemporaryPassword(data.temporary_password);
      setResetCode('');
    } catch {
      setError('임시 비밀번호 생성 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearchQr(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPets([]);
    setSearched(false);

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

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    alert('복사했어요.');
  }

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

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-6 text-[#171717] sm:px-6 sm:py-10">
      <section className="mx-auto w-full max-w-4xl overflow-hidden rounded-[28px] border border-[#ece7dd] bg-white p-5 shadow-[0_24px_70px_rgba(55,45,30,0.12)] sm:p-8">
        <header className="mb-8 border-b border-[#f0ece4] pb-5">
          <div className="mb-8 flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#fff0ba] text-lg">🐾</span>
            Pet ID
          </div>

          <p className="mb-3 text-sm font-bold text-[#d69b14]">Admin</p>
          <h1 className="text-3xl font-black leading-tight sm:text-4xl">
            관리자 페이지
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#6f6657]">
            등록코드 생성, 임시 비밀번호 발급, QR 조회를 한 곳에서 관리합니다.
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
          <div>
            <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl bg-[#f7f3ec] p-1">
              {[
                ['codes', '등록코드'],
                ['password', '비밀번호'],
                ['qr', 'QR 조회'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActiveTab(id as typeof activeTab);
                    setError('');
                  }}
                  className={`h-11 rounded-xl text-sm font-black transition ${
                    activeTab === id ? 'bg-white shadow-sm' : 'text-[#6f6657]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'codes' && (
              <div className="space-y-5">
                <form onSubmit={handleCreateCode} className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold">직접 입력할 등록코드 <span className="font-medium text-[#8b8378]">(선택)</span></span>
                    <input
                      placeholder="비워두면 자동 생성됩니다"
                      className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm uppercase outline-none transition placeholder:normal-case placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    />
                  </label>

                  <button
                    disabled={loading}
                    className="h-13 w-full rounded-xl bg-[#ffd766] px-5 text-sm font-black text-[#211a0c] shadow-[0_10px_24px_rgba(229,173,36,0.28)] transition hover:bg-[#ffcc3d] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? '생성 중...' : '등록코드 생성하기'}
                  </button>
                </form>

                {createdCodes.length > 0 && (
                  <div className="space-y-3">
                    {createdCodes.map((item) => (
                      <article
                        key={`${item.code}-${item.created_at}`}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[#eee8dc] bg-[#fffdf8] p-4"
                      >
                        <div>
                          <p className="font-black tracking-wide">{item.code}</p>
                          <p className="mt-1 text-xs text-[#8b8378]">
                            {new Date(item.created_at).toLocaleString('ko-KR')}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => copyText(item.code)}
                          className="rounded-xl bg-[#171717] px-4 py-2 text-xs font-black text-white"
                        >
                          복사
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'password' && (
              <div className="space-y-5">
                <form onSubmit={handleResetPassword} className="space-y-4 rounded-2xl border border-[#eee8dc] bg-[#fffdf8] p-4">
                  <div>
                    <p className="text-sm font-black">임시 비밀번호 재설정</p>
                    <p className="mt-2 text-xs leading-5 text-[#8b8378]">
                      고객이 비밀번호를 잊은 경우 등록코드로 임시 비밀번호를 발급합니다.
                    </p>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold">등록코드</span>
                    <input
                      placeholder="예) PET-ABCD1234"
                      className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm uppercase outline-none transition placeholder:normal-case placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.toUpperCase())}
                      required
                    />
                  </label>

                  <button
                    disabled={loading}
                    className="h-13 w-full rounded-xl bg-[#171717] px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? '발급 중...' : '임시 비밀번호 발급'}
                  </button>
                </form>

                {temporaryPassword && (
                  <div className="rounded-2xl border border-[#cfe8d3] bg-[#f3fbf4] p-5">
                    <p className="text-sm font-black text-[#24963a]">임시 비밀번호</p>
                    <p className="mt-3 break-all rounded-xl bg-white px-4 py-3 font-black tracking-wide">
                      {temporaryPassword}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyText(temporaryPassword)}
                      className="mt-3 w-full rounded-xl bg-[#24963a] px-4 py-3 text-sm font-black text-white"
                    >
                      임시 비밀번호 복사
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'qr' && (
              <div className="space-y-5">
                <form onSubmit={handleSearchQr} className="space-y-4">
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

                {searched && pets.length === 0 && (
                  <p className="rounded-xl bg-[#f7f3ec] px-4 py-3 text-sm font-bold text-[#6f6657]">
                    해당 연락처로 저장된 QR 코드가 없어요.
                  </p>
                )}

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
          </div>
        )}

        {error && (
          <p className="mt-5 rounded-xl bg-[#fff0ee] px-4 py-3 text-sm font-bold text-[#c34838]">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
