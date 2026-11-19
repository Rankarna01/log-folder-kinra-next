/**
 * Generator kata sandi acak untuk akun mentor. Memakai Web Crypto, jadi bisa
 * dipakai di browser maupun di server. Selalu memuat huruf kecil, besar, angka,
 * dan simbol.
 */
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGIT = '23456789';
const SYMBOL = '!@#$%&*';

function randomInt(max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}

export function generatePassword(length = 12): string {
  const all = LOWER + UPPER + DIGIT + SYMBOL;
  const chars = [LOWER, UPPER, DIGIT, SYMBOL].map((set) => set[randomInt(set.length)]);
  while (chars.length < length) chars.push(all[randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export const MIN_PASSWORD_LENGTH = 8;
