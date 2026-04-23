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
      <div className="mx-auto max-w-md rounded-2xl border bg-white p-6">
        <h1 className="text-3xl font-bold">{data.pet_name}</h1>
        <p className="mt-2">보호자: {data.owner_name}</p>

        <a
          href={`tel:${data.phone}`}
          className="block mt-4 bg-black text-white p-3 rounded text-center"
        >
          전화하기
        </a>

        <p className="mt-4">{data.emergency_note}</p>
      </div>
    </main>
  );
}