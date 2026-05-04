import { createHash } from 'node:crypto';

export function hashPetPassword(password: string, registrationCode: string) {
  return createHash('sha256')
    .update(`${registrationCode}:${password}`)
    .digest('hex');
}
