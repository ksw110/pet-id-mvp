import PrivacyPolicyContent from './PrivacyPolicyContent';

// 개인정보 처리방침 페이지는 본문 컴포넌트를 분리해 재사용성과 가독성을 높였습니다.
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] px-4 py-6 text-[#171717] sm:px-6 sm:py-10">
      <article className="mx-auto w-full max-w-3xl rounded-[28px] border border-[#ece7dd] bg-white p-5 shadow-[0_24px_70px_rgba(55,45,30,0.12)] sm:p-8">
        <header className="mb-8 border-b border-[#f0ece4] pb-6">
          <div className="mb-8 flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#fff0ba] text-lg">🐾</span>
            meonggrey
          </div>
          <p className="mb-3 text-sm font-bold text-[#d69b14]">Privacy Policy</p>
          <h1 className="text-3xl font-black leading-tight sm:text-4xl">
            개인정보 처리방침
          </h1>
        </header>

        <PrivacyPolicyContent />
      </article>
    </main>
  );
}
