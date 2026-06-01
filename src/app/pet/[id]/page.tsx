import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import LocationShareButton from './LocationShareButton';

// 이 페이지는 /pet/[id] 형태의 동적 라우트입니다.
// URL의 id 값에 맞는 반려견 한 마리를 조회해서 공개용 상세 페이지를 렌더링합니다.
type Props = {
  // 이 params.id는 URL의 /pet/[id] 에서 [id] 자리에 들어온 값입니다.
  params: Promise<{ id: string }>;
};

function getGenderLabel(gender: string | null) {
  // DB에는 male/female처럼 저장하지만,
  // 화면에는 사람이 읽기 쉬운 한글로 바꿔 보여줍니다.
  if (gender === 'male') {
    return '남아';
  }

  if (gender === 'female') {
    return '여아';
  }

  return '';
}

function getAgeLabel(birthYear: number | null) {
  // birthYear가 있으면 현재 연도 기준으로 나이를 계산해 "3살"처럼 보여줍니다.
  if (!birthYear) {
    return '';
  }

  const age = new Date().getFullYear() - birthYear;

  if (age < 0) {
    return '';
  }

  return `${age}살`;
}

export default async function Page({ params }: Props) {
  // App Router의 동적 params는 비동기 값으로 전달될 수 있습니다.
  const { id } = await params;

  // 서버 컴포넌트이므로 브라우저를 거치지 않고 바로 DB 조회를 수행할 수 있습니다.
  const { data: pet } = await supabase
    .from('pets')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  // pets 행이 아직 없더라도 registration_codes에는 QR 정보가 남아 있을 수 있습니다.
  // 이 경우에는 404 대신 "등록 준비 중" 화면을 보여줘서 QR 링크가 끊기지 않게 합니다.
  if (!pet) {
    const { data: registrationCode } = await supabase
      .from('registration_codes')
      .select('pet_id')
      .eq('pet_id', id)
      .maybeSingle();

    if (!registrationCode) {
      // notFound()를 호출하면 Next.js가 404 페이지 흐름으로 전환합니다.
      return notFound();
    }
  }

  const data =
    pet ??
    ({
      image_url: '',
      pet_name: '',
      owner_name: '',
      phone: '',
      emergency_phone: '',
      animal_registration_number: '',
      location: '',
      emergency_note: '',
      gender: null,
      birth_year: null,
    } as const);

  const genderLabel = getGenderLabel(data.gender);
  const ageLabel = getAgeLabel(data.birth_year);
  const isRegistrationPending =
    !data.pet_name || !data.phone || !data.owner_name;

  // genderLabel / ageLabel은 "화면 표시용 가공 데이터"입니다.
  // DB 원본값을 그대로 쓰기보다, JSX가 읽기 쉽게 미리 변환해둔 값입니다.

  if (isRegistrationPending) {
    return (
      <main className="min-h-screen bg-[#fbfaf7] px-4 py-5 text-[#171717] sm:px-6 sm:py-10">
        <section className="mx-auto max-w-[430px] overflow-hidden rounded-[34px] border border-[#e9e4dc] bg-white shadow-[0_24px_70px_rgba(55,45,30,0.12)]">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f6f0e8]">
            {data.image_url ? (
              <>
                <Image
                  src={data.image_url}
                  alt=""
                  fill
                  unoptimized
                  aria-hidden="true"
                  sizes="(max-width: 768px) 100vw, 430px"
                  className="scale-110 object-cover opacity-50 blur-xl"
                />
                <Image
                  src={data.image_url}
                  alt="등록 전 반려견 사진"
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 430px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.8)_70%,rgba(255,255,255,1)_100%)]" />
              </>
            ) : (
              <div className="grid h-full w-full place-items-center bg-[#fff2c7]">
                <span className="text-[72px] leading-none sm:text-[92px]">🐶</span>
              </div>
            )}
          </div>

          <div className="-mt-3 rounded-t-[30px] bg-white px-4 pb-6 pt-5 sm:px-5">
            <div className="mb-6 flex justify-center">
              <div className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-[#eef8ef] px-5 py-3 text-center text-sm font-black leading-6 text-[#2f9d46]">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[13px]">♧</span>
                <span className="min-w-0 break-keep">이 아이는 아직 정보 등록 중이에요</span>
              </div>
            </div>

            <h1 className="mb-5 text-[34px] font-black tracking-[-0.03em]">
              등록 정보 준비 중
            </h1>

            <p className="text-[15px] leading-7 text-[#6f6657]">
              관리자가 QR 코드를 먼저 만들었어요. 보호자가 정보를 등록하면 이 페이지에 이름, 연락처, 활동 지역이 표시됩니다.
            </p>

            <div className="mt-8 rounded-2xl bg-[#edf8ee] p-5 text-sm text-[#244a2b]">
              <p className="mb-2 font-black">정보 등록 전이에요</p>
              <p className="leading-6">
                아직 보호자 정보가 입력되지 않았습니다. 등록이 끝나면 공개 상세 페이지로 자동 연결됩니다.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-5 text-[#171717] sm:px-6 sm:py-10">
      <section className="mx-auto max-w-[430px] overflow-hidden rounded-[34px] border border-[#e9e4dc] bg-white shadow-[0_24px_70px_rgba(55,45,30,0.12)]">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f6f0e8]">
          {data.image_url ? (
            <>
              {/* 첫 번째 이미지는 흐린 배경층, 두 번째 이미지는 실제 선명한 메인 사진입니다. */}
              <Image
                src={data.image_url}
                alt=""
                fill
                unoptimized
                aria-hidden="true"
                sizes="(max-width: 768px) 100vw, 430px"
                className="scale-110 object-cover opacity-50 blur-xl"
              />
              <Image
                src={data.image_url}
                alt={`${data.pet_name} 사진`}
                fill
                unoptimized
                priority
                sizes="(max-width: 768px) 100vw, 430px"
                className="object-cover object-center"
              />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.8)_70%,rgba(255,255,255,1)_100%)]" />
            </>
          ) : (
            <div className="grid h-full w-full place-items-center bg-[#fff2c7]">
              <span className="text-[72px] leading-none sm:text-[92px]">🐶</span>
            </div>
          )}
        </div>

        <div className="-mt-3 rounded-t-[30px] bg-white px-4 pb-6 pt-5 sm:px-5">
          <div className="mb-6 flex justify-center">
            <div className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-[#eef8ef] px-5 py-3 text-center text-sm font-black leading-6 text-[#2f9d46]">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[13px]">♧</span>
              <span className="min-w-0 break-keep">이 아이는 보호받고 있어요</span>
            </div>
          </div>

          <h1 className="mb-8 text-[34px] font-black tracking-[-0.03em]">
            {data.pet_name} <span className="text-[#b98242]">🐾</span>
          </h1>

          {/* dl / dt / dd는 "항목 이름 - 값" 구조를 표현하는 HTML 태그입니다. */}
          <dl className="space-y-5 text-[15px]">
              {genderLabel && (
                <div className="grid grid-cols-[28px_88px_1fr] items-start gap-2">
                  <dt className="text-xl leading-none">⚥</dt>
                  <dt className="font-bold text-[#6f6657]">성별</dt>
                  <dd className="font-semibold">{genderLabel}</dd>
                </div>
              )}

              {ageLabel && (
                <div className="grid grid-cols-[28px_88px_1fr] items-start gap-2">
                  <dt className="text-xl leading-none">◔</dt>
                  <dt className="font-bold text-[#6f6657]">나이</dt>
                  <dd className="font-semibold">{ageLabel}</dd>
                </div>
              )}

              {data.owner_name && (
                <div className="grid grid-cols-[28px_88px_1fr] items-start gap-2">
                  <dt className="text-xl leading-none">♙</dt>
                  <dt className="font-bold text-[#6f6657]">보호자</dt>
                  <dd className="font-semibold">{data.owner_name}</dd>
                </div>
              )}

              <div className="grid grid-cols-[28px_88px_1fr] items-start gap-2">
                <dt className="text-xl leading-none">☎</dt>
                <dt className="font-bold text-[#6f6657]">연락처</dt>
                <dd className="font-black text-[#28a745]">{data.phone}</dd>
              </div>

              {data.emergency_phone && (
                <div className="grid grid-cols-[28px_88px_1fr] items-start gap-2">
                  <dt className="text-xl leading-none">☏</dt>
                  <dt className="font-bold text-[#6f6657]">비상연락망</dt>
                  <dd className="font-black text-[#28a745]">{data.emergency_phone}</dd>
                </div>
              )}

              {data.animal_registration_number && (
                <div className="grid grid-cols-[28px_88px_1fr] items-start gap-2">
                  <dt className="text-xl leading-none">▣</dt>
                  <dt className="font-bold text-[#6f6657]">등록번호</dt>
                  <dd className="font-semibold leading-6">{data.animal_registration_number}</dd>
                </div>
              )}

              {data.location && (
                <div className="grid grid-cols-[28px_88px_1fr] items-start gap-2">
                  <dt className="text-xl leading-none">⌖</dt>
                  <dt className="font-bold text-[#6f6657]">활동 지역</dt>
                  <dd className="font-semibold leading-6">{data.location}</dd>
                </div>
              )}

              <div className="grid grid-cols-[28px_88px_1fr] items-start gap-2">
                <dt className="text-xl leading-none">◇</dt>
                <dt className="font-bold text-[#6f6657]">특이사항</dt>
                <dd className="whitespace-pre-line font-semibold leading-7">
                  {data.emergency_note || '특이사항 없음'}
                </dd>
              </div>
          </dl>

          <div className="mt-10 rounded-2xl bg-[#edf8ee] p-5 text-sm text-[#244a2b]">
            <p className="mb-2 font-black">이 아이를 발견하셨다면?</p>
            <p className="leading-6">
              위 연락처로 연락 주시면 감사하겠습니다. 우리 아이가 무사히 집으로 돌아갈 수 있도록 도와주세요.
            </p>
          </div>

          <a
            href={`tel:${data.phone}`}
            className="mt-7 flex h-14 w-full items-center justify-center rounded-[18px] bg-[#35ad49] px-5 text-center text-base font-black text-white shadow-[0_12px_28px_rgba(53,173,73,0.28)] transition hover:bg-[#2d9c3f]"
          >
            ☎ 보호자에게 전화하기
          </a>

          <LocationShareButton petName={data.pet_name} phone={data.phone} />
        </div>
      </section>
    </main>
  );
}
