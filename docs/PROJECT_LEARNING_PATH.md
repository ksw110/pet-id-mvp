# 이 프로젝트로 배우는 React 입문


## 먼저 해볼 추천 순서

1. [src/app/page.tsx](../src/app/page.tsx)
2. [src/app/register/page.tsx](../src/app/register/page.tsx)
3. [src/components/PetPhotoPicker.tsx](../src/components/PetPhotoPicker.tsx)
4. [src/app/api/pets/route.ts](../src/app/api/pets/route.ts)
5. [src/app/edit/page.tsx](../src/app/edit/page.tsx)
6. [src/app/pet/[id]/page.tsx](../src/app/pet/[id]/page.tsx)

## Step 1. 등록 화면 하나만 끝까지 보기

읽을 파일:
1. [src/app/register/page.tsx](../src/app/register/page.tsx)
2. [src/components/PetPhotoPicker.tsx](../src/components/PetPhotoPicker.tsx)
3. [src/app/api/pets/user-id/route.ts](../src/app/api/pets/user-id/route.ts)
4. [src/app/api/registration-codes/validate/route.ts](../src/app/api/registration-codes/validate/route.ts)
5. [src/app/api/pets/route.ts](../src/app/api/pets/route.ts)

이 다섯 파일만 읽어도 아래를 이해할 수 있습니다.
- 고객 ID 중복 확인 흐름
- 등록코드 검증 흐름
- 사진 선택/크롭/업로드 흐름
- DB 저장과 QR 생성 흐름

## Step 2. React 문법 포인트 찾기

### `useState`
- 어떤 값이 state인지 표시해보세요.
- 왜 그냥 변수로 두면 안 되는지 생각해보세요.

### 이벤트 함수
- `handleSubmit`, `handleSave`, `handleUserIdCheck`를 따라가 보세요.
- 어떤 이벤트에 연결되는지 확인해보세요.

### 조건부 렌더링
- `message && ...`, `form ? ... : ...` 같은 문법을 찾아보세요.

## Step 3. 컴포넌트 분리 이해하기

부모:
- [src/app/register/page.tsx](../src/app/register/page.tsx)
- [src/app/edit/page.tsx](../src/app/edit/page.tsx)

자식:
- [src/components/PetPhotoPicker.tsx](../src/components/PetPhotoPicker.tsx)

볼 포인트:
- 부모는 최종 결과 파일만 필요함
- 자식은 드래그, 확대, 미리보기를 담당함
- `onChange`를 통해 부모에게 결과를 돌려줌

## Step 4. 서버와 연결해서 보기

브라우저 쪽:
- `fetch('/api/pets')`

서버 쪽:
- [src/app/api/pets/route.ts](../src/app/api/pets/route.ts)

질문:
- 요청은 JSON인가 FormData인가
- 서버는 어떤 값을 먼저 검증하는가
- 비밀번호는 왜 해시하는가

## Step 5. 직접 해보면 좋은 연습

### 연습 1
- 홈 화면 제목 문구 바꾸기

### 연습 2
- 등록 폼 글자 수 제한 상수 바꾸기

### 연습 3
- 등록 성공 메시지 바꾸기

### 연습 4
- 상세 페이지 배지 색상 바꾸기

### 연습 5
- 새 필드 하나 추가하기
- 예: 반려견 성격

## 마지막 체크리스트

- React state가 왜 필요한지 설명할 수 있는가
- `fetch('/api/...')`가 어디로 가는지 설명할 수 있는가
- `FormData`를 왜 쓰는지 설명할 수 있는가
- `use client`가 왜 필요한지 설명할 수 있는가
- 동적 라우트 `[id]`가 어떻게 동작하는지 설명할 수 있는가
