const sections = [
  {
    title: '1. 수집하는 개인정보 항목',
    body: [
      '서비스는 다음의 개인정보를 수집합니다.',
      '필수 항목: 보호자 이름, 연락처',
      '선택 항목: 활동지역, 반려견 이름, 반려견 사진, 특이사항(질병, 성격 등)',
    ],
  },
  {
    title: '2. 개인정보의 수집 및 이용 목적',
    body: [
      '서비스는 다음의 목적을 위해 개인정보를 이용합니다.',
      '반려견 인식표 QR코드 스캔 시 보호자 정보 제공',
      '분실 반려견 발견 시 신속한 연락 지원',
      '서비스 운영 및 관리',
    ],
  },
  {
    title: '3. 개인정보의 보관 및 이용 기간',
    body: [
      '서비스 이용 기간 동안 개인정보를 보관합니다.',
      '이용자가 삭제 요청 또는 회원 탈퇴 시 지체 없이 파기합니다.',
    ],
  },
  {
    title: '4. 개인정보의 제3자 제공',
    body: [
      '서비스는 이용자의 개인정보를 외부에 제공하지 않습니다.',
      '다만, 이용자가 사전에 동의한 경우 또는 법령에 의해 요구되는 경우는 예외로 합니다.',
    ],
  },
  {
    title: '5. 개인정보 처리 위탁',
    body: [
      '서비스는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁할 수 있습니다.',
      '위탁 대상: Supabase (데이터베이스 및 스토리지 서비스)',
      '위탁 내용: 개인정보 저장 및 관리',
    ],
  },
  {
    title: '6. QR코드 공개에 따른 안내',
    body: [
      '본 서비스는 QR코드를 통해 반려견 정보를 제공하는 서비스 특성상, QR코드를 스캔하는 제3자에게 일부 정보가 공개됩니다.',
      '공개되는 정보에는 반려견 정보, 보호자 연락처(일부 또는 전체)가 포함될 수 있습니다.',
      '이용자는 해당 특성을 충분히 이해하고 정보를 등록해야 합니다.',
    ],
  },
  {
    title: '7. 이용자의 권리',
    body: [
      '이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있습니다.',
      '삭제 요청 시 개인정보는 즉시 파기됩니다.',
    ],
  },
  {
    title: '8. 개인정보의 안전성 확보 조치',
    body: [
      '서비스는 개인정보 보호를 위해 접근 권한 제한, 데이터베이스 보안 설정 적용, 관리자 접근 통제 등의 조치를 취합니다.',
    ],
  },
  {
    title: '9. 개인정보 보호책임자',
    body: [
      '서비스는 개인정보 처리에 관한 업무를 총괄하여 책임지고 있습니다.',
      '담당자: 김시우',
      '연락처: 0507-0177-6517',
    ],
  },
  {
    title: '10. 처리방침 변경',
    body: [
      '본 개인정보 처리방침은 변경될 수 있으며, 변경 시 공지사항을 통해 안내합니다.',
    ],
  },
];

export default function PrivacyPolicyContent() {
  return (
    <div className="space-y-8 text-[#2a251f]">
      <div className="space-y-3">
        <p className="text-sm leading-7 text-[#5f574c]">
          본 서비스(이하 “서비스”)는 이용자의 개인정보를 중요시하며, 관련 법령을 준수합니다.
          서비스는 다음과 같은 방침에 따라 개인정보를 처리합니다.
        </p>
      </div>

      {sections.map((section) => (
        <section key={section.title} className="border-t border-[#eee8dc] pt-6">
          <h2 className="text-lg font-black">{section.title}</h2>
          <div className="mt-3 space-y-2 text-sm leading-7 text-[#5f574c]">
            {section.body.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </section>
      ))}

      <section className="border-t border-[#eee8dc] pt-6">
        <h2 className="text-lg font-black">부칙</h2>
        <p className="mt-3 text-sm leading-7 text-[#5f574c]">
          본 방침은 2026년 5월 5일부터 시행됩니다.
        </p>
      </section>
    </div>
  );
}
