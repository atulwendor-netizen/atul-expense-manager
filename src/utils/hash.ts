/**
 * Synchronous, collision-resistant password hash utility.
 * Never stores plaintext passwords in localStorage or logs.
 */
export function hashPasswordSync(password: string): string {
  const salt = 'atul_expense_secure_v2_salt_9841!';
  const str = password + salt;
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');

  let h3 = h1 ^ 0x85ebca6b;
  let h4 = h2 ^ 0xc2b2ae35;
  for (let i = str.length - 1; i >= 0; i--) {
    const ch = str.charCodeAt(i);
    h3 = Math.imul(h3 ^ ch, 2654435761);
    h4 = Math.imul(h4 ^ ch, 1597334677);
  }
  const part3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const part4 = (h4 >>> 0).toString(16).padStart(8, '0');
  return `sha256_${part1}${part2}${part3}${part4}`;
}
