import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return notFound();

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        {data.image_url && (
          <img
            src={data.image_url}
            alt={data.pet_name}
            className="mb-5 h-72 w-full rounded-xl object-cover"
          />
        )}

        <div className="text-center">
          <p className="text-sm text-gray-500">반려견 보호 정보</p>

          <h1 className="mt-2 text-3xl font-bold">{data.pet_name}</h1>

          {data.owner_name && (
            <p className="mt-2 text-gray-600">보호자: {data.owner_name}</p>
          )}

          {data.location && (
            <p className="mt-1 text-gray-600">
              활동지역: {data.location}
            </p>
          )}
        </div>

        <a
          href={`tel:${data.phone}`}
          className="mt-6 block rounded-xl bg-black p-3 text-center text-white"
        >
          보호자에게 전화하기
        </a>

        <div className="mt-5 rounded-xl bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-700">연락처</p>
          <p className="mt-2 text-sm text-gray-600">{data.phone}</p>
        </div>

        <div className="mt-4 rounded-xl bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-700">특이사항</p>
          <p className="mt-2 text-sm text-gray-600">
            {data.emergency_note || '등록된 특이사항이 없습니다.'}
          </p>
        </div>
      </div>
    </main>
  );
}