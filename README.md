# pet-id-mvp

반려견 QR 인식표 정보를 등록하고, 공개 페이지와 관리자 기능을 함께 제공하는 Next.js 프로젝트입니다.

## 실행 방법

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 확인할 수 있습니다.

## 주요 화면

- `/` : 홈 화면, 고객 ID로 공개 URL 조회
- `/register` : 반려견 정보 등록
- `/edit` : 반려견 정보 수정
- `/pet/[id]` : 공개 반려견 상세 페이지
- `/admin` : 관리자 기능 통합 페이지
- `/registration-codes` : 등록코드 생성/임시 비밀번호 발급
- `/qr-code` : 연락처로 QR 이미지 조회

## 공부용 문서

- [파일별 읽는 순서 가이드](./docs/FILE_READING_GUIDE.md)
- [React / Next 핵심 개념 정리](./docs/REACT_NEXT_NOTES.md)
- [이 프로젝트로 배우는 React 입문](./docs/PROJECT_LEARNING_PATH.md)
- [CSS / Tailwind 클래스 해설](./docs/CSS_TAILWIND_NOTES.md)

## 먼저 보면 좋은 파일

- [src/app/page.tsx](./src/app/page.tsx)
- [src/app/register/page.tsx](./src/app/register/page.tsx)
- [src/components/PetPhotoPicker.tsx](./src/components/PetPhotoPicker.tsx)
- [src/app/api/pets/route.ts](./src/app/api/pets/route.ts)

## 기술 스택

- Next.js 16
- React 19
- Tailwind CSS 4
- Supabase
- QRCode
