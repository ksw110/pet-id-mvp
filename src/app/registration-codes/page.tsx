'use client';

import { useState } from 'react';

// 등록코드 생성과 임시 비밀번호 발급을 각각 폼으로 분리한 관리자 페이지입니다.
type CreatedCode = {
  code: string;
  created_at: string;
};

export default function RegistrationCodesPage() {
  // adminPassword / adminUnlocked:
  // 이 페이지도 관리자 인증을 먼저 통과해야 실제 기능을 볼 수 있습니다.
  const [adminPassword, setAdminPassword] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  // customCode:
  // 관리자가 직접 원하는 등록코드를 입력하고 싶을 때 사용하는 값입니다.
  const [customCode, setCustomCode] = useState('');

  // resetCode:
  // 임시 비밀번호 발급 시 기준이 되는 등록코드입니다.
  const [resetCode, setResetCode] = useState('');

  // temporaryPassword:
  // 서버가 새로 만들어준 임시 비밀번호를 보여주기 위한 상태입니다.
  const [temporaryPassword, setTemporaryPassword] = useState('');

  // createdCodes:
  // 이 화면에서 방금 생성한 등록코드를 바로 리스트로 보여주기 위한 상태입니다.
  const [createdCodes, setCreatedCodes] = useState<CreatedCode[]>([]);
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

      // 새 코드를 목록 맨 앞에 추가하면 방금 만든 결과를 즉시 확인할 수 있습니다.
      setCreatedCodes((prev) => [data, ...prev]);
      setCustomCode('');
    } catch {
      setError('등록코드 생성 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  }

  async function copyCode(code: string) {
    // 최신 브라우저에서는 clipboard API로 텍스트를 쉽게 복사할 수 있습니다.
    await navigator.clipboard.writeText(code);
    alert('등록코드를 복사했어요.');
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    // 등록코드를 알고 있는 관리자만 임시 비밀번호를 발급하도록 만든 흐름입니다.
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

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-6 text-[#171717] sm:px-6 sm:py-10">
      <section className="mx-auto w-full max-w-2xl overflow-hidden rounded-[28px] border border-[#ece7dd] bg-white p-5 shadow-[0_24px_70px_rgba(55,45,30,0.12)] sm:p-8">
        <header className="mb-8 border-b border-[#f0ece4] pb-5">
          <div className="mb-8 flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#fff0ba] text-lg">🐾</span>
            meonggrey
          </div>

          <p className="mb-3 text-sm font-bold text-[#d69b14]">Registration Codes</p>
          <h1 className="text-3xl font-black leading-tight sm:text-4xl">
            등록코드 생성
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#6f6657]">
            고객에게 전달할 1회용 등록코드를 생성합니다. 등록코드 하나는 QR 하나에만 사용할 수 있어요.
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
          <div className="space-y-7">
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
          </div>
        )}

        {error && (
          <p className="mt-5 rounded-xl bg-[#fff0ee] px-4 py-3 text-sm font-bold text-[#c34838]">
            {error}
          </p>
        )}

        {createdCodes.length > 0 && (
          <div className="mt-7 space-y-3">
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
                  onClick={() => copyCode(item.code)}
                  className="rounded-xl bg-[#171717] px-4 py-2 text-xs font-black text-white"
                >
                  복사
                </button>
              </article>
            ))}
          </div>
        )}

        {temporaryPassword && (
          <div className="mt-7 rounded-2xl border border-[#cfe8d3] bg-[#f3fbf4] p-5">
            <p className="text-sm font-black text-[#24963a]">임시 비밀번호</p>
            <p className="mt-3 break-all rounded-xl bg-white px-4 py-3 font-black tracking-wide">
              {temporaryPassword}
            </p>
            <button
              type="button"
              onClick={() => copyCode(temporaryPassword)}
              className="mt-3 w-full rounded-xl bg-[#24963a] px-4 py-3 text-sm font-black text-white"
            >
              임시 비밀번호 복사
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
