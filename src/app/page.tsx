import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-sm font-medium text-gray-500">
          QR 반려견 인식표 MVP
        </p>

        <h1 className="text-4xl font-bold tracking-tight">
          잃어버렸을 때 바로 연결되는 인식표
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-gray-600">
          주문 후 반려견 정보를 등록하면 고유 URL이 생성되고,
          그 링크를 QR로 각인하는 구조입니다.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/register"
            className="rounded-xl bg-black px-5 py-3 text-white"
          >
            정보 등록하기
          </Link>
        </div>
      </div>
    </main>
  );
}