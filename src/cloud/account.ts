// 用户名 → 假邮箱（@fcl.local，与 idle-arpg 的 @anye-game.local 区分，同名也是两个账号）
export const ACCT_DOMAIN = 'fcl.local';
export function normUsername(u: string) { return u.trim().toLowerCase(); }
export function validUsername(u: string): string | null {
  const n = normUsername(u);
  if (n.length < 2 || n.length > 16) return '用户名 2–16 个字符';
  if (!/^[\p{Script=Han}a-z0-9_]+$/u.test(n)) return '用户名只能用中文、英文、数字、下划线';
  return null;
}
export function validPassword(p: string): string | null { return p.length < 8 ? '密码至少 8 位' : p.length > 72 ? '密码最多 72 位' : null; }
export function usernameToEmail(u: string) {
  const hex = [...new TextEncoder().encode(normUsername(u))].map(b => b.toString(16).padStart(2, '0')).join('');
  return `u${hex}@${ACCT_DOMAIN}`;
}
export function emailToUsername(e: string): string | null {
  const m = /^u([0-9a-f]+)@fcl\.local$/.exec(e); if (!m) return null;
  try { return new TextDecoder().decode(new Uint8Array(m[1].match(/../g)!.map(h => parseInt(h, 16)))); } catch { return null; }
}
