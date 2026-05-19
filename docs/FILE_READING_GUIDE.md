# 파일별 읽는 순서 가이드

## 1. 가장 먼저 볼 파일

### [src/app/layout.tsx](../src/app/layout.tsx)
- App Router에서 모든 페이지를 감싸는 공통 레이아웃입니다.
- `children`이 어디에 렌더링되는지 보면 Next.js가 페이지를 조립하는 방식을 이해할 수 있습니다.

### [src/app/globals.css](../src/app/globals.css)
- 전역 CSS와 Tailwind 테마 변수가 들어 있습니다.
- 디자인 토큰과 전체 배경/폰트가 어디서 정해지는지 볼 수 있습니다.

## 2. 화면 흐름 이해하기

### [src/app/page.tsx](../src/app/page.tsx)
- 홈 화면입니다.
- `useState`, 폼 제출, `fetch`, 조건부 렌더링이 비교적 단순하게 들어 있어서 React 입문용으로 좋습니다.

### [src/app/register/page.tsx](../src/app/register/page.tsx)
- 가장 중요한 학습용 화면입니다.
- 긴 폼을 state로 다루는 방법, 입력 검증, `FormData`, API 호출, 성공 후 결과 표시까지 한 번에 들어 있습니다.

### [src/components/PetPhotoPicker.tsx](../src/components/PetPhotoPicker.tsx)
- 공용 컴포넌트가 어떻게 분리되는지 보여줍니다.
- 부모 페이지가 파일 선택 기능을 직접 다루지 않고 컴포넌트에 맡기는 구조를 이해하기 좋습니다.

### [src/app/edit/page.tsx](../src/app/edit/page.tsx)
- 수정 페이지입니다.
- "로그인 -> 기존 데이터 불러오기 -> 수정 저장" 흐름을 보여줍니다.

### [src/app/pet/[id]/page.tsx](../src/app/pet/[id]/page.tsx)
- 동적 라우트 페이지입니다.
- URL 안의 `id`를 받아 서버에서 바로 데이터를 조회하는 방식이 나옵니다.

### [src/app/pet/[id]/LocationShareButton.tsx](../src/app/pet/[id]/LocationShareButton.tsx)
- 브라우저 API를 쓰는 클라이언트 컴포넌트 예제입니다.
- `navigator.geolocation`, 외부 지도 링크, 문자 앱 이동을 함께 사용합니다.

## 3. 서버 쪽 읽기

### [src/app/api/pets/route.ts](../src/app/api/pets/route.ts)
- 이 프로젝트의 핵심 서버 코드입니다.
- 등록 `POST`, 수정 `PATCH`, 파일 업로드, QR 생성, DB 저장까지 모두 들어 있습니다.

### [src/app/api/pets/manage/route.ts](../src/app/api/pets/manage/route.ts)
- 수정 페이지 로그인 API입니다.

### [src/app/api/pets/password/route.ts](../src/app/api/pets/password/route.ts)
- 비밀번호 변경과 임시 비밀번호 발급을 담당합니다.

### [src/app/api/pets/user-id/route.ts](../src/app/api/pets/user-id/route.ts)
- 중복 확인용 API입니다.

### [src/app/api/registration-codes/route.ts](../src/app/api/registration-codes/route.ts)
### [src/app/api/registration-codes/validate/route.ts](../src/app/api/registration-codes/validate/route.ts)
- 등록코드 생성과 검증을 담당합니다.

### [src/app/api/location/address/route.ts](../src/app/api/location/address/route.ts)
- 외부 카카오 API를 감싸는 서버 API입니다.

## 추천 읽기 순서

1. [src/app/layout.tsx](../src/app/layout.tsx)
2. [src/app/page.tsx](../src/app/page.tsx)
3. [src/app/register/page.tsx](../src/app/register/page.tsx)
4. [src/components/PetPhotoPicker.tsx](../src/components/PetPhotoPicker.tsx)
5. [src/app/api/pets/route.ts](../src/app/api/pets/route.ts)
6. [src/app/edit/page.tsx](../src/app/edit/page.tsx)
7. [src/app/pet/[id]/page.tsx](../src/app/pet/[id]/page.tsx)
8. 나머지 관리자/API 파일

## 읽을 때 체크할 포인트

- `use client`가 붙은 파일은 브라우저에서 실행됩니다.
- `useState`는 화면에 영향을 주는 값을 저장합니다.
- `fetch('/api/...')`는 같은 프로젝트 안의 API Route를 호출합니다.
- `FormData`는 파일 업로드가 섞인 폼 전송에 사용합니다.
- `NextResponse.json(...)`은 서버가 JSON 응답을 돌려줄 때 사용합니다.
