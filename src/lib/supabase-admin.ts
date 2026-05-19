import { createClient } from '@supabase/supabase-js';

// 서버 전용 관리자 클라이언트입니다.
// service role key는 강한 권한을 가지므로 절대 클라이언트 컴포넌트에서 사용하면 안 됩니다.
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin environment variables are missing.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // API 라우트는 요청마다 짧게 실행되므로 세션 유지 기능이 필요 없습니다.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
