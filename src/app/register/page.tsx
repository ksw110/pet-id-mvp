'use client';

import { useState } from 'react';
import QRCode from 'qrcode';

export default function RegisterPage() {
  const [form, setForm] = useState({
    pet_name: '',
    owner_name: '',
    phone: '',
    emergency_note: '',
  });

  const [qrImage, setQrImage] = useState('');
  const [resultUrl, setResultUrl] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const res = await fetch('/api/pets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || '등록 실패');
      return;
    }

    const qr = await QRCode.toDataURL(data.url, {
      width: 800,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    setResultUrl(data.url);
    setQrImage(qr);
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-6 text-3xl font-bold">반려견 정보 등록</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="강아지 이름"
            className="w-full rounded border p-3"
            value={form.pet_name}
            onChange={(e) =>
              setForm({ ...form, pet_name: e.target.value })
            }
          />

          <input
            placeholder="보호자 이름"
            className="w-full rounded border p-3"
            value={form.owner_name}
            onChange={(e) =>
              setForm({ ...form, owner_name: e.target.value })
            }
          />

          <input
            placeholder="연락처"
            className="w-full rounded border p-3"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          <textarea
            placeholder="특이사항"
            className="w-full rounded border p-3"
            value={form.emergency_note}
            onChange={(e) =>
              setForm({ ...form, emergency_note: e.target.value })
            }
          />

          <button className="w-full rounded bg-black p-3 text-white">
            등록하기
          </button>
        </form>

        {resultUrl && (
          <div className="mt-6 space-y-4 border bg-green-100 p-4">
            <p>생성된 URL:</p>
            <p className="break-all">{resultUrl}</p>

            {qrImage && (
              <>
                <img src={qrImage} alt="QR Code" className="mx-auto w-48" />

                <a
                  href={qrImage}
                  download={`pet-${form.phone.replace(/[^0-9]/g, '')}.png`}
                  className="block rounded bg-black p-2 text-center text-white"
                >
                  QR 다운로드
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}