'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PetPhotoPicker from '@/components/PetPhotoPicker';

// 수정 페이지는 2단계 흐름입니다.
// 1) 고객 ID/비밀번호로 기존 데이터를 불러오고
// 2) 불러온 값을 수정해서 다시 저장합니다.
const MAX_PET_NAME_LENGTH = 20;
const MAX_OWNER_NAME_LENGTH = 20;
const MAX_LOCATION_LENGTH = 50;
const MAX_EMERGENCY_NOTE_LENGTH = 200;
const MAX_USER_ID_LENGTH = 20;
const GENDER_OPTIONS = [
  { value: 'male', label: '남아' },
  { value: 'female', label: '여아' },
] as const;

type PetForm = {
  user_id: string;
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
  // useRouter는 코드 안에서 페이지 이동을 하고 싶을 때 사용합니다.
  const router = useRouter();

  // credentials:
  // 수정 페이지에 들어오기 위한 로그인 정보입니다.
  // 먼저 이 값으로 `/api/pets/manage`를 호출해서 본인 확인을 합니다.
  const [credentials, setCredentials] = useState({
    user_id: '',
    password: '',
  });

  // form:
  // 로그인 성공 후 서버가 돌려준 기존 반려견 정보를 담습니다.
  // 처음에는 null이라서 "로그인 폼"을 보여주고,
  // 값이 들어오면 "수정 폼"을 보여주는 방식입니다.
  const [form, setForm] = useState<PetForm | null>(null);

  // imageFile:
  // 새 사진으로 교체하고 싶을 때만 들어오는 파일입니다.
  // 사용자가 새로 선택하지 않으면 null 상태를 유지하고, 서버도 기존 사진을 그대로 둡니다.
  const [imageFile, setImageFile] = useState<File | null>(null);

  // loading:
  // 로그인 / 저장 / 비밀번호 변경 요청 중인지 나타내는 공통 로딩 상태입니다.
  const [loading, setLoading] = useState(false);

  // processingImage:
  // PetPhotoPicker 내부에서 새 이미지를 준비하는 중인지 나타냅니다.
  const [processingImage, setProcessingImage] = useState(false);

  // message:
  // 사용자에게 보여줄 성공/실패 안내 문구입니다.
  const [message, setMessage] = useState('');

  // passwordForm:
  // "정보 수정"과는 별개로 비밀번호 변경 전용 폼 상태입니다.
  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: '',
  });
  const hasPasswordConfirmation = passwordForm.confirm_password.length > 0;
  const passwordsMatch =
    hasPasswordConfirmation &&
    passwordForm.new_password.length >= 6 &&
    passwordForm.new_password === passwordForm.confirm_password;

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    // 수정 전 먼저 인증을 받아, 이 사람이 실제 보호자인지 확인합니다.
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 보내는 곳:
      // - `/api/pets/manage`
      //
      // 보내는 값:
      // - user_id
      // - password
      //
      // 받는 값:
      // - pet: 수정 폼에 채울 기존 데이터
      const res = await fetch('/api/pets/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: credentials.user_id.trim().toLowerCase(),
          password: credentials.password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || '정보를 불러오지 못했어요.');
        return;
      }

      // 서버에서 받은 데이터를 입력 폼이 바로 사용할 수 있는 형태로 옮깁니다.
      setForm({
        // 서버에서 받은 응답을 그대로 쓰기보다,
        // 입력창이 다루기 편한 문자열 형태로 한 번 정리해서 넣습니다.
        user_id: data.pet.user_id || '',
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

      // PATCH 요청에도 파일이 섞여 있으므로 JSON 대신 FormData를 사용합니다.
      //
      // current_user_id:
      // 지금 로그인한 사용자가 누구인지 서버가 다시 확인할 때 사용
      //
      // user_id:
      // 현재 저장하려는 고객 ID
      //
      // password:
      // 수정 권한 확인용 비밀번호
      Object.entries({
        ...form,
        current_user_id: credentials.user_id.trim().toLowerCase(),
        user_id: credentials.user_id.trim().toLowerCase(),
        password: credentials.password,
      }).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (imageFile) {
        // 새 사진이 있을 때만 서버에 전송합니다.
        formData.append('image_file', imageFile);
      }

      // 보내는 곳:
      // - `/api/pets`
      //
      // 메서드:
      // - PATCH
      //
      // 받는 값:
      // - 수정된 image_url
      // - 공개 URL 등
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
      setCredentials({ ...credentials, user_id: form.user_id.trim().toLowerCase() });
      setImageFile(null);
      alert('수정이 완료됐어요.');
      // 저장 후 홈으로 보내는 것은 "수정 완료" 흐름을 단순하게 유지하기 위한 UX 선택입니다.
      router.push('/');
    } catch {
      setMessage('수정 저장 중 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
    // 비밀번호 변경은 정보 수정과 별도 요청으로 분리했습니다.
    // 이렇게 나누면 실패 원인을 더 명확하게 보여줄 수 있습니다.
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
      // 보내는 곳:
      // - `/api/pets/password`
      //
      // 메서드:
      // - PATCH
      //
      // 목적:
      // - 현재 비밀번호가 맞는지 확인한 뒤 새 비밀번호로 교체
      const res = await fetch('/api/pets/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: credentials.user_id.trim().toLowerCase(),
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
            meonggrey
          </Link>
          <p className="mb-3 text-sm font-bold text-[#d69b14]">Edit Pet Info</p>
          <h1 className="text-3xl font-black leading-tight sm:text-4xl">반려견 정보 수정</h1>
          <p className="mt-4 text-sm leading-6 text-[#6f6657]">
            고객 ID와 비밀번호를 입력하면 등록된 정보를 수정할 수 있어요.<br></br>
            만약 비밀번호를 잊어버렸다면 판매자에게 문의하세요
          </p>
        </header>

        {!form ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">고객 ID</span>
              <input
                placeholder="예) meonggrey01"
                className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm lowercase outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                maxLength={MAX_USER_ID_LENGTH}
                value={credentials.user_id}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    user_id: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, MAX_USER_ID_LENGTH),
                  })
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
                <span className="mb-2 block text-sm font-bold">고객 ID</span>
                <input
                  className="h-12 w-full rounded-xl border border-[#e7e2da] bg-[#f7f3ec] px-4 text-sm lowercase text-[#6f6657] outline-none"
                  value={form.user_id}
                  readOnly
                />
                <span className="mt-2 block text-xs leading-5 text-[#8b8378]">
                  고객 ID는 등록 후 변경할 수 없어요.
                </span>
              </label>

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
                hintText="새로 선택한 사진은 모바일 카드에 보이는 영역 기준으로 저장돼요."
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
                {hasPasswordConfirmation && (
                  <span className={`mt-2 block text-xs font-bold ${passwordsMatch ? 'text-[#2f9d46]' : 'text-[#ee6958]'}`}>
                    {passwordsMatch ? '비밀번호가 일치해요.' : '비밀번호가 일치하지 않아요.'}
                  </span>
                )}
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
