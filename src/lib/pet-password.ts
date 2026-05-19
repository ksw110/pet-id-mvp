import { createHash } from 'node:crypto';

// 비밀번호를 그대로 저장하지 않고, 등록코드와 함께 섞어서 해시 문자열로 바꿉니다.
// 이렇게 하면 DB가 노출되더라도 원래 비밀번호를 바로 알기 어렵습니다.
export function hashPetPassword(password: string, registrationCode: string) {
  return createHash('sha256')
    .update(`${registrationCode}:${password}`)
    .digest('hex');
}
