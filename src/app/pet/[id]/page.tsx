import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import LocationShareButton from './LocationShareButton';

type Props = {
  params: Promise<{ id: string }>;
};

function getGenderLabel(gender: string | null) {
  if (gender === 'male') {
    return '남아';
  }

  if (gender === 'female') {
    return '여아';
  }

  return '';
}

function getAgeLabel(birthYear: number | null) {
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
  const { id } = await params;

  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return notFound();

  const genderLabel = getGenderLabel(data.gender);
  const ageLabel = getAgeLabel(data.birth_year);

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
