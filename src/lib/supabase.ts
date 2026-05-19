import { createClient } from '@supabase/supabase-js';

// 브라우저에서 읽기 전용 성격으로 사용할 Supabase 클라이언트입니다.
// 공개 키(`NEXT_PUBLIC_*`)를 사용하므로 민감한 관리자 작업에는 쓰면 안 됩니다.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);
