'use client';

import { useState } from 'react';
import Image from 'next/image';
import PrivacyPolicyContent from '../privacy/PrivacyPolicyContent';

const MAX_IMAGE_SIZE = 1200;
const IMAGE_QUALITY = 0.82;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

async function compressImage(file: File) {
  const imageUrl = URL.createObjectURL(file);
  const image = document.createElement('img');

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'));
      image.src = imageUrl;
    });

    const scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.round(image.naturalWidth * scale);
    const height = Math.round(image.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      return file;
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', IMAGE_QUALITY);
    });

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const fileName = file.name.replace(/\.[^.]+$/, '') || 'pet-photo';
    return new File([blob], `${fileName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

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

async function readJsonResponse(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    registration_code: '',
    password: '',
    pet_name: '',
    owner_name: '',
    phone: '',
    emergency_phone: '',
    animal_registration_number: '',
    emergency_note: '',
    location: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [qrImage, setQrImage] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const selectedFileName = imageFile?.name ?? '';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSubmitMessage('');

    try {
      const registrationCode = form.registration_code.trim().toUpperCase();

      if (!registrationCode || !form.password) {
        alert('등록코드와 비밀번호를 입력해주세요.');
        return;
      }

      if (form.password.length < 6) {
        alert('비밀번호는 6자 이상 입력해주세요.');
        return;
      }

      const codeValidationRes = await fetch('/api/registration-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_code: registrationCode }),
      });
      const codeValidationData = await readJsonResponse(codeValidationRes);

      if (!codeValidationRes.ok) {
        const errorMessage = codeValidationData?.error || '등록코드를 확인할 수 없습니다.';
        setSubmitMessage(errorMessage);
        alert(errorMessage);
        return;
      }

      const formData = new FormData();

      Object.entries({
        ...form,
        registration_code: registrationCode,
      }).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (imageFile) {
        formData.append('image_file', imageFile);
      }

      // 📡 API 호출
      const res = await fetch('/api/pets', {
        method: 'POST',
        body: formData,
      });

      const data = await readJsonResponse(res);

      if (!res.ok) {
        const errorMessage = data?.error || '등록 실패';
        setSubmitMessage(errorMessage);
        alert(errorMessage);
        return;
      }

      if (!data?.url) {
        throw new Error('QR 생성 결과를 불러오지 못했어요.');
      }

      setQrImage(data.qr_image_url || '');
      setResultUrl(data.url);
      setSubmitMessage('QR 코드가 생성됐어요.');
      window.setTimeout(() => {
        document.getElementById('qr-result')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '등록 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.';
      setSubmitMessage(errorMessage);
      alert(errorMessage);
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
            <div className="rounded-2xl border border-[#eee8dc] bg-[#fffdf8] p-4">
              <p className="mb-4 text-sm font-black text-[#d69b14]">등록 인증</p>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold">등록코드 <span className="text-[#ee6958]">*</span></span>
                  <input
                    placeholder="예) PET-ABCD1234"
                    className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm uppercase outline-none transition placeholder:normal-case placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                    value={form.registration_code}
                    onChange={(e) =>
                      setForm({ ...form, registration_code: e.target.value.toUpperCase() })
                    }
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold">비밀번호 <span className="text-[#ee6958]">*</span></span>
                  <input
                    type="password"
                    placeholder="추후 정보 수정 시 사용할 비밀번호"
                    className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    minLength={6}
                    required
                  />
                  <span className="mt-2 block text-xs leading-5 text-[#8b8378]">
                    등록코드와 비밀번호는 추후 정보 수정에 사용됩니다.
                  </span>
                </label>
              </div>
            </div>

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
                placeholder="예) 홍길동"
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
                  setForm({ ...form, phone: formatPhoneNumber(e.target.value) })
                }
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">비상연락망 <span className="font-medium text-[#8b8378]">(선택)</span></span>
              <input
                placeholder="예) 010-9876-5432"
                className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                value={form.emergency_phone}
                onChange={(e) =>
                  setForm({ ...form, emergency_phone: formatPhoneNumber(e.target.value) })
                }
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">동물등록번호 <span className="font-medium text-[#8b8378]">(선택)</span></span>
              <input
                placeholder="예) 410000000000000"
                className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                value={form.animal_registration_number}
                onChange={(e) =>
                  setForm({ ...form, animal_registration_number: e.target.value })
                }
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">활동 지역 <span className="font-medium text-[#8b8378]">(선택)</span></span>
              <input
                placeholder="예) 서울 강남구, 압구정동"
                className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
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
                <span className="text-sm font-bold">
                  {compressing ? '사진 최적화 중...' : selectedFileName || '사진 선택하기'}
                </span>
                <span className="mt-1 text-xs text-[#8b8378]">자동 압축 후 업로드됩니다</span>
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];

                  if (!file) {
                    return;
                  }

                  setCompressing(true);

                  try {
                    const compressedFile = await compressImage(file);

                    if (compressedFile.size > MAX_UPLOAD_BYTES) {
                      alert(
                        `사진 용량이 너무 커요. 현재 ${formatFileSize(compressedFile.size)}라서 4MB 이하 사진으로 다시 선택해주세요.`
                      );
                      e.target.value = '';
                      setImageFile(null);
                      return;
                    }

                    setImageFile(compressedFile);
                  } catch {
                    alert('사진 최적화에 실패했어요. 다른 사진으로 다시 시도해주세요.');
                    e.target.value = '';
                    setImageFile(null);
                  } finally {
                    setCompressing(false);
                  }
                }}
                required
              />
            </label>

            <div className="rounded-2xl border border-[#eee8dc] bg-[#fffdf8] p-4">
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={privacyAgreed}
                    onChange={(e) => setPrivacyAgreed(e.target.checked)}
                    required
                    className="mt-1 h-5 w-5 rounded border-[#d9d2c7] accent-[#35ad49]"
                  />
                  <span className="text-sm font-black leading-6">
                    [필수] 개인정보 수집·이용에 동의합니다.
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setPrivacyModalOpen(true)}
                  className="shrink-0 text-xs font-black text-[#2f9d46] underline underline-offset-4"
                >
                  자세히 보기
                </button>
              </div>

              <p className="mt-3 text-xs leading-6 text-[#5f574c]">
                QR코드를 스캔할 경우 등록된 반려견 정보와 보호자 연락처가 제3자에게 공개될 수 있습니다.
              </p>
            </div>

            <button
              disabled={loading || compressing || !privacyAgreed}
              className="mt-3 h-13 w-full rounded-xl bg-[#ffd766] px-5 text-sm font-black text-[#211a0c] shadow-[0_10px_24px_rgba(229,173,36,0.28)] transition hover:bg-[#ffcc3d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '생성 중...' : 'QR 코드 생성하기  🐾'}
            </button>
          </form>

          {submitMessage && (
            <p className="mt-5 break-keep rounded-xl bg-[#f7f3ec] px-4 py-3 text-sm font-bold text-[#6f6657]">
              {submitMessage}
            </p>
          )}

          {resultUrl && (
            <div id="qr-result" className="mt-7 rounded-2xl border border-[#eee8dc] bg-[#fffdf8] p-5 text-center">
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

      {privacyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
          className="fixed inset-0 z-50 flex items-end bg-black/45 px-3 py-4 sm:items-center sm:px-6"
        >
          <div className="mx-auto flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <header className="flex items-center justify-between border-b border-[#f0ece4] px-5 py-4">
              <h2 id="privacy-modal-title" className="text-lg font-black">
                개인정보 처리방침
              </h2>
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-[#f7f3ec] text-lg font-black"
                aria-label="개인정보 처리방침 닫기"
              >
                ×
              </button>
            </header>

            <div className="overflow-y-auto px-5 py-5">
              <PrivacyPolicyContent />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
