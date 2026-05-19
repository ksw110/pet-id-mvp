# React / Next 핵심 개념 정리


## React 기본

### 컴포넌트
- React는 화면을 컴포넌트라는 작은 단위로 나눠 만듭니다.
- 컴포넌트는 보통 함수로 작성하고 JSX를 반환합니다.

### JSX
- JavaScript 안에서 HTML처럼 보이는 문법입니다.
- 실제 HTML 문자열이 아니라 React가 해석하는 문법입니다.

### props
- 부모가 자식에게 넘기는 값입니다.
- 예: `PetPhotoPicker`에 `label`, `value`, `onChange`를 넘기는 방식

### state
- 화면이 바뀌는 원인이 되는 값입니다.
- `useState`로 만들고, setter를 호출하면 다시 렌더링됩니다.

```tsx
const [loading, setLoading] = useState(false);
```

### 이벤트 처리
- `onClick`, `onChange`, `onSubmit` 같은 속성에 함수를 연결합니다.

### 조건부 렌더링
- 어떤 조건일 때만 특정 UI를 보여주는 방식입니다.

```tsx
{message && <p>{message}</p>}
```

### 배열 렌더링
- 같은 구조를 여러 번 그릴 때 `map()`을 사용합니다.
- 이때 `key`가 필요합니다.

## Next.js App Router 핵심

### `src/app`
- 폴더 구조가 URL 구조와 연결됩니다.
- `src/app/register/page.tsx`는 `/register`가 됩니다.

### `layout.tsx`
- 모든 페이지를 감싸는 공통 레이아웃입니다.

### Server Component
- 기본값입니다.
- 서버에서 렌더링되고, DB를 직접 읽는 작업에 유리합니다.

### Client Component
- 파일 맨 위에 `'use client';`가 필요합니다.
- `useState`, `useEffect`, 브라우저 API, 이벤트 핸들러를 사용할 수 있습니다.

### API Route
- `src/app/api/.../route.ts` 파일이 서버 API가 됩니다.
- 브라우저에서 `fetch('/api/...')`로 호출합니다.

## 이 프로젝트에서 자주 나오는 패턴

### 긴 폼을 객체 state로 관리하기

```tsx
const [form, setForm] = useState({
  pet_name: '',
  owner_name: '',
});
```

### 입력 변경 시 일부 필드만 갱신하기

```tsx
setForm({ ...form, pet_name: e.target.value })
```

### 파일 업로드가 있을 때 FormData 쓰기

```tsx
const formData = new FormData();
formData.append('pet_name', form.pet_name);
formData.append('image_file', imageFile);
```

### try / catch / finally
- 비동기 요청에서 성공/실패/마무리 처리를 나눌 때 자주 씁니다.

## 헷갈리기 쉬운 질문

### 왜 `use client`가 필요한가요?
- 브라우저에서 실행되어야 하는 코드는 서버 컴포넌트에서 쓸 수 없기 때문입니다.

### 왜 JSON 대신 FormData를 쓰나요?
- 파일 업로드가 섞이면 FormData가 더 적합합니다.

### 왜 비밀번호를 해시하나요?
- 원문 비밀번호를 DB에 저장하지 않기 위해서입니다.

### 왜 어떤 곳은 직접 DB를 읽고, 어떤 곳은 `/api`를 호출하나요?
- 클라이언트 컴포넌트는 보통 API를 호출합니다.
- 서버 컴포넌트는 서버 안에서 직접 읽을 수 있습니다.
