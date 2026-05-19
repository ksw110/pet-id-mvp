'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PetPhotoPicker from '@/components/PetPhotoPicker';
import PrivacyPolicyContent from '../privacy/PrivacyPolicyContent';

// 이 파일은 반려견 정보를 처음 등록하는 페이지입니다.
// React 초심자 관점에서 보면 "긴 입력 폼 + 검증 + API 호출 + 성공 결과 표시" 예제라고 볼 수 있습니다.
const MAX_PET_NAME_LENGTH = 20;
const MAX_OWNER_NAME_LENGTH = 20;
const MAX_LOCATION_LENGTH = 50;
const MAX_EMERGENCY_NOTE_LENGTH = 200;
const MAX_USER_ID_LENGTH = 20;
const GENDER_OPTIONS = [
  { value: 'male', label: '남아' },
  { value: 'female', label: '여아' },
] as const;

function formatPhoneNumber(value: string) {
  // 사용자가 숫자만 입력해도 자동으로 010-1234-5678 형태에 가깝게 맞춰줍니다.
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
  // 입력값은 문자열이므로 먼저 "정말 4자리 연도인가?"를 검사합니다.
  if (!/^\d{4}$/.test(birthYear)) {
    return '';
  }

  const age = getCurrentYear() - Number(birthYear);
  return age >= 0 ? `${age}살` : '';
}

async function readJsonResponse(res: Response) {
  // 어떤 API는 에러 상황에서 JSON이 아닐 수도 있으므로 안전하게 감쌉니다.
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function RegisterPage() {
  // 관련 있는 입력값을 하나의 객체 state로 묶으면
  // form 전체를 다루기 쉽고, 제출 시에도 그대로 FormData로 옮기기 편합니다.
  const [form, setForm] = useState({
    // registration_code:
    // 판매자/관리자가 미리 발급해준 등록코드입니다.
    // 등록 전에 유효한 코드인지 서버에서 먼저 검사합니다.
    registration_code: '',

    // user_id:
    // 사용자가 나중에 수정 페이지 로그인에 쓸 "고객 ID"입니다.
    // 중복되면 안 되기 때문에 별도 중복 확인 API를 호출합니다.
    user_id: '',

    // password / password_confirm:
    // 수정 페이지 로그인에 쓸 비밀번호와 비밀번호 확인 값입니다.
    // password_confirm는 DB에 저장하려는 값이 아니라,
    // 사용자가 비밀번호를 잘못 입력하지 않았는지 확인하기 위한 보조 입력입니다.
    password: '',
    password_confirm: '',

    // pet_name:
    // 공개 상세 페이지에서 크게 보여줄 반려견 이름입니다.
    pet_name: '',

    // owner_name:
    // 보호자 이름입니다.
    owner_name: '',

    // phone:
    // 가장 중요한 보호자 연락처입니다.
    // 공개 페이지와 전화 버튼에서 사용됩니다.
    phone: '',

    // emergency_phone:
    // 추가 연락처가 있을 때만 입력하는 선택값입니다.
    emergency_phone: '',

    // gender / birth_year:
    // 상세 페이지에 성별과 나이를 표시하기 위한 선택 입력값입니다.
    gender: '',
    birth_year: '',

    // animal_registration_number:
    // 국가 동물등록번호 같은 추가 식별값입니다.
    animal_registration_number: '',

    // emergency_note:
    // 성격, 주의사항, 질병 같은 메모를 적는 칸입니다.
    emergency_note: '',

    // location:
    // 활동 지역을 적는 칸입니다.
    location: '',
  });

  // imageFile:
  // 사용자가 최종적으로 선택하고 크롭까지 끝낸 업로드용 파일입니다.
  // 이 값은 submit 시 FormData에 `image_file`이라는 이름으로 서버에 전송됩니다.
  const [imageFile, setImageFile] = useState<File | null>(null);

  // qrImage:
  // 등록 성공 후 서버가 생성해준 QR 이미지 URL입니다.
  // 등록 결과 화면에서 미리보기로 사용됩니다.
  const [qrImage, setQrImage] = useState('');

  // resultUrl:
  // 등록 성공 후 만들어진 공개 상세 페이지 URL입니다.
  const [resultUrl, setResultUrl] = useState('');

  // loading:
  // 등록 요청 전체가 진행 중인지 나타냅니다.
  const [loading, setLoading] = useState(false);

  // processingImage:
  // 사진 크롭/준비 작업이 끝났는지 나타냅니다.
  // true일 때는 아직 업로드할 파일이 완전히 준비되지 않았다고 보면 됩니다.
  const [processingImage, setProcessingImage] = useState(false);

  // privacyAgreed:
  // 개인정보 동의 체크박스 값입니다.
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // privacyModalOpen:
  // 개인정보 처리방침 모달을 열었는지 여부입니다.
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  // submitMessage:
  // 등록 과정에서 생긴 성공/실패 메시지를 저장합니다.
  const [submitMessage, setSubmitMessage] = useState('');

  // checkingUserId:
  // 중복 확인 API가 진행 중인지 나타냅니다.
  const [checkingUserId, setCheckingUserId] = useState(false);

  // userIdChecked:
  // "중복 확인 버튼을 한 번이라도 눌렀는가?"를 뜻합니다.
  // 그냥 입력만 하고 넘어가는 걸 막기 위해 따로 상태를 둡니다.
  const [userIdChecked, setUserIdChecked] = useState(false);

  // userIdAvailable:
  // 서버 응답 기준으로 사용 가능한 ID인지 여부입니다.
  const [userIdAvailable, setUserIdAvailable] = useState(false);
  // 파생값(derived state)은 별도 useState가 아니라 현재 값으로부터 계산하면
  // 상태 동기화 버그를 줄일 수 있습니다.
  const hasPasswordConfirmation = form.password_confirm.length > 0;
  const passwordsMatch =
    hasPasswordConfirmation && form.password.length >= 6 && form.password === form.password_confirm;

  async function handleUserIdCheck() {
    if (!form.user_id) {
      alert('고객 ID를 먼저 입력해주세요.');
      return;
    }

    setCheckingUserId(true);

    try {
      // 회원가입/등록 폼에서 흔한 "중복 확인" 흐름입니다.
      // 버튼 클릭 시 전용 API로 user_id 사용 가능 여부를 검사합니다.
      //
      // 보내는 곳:
      // - `/api/pets/user-id`
      //
      // 보내는 값:
      // - { user_id: form.user_id }
      //
      // 받는 값:
      // - { available: true | false }
      const res = await fetch('/api/pets/user-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: form.user_id }),
      });
      const data = await readJsonResponse(res);

      if (!res.ok) {
        const errorMessage = data?.error || '고객 ID를 확인하지 못했어요.';
        setUserIdChecked(false);
        setUserIdAvailable(false);
        alert(errorMessage);
        return;
      }

      setUserIdChecked(true);
      setUserIdAvailable(Boolean(data?.available));

      if (data?.available) {
        alert('사용 가능한 고객 ID예요.');
        return;
      }

      alert('이미 사용 중인 고객 ID예요. 다른 ID를 입력해주세요.');
    } catch {
      setUserIdChecked(false);
      setUserIdAvailable(false);
      alert('고객 ID를 확인하는 중 오류가 발생했어요.');
    } finally {
      setCheckingUserId(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // submit은 전체 폼의 마지막 진입점입니다.
    // 보통 "기본 검증 -> 서버 검증 -> 실제 저장" 순서로 읽으면 이해하기 쉽습니다.
    e.preventDefault();
    setLoading(true);
    setSubmitMessage('');

    try {
      const registrationCode = form.registration_code.trim().toUpperCase();

      // 1. 프론트에서 먼저 아주 기본적인 빈칸/길이 검사를 합니다.
      // 2. 그 다음 서버에 등록코드 검증 요청을 보냅니다.
      // 3. 마지막으로 실제 등록 API에 FormData를 전송합니다.
      if (!registrationCode || !form.user_id || !form.password) {
        alert('등록코드, 고객 ID, 비밀번호를 입력해주세요.');
        return;
      }

      if (!userIdChecked || !userIdAvailable) {
        alert('고객 ID 중복 확인을 완료해주세요.');
        return;
      }

      if (form.password.length < 6) {
        alert('비밀번호는 6자 이상 입력해주세요.');
        return;
      }

      if (form.password !== form.password_confirm) {
        alert('비밀번호 확인이 일치하지 않아요.');
        return;
      }

      const codeValidationRes = await fetch('/api/registration-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_code: registrationCode }),
      });
      const codeValidationData = await readJsonResponse(codeValidationRes);

      if (!codeValidationRes.ok) {
        // 등록코드는 "존재하지 않음" 또는 "이미 사용됨"일 수 있습니다.
        // 이 에러 메시지는 서버가 상황에 맞게 만들어서 보내줍니다.
        const errorMessage = codeValidationData?.error || '등록코드를 확인할 수 없습니다.';
        setSubmitMessage(errorMessage);
        alert(errorMessage);
        return;
      }

      const formData = new FormData();

      // 문자열 입력값은 FormData에 차례대로 담고,
      // 파일은 아래에서 별도로 append합니다.
      Object.entries({
        ...form,
        registration_code: registrationCode,
      }).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (imageFile) {
        // 서버의 `/api/pets`는 `image_file`이라는 key 이름으로 파일을 받습니다.
        formData.append('image_file', imageFile);
      }

      // 등록 API는 multipart/form-data를 받기 때문에
      // JSON이 아니라 FormData를 body로 그대로 보냅니다.
      //
      // 보내는 곳:
      // - `/api/pets`
      //
      // 받는 값:
      // - id
      // - url
      // - qr_image_url
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
        // 등록은 성공했는데 URL이 없다면 화면에서 결과를 이어갈 수 없으므로
        // 예외로 처리합니다.
        throw new Error('QR 생성 결과를 불러오지 못했어요.');
      }

      setQrImage(data.qr_image_url || '');
      setResultUrl(data.url);
      setSubmitMessage('QR 코드가 생성됐어요.');

      // 결과 섹션은 폼 아래쪽에 있어서, 등록 직후 사용자가 못 보고 지나칠 수 있습니다.
      // 그래서 성공하면 결과 영역으로 자동 스크롤합니다.
      // 결과를 바로 볼 수 있게 성공 후 특정 영역으로 스크롤합니다.
      window.setTimeout(() => {
        document.getElementById('qr-result')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    } catch (error) {
      // try 블록 안에서 throw된 에러와 네트워크 오류가 여기로 옵니다.
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
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#fff0ba] text-lg">🐾</span>
              meonggrey
            </Link>
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
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#fff0ba] text-lg">🐾</span>
              meonggrey
            </Link>
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
                  <span className="mb-2 block text-sm font-bold">고객 ID <span className="text-[#ee6958]">*</span></span>
                  <div className="flex gap-2">
                    <input
                      placeholder="예) meonggrey01"
                      className="h-12 min-w-0 flex-1 rounded-xl border border-[#e7e2da] bg-white px-4 text-sm lowercase outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                      maxLength={MAX_USER_ID_LENGTH}
                      value={form.user_id}
                      onChange={(e) => {
                        setForm({
                          ...form,
                          user_id: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, MAX_USER_ID_LENGTH),
                        });
                        setUserIdChecked(false);
                        setUserIdAvailable(false);
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleUserIdCheck}
                      disabled={checkingUserId || form.user_id.length < 4}
                      className="shrink-0 rounded-xl border border-[#d8cfbf] bg-white px-4 text-sm font-bold text-[#5f574c] transition hover:border-[#f2bd33] hover:bg-[#fff8e5] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {checkingUserId ? '확인 중' : '중복 확인'}
                    </button>
                  </div>
                  <span className="mt-2 block text-xs leading-5 text-[#8b8378]">
                    수정할 때 사용할 로그인용 ID예요. {form.user_id.length}/{MAX_USER_ID_LENGTH}자
                  </span>
                  {userIdChecked && (
                    <span className={`mt-1 block text-xs font-bold ${userIdAvailable ? 'text-[#2f9d46]' : 'text-[#ee6958]'}`}>
                      {userIdAvailable ? '사용 가능한 고객 ID예요.' : '이미 사용 중인 고객 ID예요.'}
                    </span>
                  )}
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
                    고객 ID와 비밀번호는 추후 정보 수정에 사용됩니다.
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold">비밀번호 확인 <span className="text-[#ee6958]">*</span></span>
                  <input
                    type="password"
                    placeholder="비밀번호를 한 번 더 입력해주세요"
                    className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                    value={form.password_confirm}
                    onChange={(e) =>
                      setForm({ ...form, password_confirm: e.target.value })
                    }
                    minLength={6}
                    required
                  />
                  {hasPasswordConfirmation && (
                    <span className={`mt-2 block text-xs font-bold ${passwordsMatch ? 'text-[#2f9d46]' : 'text-[#ee6958]'}`}>
                      {passwordsMatch ? '비밀번호가 일치해요.' : '비밀번호가 일치하지 않아요.'}
                    </span>
                  )}
                </label>
              </div>
            </div>

            <label className="block">
                <span className="mb-2 block text-sm font-bold">반려견 이름 <span className="text-[#ee6958]">*</span></span>
                <input
                  placeholder="예) 코코"
                  className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                  maxLength={MAX_PET_NAME_LENGTH}
                  value={form.pet_name}
                  onChange={(e) =>
                    setForm({ ...form, pet_name: e.target.value })
                  }
                  required
                />
                <span className="mt-2 block text-xs leading-5 text-[#8b8378]">
                  {form.pet_name.length}/{MAX_PET_NAME_LENGTH}자
                </span>
              </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">보호자 이름 <span className="text-[#ee6958]">*</span></span>
              <input
                placeholder="예) 홍길동"
                className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                maxLength={MAX_OWNER_NAME_LENGTH}
                value={form.owner_name}
                onChange={(e) =>
                  setForm({ ...form, owner_name: e.target.value })
                }
                required
              />
              <span className="mt-2 block text-xs leading-5 text-[#8b8378]">
                {form.owner_name.length}/{MAX_OWNER_NAME_LENGTH}자
              </span>
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
                placeholder={`예) ${getCurrentYear() - 3}`}
                className="h-12 w-full rounded-xl border border-[#e7e2da] bg-white px-4 text-sm outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                value={form.birth_year}
                onChange={(e) =>
                  setForm({ ...form, birth_year: e.target.value.replace(/\D/g, '').slice(0, 4) })
                }
              />
              <span className="mt-2 block text-xs leading-5 text-[#8b8378]">
                입력하면 상세 화면에 현재 기준 {getAgeFromBirthYear(form.birth_year) || '나이'}로 표시돼요.
              </span>
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
                maxLength={MAX_LOCATION_LENGTH}
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
              />
              <span className="mt-2 block text-xs leading-5 text-[#8b8378]">
                {form.location.length}/{MAX_LOCATION_LENGTH}자
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold">특이사항 <span className="font-medium text-[#8b8378]">(선택)</span></span>
              <textarea
                placeholder="예) 사람을 좋아해요. 겁이 많아요 등"
                className="min-h-24 w-full resize-none rounded-xl border border-[#e7e2da] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#b8b2aa] focus:border-[#f2bd33] focus:ring-4 focus:ring-[#ffe8a3]"
                maxLength={MAX_EMERGENCY_NOTE_LENGTH}
                value={form.emergency_note}
                onChange={(e) =>
                  setForm({ ...form, emergency_note: e.target.value })
                }
              />
              <span className="mt-2 block text-xs leading-5 text-[#8b8378]">
                {form.emergency_note.length}/{MAX_EMERGENCY_NOTE_LENGTH}자
              </span>
            </label>

            <PetPhotoPicker
              label="사진 등록"
              required
              emptyText="사진 선택 후 영역 고르기"
              helperText="선택 후 원하는 영역을 직접 맞춘 뒤 업로드됩니다"
              hintText="모바일 카드에 보이는 세로형 영역 기준으로 저장돼요."
              value={imageFile}
              onChange={setImageFile}
              onProcessingChange={setProcessingImage}
            />

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
              disabled={loading || processingImage || !privacyAgreed}
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
              <p className="text-xs font-bold text-[#8b8378]">생성된 meonggrey 링크</p>
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
