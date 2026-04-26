'use client';

import { useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const [form, setForm] = useState({
    pet_name: '',
    owner_name: '',
    phone: '',
    emergency_note: '',
    location: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [qrImage, setQrImage] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const selectedFileName = imageFile?.name ?? '';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';

      // 📸 이미지 업로드
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;

        const { error } = await supabase.storage
          .from('pet-images')
          .upload(fileName, imageFile);

        if (error) {
          alert('이미지 업로드 실패');
          return;
        }

        const { data } = supabase.storage
          .from('pet-images')
          .getPublicUrl(fileName);

        imageUrl = data.publicUrl;
      }

      // 📡 API 호출
      const res = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          image_url: imageUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '등록 실패');
        return;
      }

      // 🔥 QR 생성
      const qr = await QRCode.toDataURL(data.url, {
        width: 800,
        errorCorrectionLevel: 'H',
      });

      setQrImage(qr);
      setResultUrl(data.url);

    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-5 text-[#171717] sm:px-6 sm:py-10">
      <section className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#ece7dd] bg-white shadow-[0_24px_70px_rgba(55,45,30,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden min-h-[720px] flex-col justify-between border-r border-[#f0ece4] bg-[linear-gradient(160deg,#fffaf0_0%,#ffffff_48%,#fff4cf_100%)] p-10 lg:flex">
          <header className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 font-bold">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#fff0ba] text-lg">🐾</span>
              Pet ID
            </div>
            <span className="text-xs font-medium text-[#6f6657]">QR로 연결되는 우리 아이의 정보</span>
          </header>

          <div className="max-w-sm">
            <p className="mb-4 text-sm font-bold text-[#d69b14]">반려견 정보 등록</p>
            <h1 className="text-[42px] font-black leading-[1.15] tracking-normal">
              반려견 정보를
              <br />
              등록해주세요 <span className="text-[#f5c548]">♥</span>
            </h1>
            <p className="mt-6 text-[15px] leading-7 text-[#60594e]">
              QR 코드를 통해 누구나 쉽게 우리 아이의 보호자에게 연락할 수 있어요.
            </p>
          </div>

          <div className="relative mx-auto mb-2 grid h-[330px] w-[330px] place-items-center rounded-full bg-[#fff2c7]">
            <div className="absolute -left-4 top-10 text-3xl text-[#f5c548]">♥</div>
            <div className="absolute -right-5 bottom-16 text-4xl text-[#f5c548]">♥</div>
            <div className="grid h-[260px] w-[260px] place-items-center rounded-full bg-white shadow-[0_18px_45px_rgba(201,151,41,0.2)]">
              <span className="text-[136px] leading-none">🐶</span>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8 lg:p-10">
          <header className="mb-8 flex items-center justify-between border-b border-[#f0ece4] pb-5 lg:hidden">
            <div className="flex items-center gap-2 font-bold">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#fff0ba] text-lg">🐾</span>
              Pet ID
            </div>
            <span className="text-xl">☰</span>
          </header>

          <div className="mb-7 lg:hidden">
            <h1 className="text-3xl font-black leading-tight">
              반려견 정보를
              <br />
              등록해주세요 <span className="text-[#f5c548]">♥</span>
            </h1>
            <p className="mt-4 text-sm leading-6 text-[#6f6657]">
              QR 코드를 통해 누구나 쉽게 우리 아이의 보호자에게 연락할 수 있어요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">반려견 이름 <span className="text-[#ee6958]">*</span></span>
              <input
                placeholder="예) 코코"
                className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                value={form.pet_name}
                onChange={(e) =>
                  setForm({ ...form, pet_name: e.target.value })
                }
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">보호자 이름 <span className="text-[#ee6958]">*</span></span>
              <input
                placeholder="예) 김시우"
                className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                value={form.owner_name}
                onChange={(e) =>
                  setForm({ ...form, owner_name: e.target.value })
                }
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">연락처 <span className="text-[#ee6958]">*</span></span>
              <input
                placeholder="예) 010-1234-5678"
                className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">활동 지역 <span className="text-[#ee6958]">*</span></span>
              <input
                placeholder="예) 서울 강남구, 압구정동"
                className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">특이사항 <span className="font-medium text-[#8b8378]">(선택)</span></span>
              <textarea
                placeholder="예) 사람을 좋아해요. 겁이 많아요 등"
                className="min-h-24 w-full resize-none rounded-xl border border-[#e7e2da] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                value={form.emergency_note}
                onChange={(e) =>
                  setForm({ ...form, emergency_note: e.target.value })
                }
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">사진 등록 <span className="text-[#ee6958]">*</span></span>
              <span className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#d9d2c7] bg-[#fffdf8] px-4 py-5 text-center transition hover:border-[#f2bd33] hover:bg-[#fff8e5]">
                <span className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-white text-xl shadow-sm">📷</span>
                <span className="text-sm font-bold">{selectedFileName || '사진 선택하기'}</span>
                <span className="mt-1 text-xs text-[#8b8378]">최대 5MB, JPG/PNG 권장</span>
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setImageFile(e.target.files[0]);
                  }
                }}
                required
              />
            </label>

            <button
              disabled={loading}
              className="mt-3 h-13 w-full rounded-xl bg-[#ffd766] px-5 text-sm font-black text-[#211a0c] shadow-[0_10px_24px_rgba(229,173,36,0.28)] transition hover:bg-[#ffcc3d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '생성 중...' : 'QR 코드 생성하기  🐾'}
            </button>
          </form>

          {resultUrl && (
            <div className="mt-7 rounded-2xl border border-[#eee8dc] bg-[#fffdf8] p-5 text-center">
              <p className="text-xs font-bold text-[#8b8378]">생성된 Pet ID 링크</p>
              <p className="mt-2 break-all text-sm text-[#4f493f]">{resultUrl}</p>

              <Image
                src={qrImage}
                alt="생성된 반려견 QR 코드"
                width={160}
                height={160}
                unoptimized
                className="mx-auto mt-4 rounded-xl bg-white p-2 shadow-sm"
              />

              <a
                href={qrImage}
                download={`pet-${form.phone}.png`}
                className="mt-4 block rounded-xl bg-[#171717] p-3 text-sm font-bold text-white"
              >
                QR 다운로드
              </a>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
