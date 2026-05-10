'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PetPhotoPicker from '@/components/PetPhotoPicker';

const MAX_PET_NAME_LENGTH = 20;
const MAX_OWNER_NAME_LENGTH = 20;
const MAX_LOCATION_LENGTH = 50;
const MAX_EMERGENCY_NOTE_LENGTH = 200;
const GENDER_OPTIONS = [
  { value: 'male', label: '남아' },
  { value: 'female', label: '여아' },
] as const;

type PetForm = {
  pet_name: string;
  owner_name: string;
  phone: string;
  emergency_phone: string;
  gender: string;
  birth_year: string;
  animal_registration_number: string;
  emergency_note: string;
  image_url: string;
  location: string;
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

function getCurrentYear() {
  return new Date().getFullYear();
}

function getAgeFromBirthYear(birthYear: string) {
  if (!/^\d{4}$/.test(birthYear)) {
    return '';
  }

  const age = getCurrentYear() - Number(birthYear);
  return age >= 0 ? `${age}살` : '';
}

export default function EditPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    registration_code: '',
    password: '',
  });
  const [form, setForm] = useState<PetForm | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: '',
  });

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/pets/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_code: credentials.registration_code.trim().toUpperCase(),
          password: credentials.password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || '정보를 불러오지 못했어요.');
        return;
      }

      setForm({
        pet_name: data.pet.pet_name || '',
        owner_name: data.pet.owner_name || '',
        phone: data.pet.phone || '',
        emergency_phone: data.pet.emergency_phone || '',
        gender: data.pet.gender || '',
        birth_year: data.pet.birth_year ? String(data.pet.birth_year) : '',
        animal_registration_number: data.pet.animal_registration_number || '',
        emergency_note: data.pet.emergency_note || '',
        image_url: data.pet.image_url || '',
        location: data.pet.location || '',
      });
    } catch {
      setMessage('정보를 불러오는 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();

      Object.entries({
        ...form,
        registration_code: credentials.registration_code.trim().toUpperCase(),
        password: credentials.password,
      }).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (imageFile) {
        formData.append('image_file', imageFile);
      }

      const res = await fetch('/api/pets', {
        method: 'PATCH',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || '수정 저장에 실패했어요.');
        return;
      }

      setForm({ ...form, image_url: data.image_url || form.image_url });
      setImageFile(null);
      alert('수정이 완료됐어요.');
      router.push('/');
    } catch {
      setMessage('수정 저장 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (passwordForm.new_password.length < 6) {
      setMessage('새 비밀번호는 6자 이상 입력해주세요.');
      setLoading(false);
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage('새 비밀번호 확인이 일치하지 않아요.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/pets/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_code: credentials.registration_code.trim().toUpperCase(),
          current_password: credentials.password,
          new_password: passwordForm.new_password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || '비밀번호 변경에 실패했어요.');
        return;
      }

      setCredentials({ ...credentials, password: passwordForm.new_password });
      setPasswordForm({ new_password: '', confirm_password: '' });
      setMessage('비밀번호가 변경됐어요.');
    } catch {
      setMessage('비밀번호 변경 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-6 text-[#171717] sm:px-6 sm:py-10">
      <section className="mx-auto w-full max-w-2xl overflow-hidden rounded-[28px] border border-[#ece7dd] bg-white p-5 shadow-[0_24px_70px_rgba(55,45,30,0.12)] sm:p-8">
        <header className="mb-8 border-b border-[#f0ece4] pb-5">
          <Link href="/" className="mb-8 flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#fff0ba] text-lg">🐾</span>
            Pet ID
          </Link>
          <p className="mb-3 text-sm font-bold text-[#d69b14]">Edit Pet Info</p>
          <h1 className="text-3xl font-black leading-tight sm:text-4xl">반려견 정보 수정</h1>
          <p className="mt-4 text-sm leading-6 text-[#6f6657]">
            등록코드와 비밀번호를 입력하면 등록된 정보를 수정할 수 있어요.<br></br>
            만약 비밀번호를 잊어버렸다면 판매자에게 문의하세요
          </p>
        </header>

        {!form ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">등록코드</span>
              <input
                placeholder="예) PET-ABCD1234"
                className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm uppercase outline-none transition placeholder:normal-case placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                value={credentials.registration_code}
                onChange={(e) =>
                  setCredentials({ ...credentials, registration_code: e.target.value.toUpperCase() })
                }
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">비밀번호</span>
              <input
                type="password"
                placeholder="등록 시 입력한 비밀번호"
                className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                required
              />
            </label>

            <button
              disabled={loading}
              className="h-13 w-full rounded-xl bg-[#171717] px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '확인 중...' : '정보 불러오기'}
            </button>
          </form>
        ) : (
          <div className="space-y-7">
            <form onSubmit={handleSave} className="space-y-4">
              {form.image_url && (
                <div className="overflow-hidden rounded-2xl bg-[#f6f0e8]">
                  <Image
                    src={form.image_url}
                    alt={`${form.pet_name} 사진`}
                    width={900}
                    height={600}
                    unoptimized
                    className="h-64 w-full object-cover"
                  />
                </div>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-bold">반려견 이름</span>
                <input
                  className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                  maxLength={MAX_PET_NAME_LENGTH}
                  value={form.pet_name}
                  onChange={(e) => setForm({ ...form, pet_name: e.target.value })}
                  required
                />
                <span className="mt-2 block text-xs leading-5 text-[#8b8378]">
                  {form.pet_name.length}/{MAX_PET_NAME_LENGTH}자
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">보호자 이름</span>
                <input
                  className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                  maxLength={MAX_OWNER_NAME_LENGTH}
                  value={form.owner_name}
                  onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                  required
                />
                <span className="mt-2 block text-xs leading-5 text-[#8b8378]">
                  {form.owner_name.length}/{MAX_OWNER_NAME_LENGTH}자
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">연락처</span>
                <input
                  className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: formatPhoneNumber(e.target.value) })}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">비상연락망 <span className="font-medium text-[#8b8378]">(선택)</span></span>
                <input
                  className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                  value={form.emergency_phone}
                  onChange={(e) => setForm({ ...form, emergency_phone: formatPhoneNumber(e.target.value) })}
                />
              </label>

              <div className="block">
                <span className="mb-2 block text-sm font-bold">성별 <span className="font-medium text-[#8b8378]">(선택)</span></span>
                <div className="grid grid-cols-2 gap-3">
                  {GENDER_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex h-12 cursor-pointer items-center justify-center rounded-xl border text-sm font-bold transition ${
                        form.gender === option.value
                          ? 'border-[#f2bd33] bg-[#fff8e5] text-[#8a5c00]'
                          : 'border-[#e7e2da] bg-white text-[#6f6657]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={option.value}
                        checked={form.gender === option.value}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">태어난 연도 <span className="font-medium text-[#8b8378]">(선택)</span></span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="2000"
                  max={getCurrentYear()}
                  className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                  value={form.birth_year}
                  onChange={(e) => setForm({ ...form, birth_year: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                />
                <span className="mt-2 block text-xs leading-5 text-[#8b8378]">
                  입력하면 상세 화면에 현재 기준 {getAgeFromBirthYear(form.birth_year) || '나이'}로 표시돼요.
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">동물등록번호 <span className="font-medium text-[#8b8378]">(선택)</span></span>
                <input
                  className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                  value={form.animal_registration_number}
                  onChange={(e) => setForm({ ...form, animal_registration_number: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">활동 지역 <span className="font-medium text-[#8b8378]">(선택)</span></span>
                <input
                  className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                  maxLength={MAX_LOCATION_LENGTH}
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
                <span className="mt-2 block text-xs leading-5 text-[#8b8378]">
                  {form.location.length}/{MAX_LOCATION_LENGTH}자
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">특이사항 <span className="font-medium text-[#8b8378]">(선택)</span></span>
                <textarea
                  className="min-h-24 w-full resize-none rounded-xl border border-[#e7e2da] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                  maxLength={MAX_EMERGENCY_NOTE_LENGTH}
                  value={form.emergency_note}
                  onChange={(e) => setForm({ ...form, emergency_note: e.target.value })}
                />
                <span className="mt-2 block text-xs leading-5 text-[#8b8378]">
                  {form.emergency_note.length}/{MAX_EMERGENCY_NOTE_LENGTH}자
                </span>
              </label>

              <PetPhotoPicker
                label="사진 변경"
                emptyText="새 사진 선택 후 영역 고르기"
                helperText="선택하지 않으면 기존 사진이 유지됩니다"
                hintText="새로 선택한 사진은 원하는 영역으로 잘라서 저장돼요."
                value={imageFile}
                existingImageUrl={form.image_url}
                onChange={setImageFile}
                onProcessingChange={setProcessingImage}
              />

              <button
                disabled={loading || processingImage}
                className="h-13 w-full rounded-xl bg-[#ffd766] px-5 text-sm font-black text-[#211a0c] shadow-[0_10px_24px_rgba(229,173,36,0.28)] transition hover:bg-[#ffcc3d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? '저장 중...' : '수정 저장하기'}
              </button>
            </form>

            <form onSubmit={handlePasswordChange} className="space-y-4 rounded-2xl border border-[#eee8dc] bg-[#fffdf8] p-4">
              <div>
                <p className="text-sm font-black">비밀번호 변경</p>
                <p className="mt-2 text-xs leading-5 text-[#8b8378]">
                  임시 비밀번호로 로그인했다면 여기서 새 비밀번호로 변경해주세요.
                </p>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">새 비밀번호</span>
                <input
                  type="password"
                  className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  minLength={6}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">새 비밀번호 확인</span>
                <input
                  type="password"
                  className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  minLength={6}
                />
              </label>

              <button
                disabled={loading}
                className="h-13 w-full rounded-xl bg-[#171717] px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? '변경 중...' : '비밀번호 변경하기'}
              </button>
            </form>
          </div>
        )}

        {message && (
          <p className="mt-5 break-all rounded-xl bg-[#f7f3ec] px-4 py-3 text-sm font-bold text-[#6f6657]">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
