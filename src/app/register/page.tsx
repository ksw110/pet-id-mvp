'use client';

import { useState } from 'react';
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setQrImage('');
    setResultUrl('');

    try {
      let imageUrl = '';

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('pet-images')
          .upload(fileName, imageFile);

        if (uploadError) {
          alert(uploadError.message);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('pet-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

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
    } finally {
      setLoading(false);
    }
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
            onChange={(e) => setForm({ ...form, pet_name: e.target.value })}
            required
          />

          <input
            placeholder="보호자 이름"
            className="w-full rounded border p-3"
            value={form.owner_name}
            onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
          />

          <input
            placeholder="연락처"
            className="w-full rounded border p-3"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />

          <input
            placeholder="활동지역 예: 광주 북구 첨단동"
            className="w-full rounded border p-3"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />

          <textarea
            placeholder="특이사항"
            className="w-full rounded border p-3"
            value={form.emergency_note}
            onChange={(e) =>
              setForm({ ...form, emergency_note: e.target.value })
            }
          />

          <input
            type="file"
            accept="image/*"
            className="w-full rounded border p-3"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setImageFile(e.target.files[0]);
              }
            }}
          />

          <button
            disabled={loading}
            className="w-full rounded bg-black p-3 text-white disabled:opacity-50"
          >
            {loading ? '등록 중...' : '등록하기'}
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