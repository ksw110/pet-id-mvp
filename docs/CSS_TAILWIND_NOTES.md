# CSS / Tailwind 클래스 해설

## 1. 먼저 큰 개념부터

이 프로젝트는 일반 CSS를 길게 직접 쓰기보다, `className` 안에 짧은 클래스들을 여러 개 붙여서 스타일을 만듭니다.

예를 들어 이런 코드가 있으면:

```tsx
<div className="w-full max-w-3xl px-6 py-6 rounded-2xl bg-white shadow-sm" />
```

이건 "클래스 1개"가 아니라 아래 의미를 가진 "작은 스타일 조각 여러 개"가 합쳐진 것입니다.

- `w-full` : 너비를 100%로
- `max-w-3xl` : 하지만 최대 너비는 3xl까지만
- `px-6` : 좌우 안쪽 여백(padding) 6
- `py-6` : 위아래 안쪽 여백(padding) 6
- `rounded-2xl` : 모서리를 크게 둥글게
- `bg-white` : 배경색 흰색
- `shadow-sm` : 작은 그림자

즉, Tailwind는 "스타일 한 줄"을 아주 작은 단위로 쪼개서 조립한다고 생각하면 이해가 쉽습니다.

## 2. `py-6 px-6 w-full max-w-3xl` 하나씩 해설

사용자가 질문하신 예시를 그대로 풀면:

### `py-6`
- `p` = padding
- `y` = y축, 즉 위아래
- `6` = Tailwind spacing scale 값

뜻:
- 위 padding 24px
- 아래 padding 24px

### `px-6`
- `p` = padding
- `x` = x축, 즉 좌우
- `6` = spacing 값

뜻:
- 왼쪽 padding 24px
- 오른쪽 padding 24px

### `w-full`
- `w` = width
- `full` = 100%

뜻:
- 부모가 허용하는 가로 너비를 꽉 채워라

### `max-w-3xl`
- `max-w` = max-width
- `3xl` = Tailwind에서 미리 정해둔 큰 너비 값

뜻:
- 아무리 넓어져도 최대 너비는 `3xl`까지만

보통 `w-full max-w-3xl`은 같이 많이 씁니다.

뜻을 자연어로 바꾸면:
- "작은 화면에서는 꽉 차게 쓰되"
- "큰 화면에서는 너무 넓어지지 않게 제한해라"

## 3. spacing 숫자는 무슨 뜻인가

Tailwind의 `1`, `2`, `3`, `4`, `5`, `6`, `8` 같은 숫자는 대충 아래처럼 생각하면 됩니다.

- `1` = 4px
- `2` = 8px
- `3` = 12px
- `4` = 16px
- `5` = 20px
- `6` = 24px
- `8` = 32px
- `10` = 40px

예:
- `p-4` = 전체 padding 16px
- `px-4` = 좌우 padding 16px
- `py-4` = 위아래 padding 16px
- `mt-6` = margin-top 24px

## 4. 자주 나오는 클래스 읽는 법

## 크기

### `w-full`
- 너비 100%

### `h-12`
- 높이 48px

### `min-h-screen`
- 최소 높이를 화면 전체 높이로

### `max-w-2xl`
- 최대 너비를 2xl까지만

### `max-w-3xl`
- 최대 너비를 3xl까지만

### `aspect-[4/3]`
- 가로세로 비율을 4:3으로 유지

## 여백

### `p-4`
- 모든 방향 padding 16px

### `px-4`
- 좌우 padding 16px

### `py-6`
- 위아래 padding 24px

### `mt-5`
- 위쪽 바깥 여백(margin-top) 20px

### `mb-8`
- 아래쪽 바깥 여백(margin-bottom) 32px

## 배경 / 글자색

### `bg-white`
- 배경 흰색

### `bg-[#fbfaf7]`
- 배경색을 직접 hex 코드로 지정

### `text-[#171717]`
- 글자색을 직접 지정

### `text-white`
- 글자 흰색

## 글자

### `text-sm`
- 작은 글자 크기

### `text-3xl`
- 큰 제목 글자 크기

### `font-bold`
- 굵게

### `font-black`
- 아주 굵게

### `leading-6`
- 줄 높이(line-height) 지정

### `tracking-normal`
- 글자 간격 기본값

## 둥글기 / 테두리 / 그림자

### `rounded-xl`
- 꽤 둥근 모서리

### `rounded-2xl`
- 더 둥근 모서리

### `border`
- 기본 테두리 1px

### `border-[#ece7dd]`
- 테두리 색 지정

### `shadow-sm`
- 작은 그림자

### `shadow-[0_24px_70px_rgba(55,45,30,0.12)]`
- 커스텀 그림자
- 이건 Tailwind 기본값이 아니라 직접 CSS 값을 넣은 형태

## 정렬

### `flex`
- Flexbox 사용

### `grid`
- Grid 사용

### `items-center`
- 세로축 중앙 정렬

### `justify-center`
- 가로축 중앙 정렬

### `justify-between`
- 양끝 배치

### `place-items-center`
- Grid에서 가로/세로 모두 중앙 정렬

## 기타

### `overflow-hidden`
- 넘치는 내용을 잘라냄

### `object-cover`
- 이미지가 박스를 꽉 채우게

### `break-all`
- 긴 문자열을 강제로 줄바꿈

### `break-keep`
- 한글 단어가 어색하게 잘리지 않도록 유지

### `transition`
- 스타일 변화가 부드럽게 바뀌도록

### `hover:bg-[#ffcc3d]`
- 마우스를 올렸을 때 배경색 변경

### `disabled:opacity-60`
- disabled 상태일 때 반투명하게

## 5. 반응형 클래스는 어떻게 읽나

예:

```tsx
className="px-4 sm:px-6 lg:px-10"
```

뜻:
- 기본: `px-4`
- 화면이 `sm` 이상이면: `px-6`
- 화면이 `lg` 이상이면: `px-10`

즉 Tailwind는 "앞에서 기본값을 주고, 큰 화면에서 덮어쓰기" 방식입니다.

### 자주 보이는 접두어

- `sm:` = 작은 태블릿 이상
- `md:` = 중간 화면 이상
- `lg:` = 큰 화면 이상

예:

```tsx
className="text-3xl sm:text-4xl"
```

뜻:
- 기본은 `text-3xl`
- `sm` 이상에서는 `text-4xl`

## 6. 이 프로젝트 실제 코드로 읽어보기

예시 1:

```tsx
<main className="min-h-screen bg-[#fbfaf7] px-4 py-6 text-[#171717] sm:px-6 sm:py-10">
```

해석:
- `min-h-screen` : 최소 높이는 화면 전체
- `bg-[#fbfaf7]` : 밝은 베이지 배경
- `px-4` : 좌우 안쪽 여백 16px
- `py-6` : 위아래 안쪽 여백 24px
- `text-[#171717]` : 기본 글자색 진한 회색
- `sm:px-6` : 작은 화면 이상이면 좌우 여백 24px
- `sm:py-10` : 작은 화면 이상이면 위아래 여백 40px

자연어로 바꾸면:
- "화면 전체 높이를 채우고"
- "밝은 배경을 깔고"
- "모바일에선 여백을 적당히 두고"
- "조금 더 큰 화면에서는 여백을 더 넉넉하게 준다"

예시 2:

```tsx
<section className="mx-auto w-full max-w-3xl rounded-[28px] border border-[#ece7dd] bg-white p-5 shadow-[0_24px_70px_rgba(55,45,30,0.12)] sm:p-8">
```

해석:
- `mx-auto` : 좌우 margin 자동, 즉 가운데 정렬
- `w-full` : 가능한 너비를 다 쓰기
- `max-w-3xl` : 하지만 너무 넓어지진 않게 제한
- `rounded-[28px]` : 모서리 28px 둥글게
- `border` : 테두리 1px
- `border-[#ece7dd]` : 연한 베이지 테두리
- `bg-white` : 배경 흰색
- `p-5` : 전체 padding 20px
- `shadow-[...]` : 그림자
- `sm:p-8` : 작은 화면 이상에서는 padding 32px

## 7. 가장 많이 쓰는 공식

처음에는 아래 묶음만 외워도 훨씬 편해집니다.

### 카드 박스 공식

```tsx
w-full max-w-3xl rounded-2xl bg-white border shadow-sm
```

뜻:
- 꽉 차되 너무 넓지 않게
- 흰 배경 카드
- 둥근 모서리
- 테두리와 그림자

### 여백 공식

```tsx
px-4 py-6 sm:px-6 sm:py-10
```

뜻:
- 모바일에서는 적당한 여백
- 큰 화면에서는 더 넉넉한 여백

### 중앙 정렬 공식

```tsx
flex items-center justify-center
```

뜻:
- Flexbox 사용
- 세로 가운데
- 가로 가운데

## 8. 처음 공부할 때 보는 법

클래스를 볼 때 한 번에 다 읽으려고 하지 말고, 순서대로 끊어서 보세요.

예:

```tsx
className="w-full max-w-3xl px-6 py-6 rounded-2xl bg-white"
```

이걸 이렇게 읽으면 됩니다.

1. 크기: `w-full max-w-3xl`
2. 여백: `px-6 py-6`
3. 모양: `rounded-2xl`
4. 색: `bg-white`

즉 "크기 -> 여백 -> 모양 -> 색 -> 정렬" 순서로 보면 덜 복잡합니다.

## 9. 추천 다음 단계

이 문서를 본 뒤에는 아래 파일을 같이 열어보면 좋습니다.

- [src/app/page.tsx](../src/app/page.tsx)
- [src/app/register/page.tsx](../src/app/register/page.tsx)
- [src/app/pet/[id]/page.tsx](../src/app/pet/[id]/page.tsx)

원하면 다음에는 제가
- 페이지 하나를 골라서 `className` 전부 줄마다 해설
- Flexbox / Grid만 따로 설명
- spacing scale만 따로 표로 정리
이렇게 더 쪼개서 이어서 정리해드릴 수 있습니다.
자주 보는 Tailwind 크기들을 px로 보면 이렇게 이해하시면 됩니다.

max-w-sm = 24rem = 384px
max-w-md = 28rem = 448px
max-w-lg = 32rem = 512px
max-w-xl = 36rem = 576px
max-w-2xl = 42rem = 672px
max-w-3xl = 48rem = 768px
max-w-4xl = 56rem = 896px
max-w-5xl = 64rem = 1024px
max-w-6xl = 72rem = 1152px
max-w-7xl = 80rem = 1280px
반응형 접두어는 보통 이렇게 봅니다.

sm: = 640px 이상
md: = 768px 이상
lg: = 1024px 이상
xl: = 1280px 이상
2xl: = 1536px 이상
