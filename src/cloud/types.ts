import type { SaveData } from '../combat/World';
/** 云端一行存档（fcl.save_slots）；data 为 SaveData 原样，不改格式 */
export interface CloudRow { slot: number; data: SaveData; updated_at: string; cls?: string; level?: number; floor?: number; play_ms?: number; client_at?: string | null }
export interface CloudSession { userId: string; username: string }
export type PutResult = { ok: true; at: string } | { ok: false; conflict: true };
/** 云端接口：真实实现见 supabaseApi.ts，测试用 mock 注入。网络失败一律 throw */
export interface CloudApi {
  restore(): Promise<CloudSession | null>;
  signIn(username: string, password: string): Promise<CloudSession>;
  signUp(username: string, password: string): Promise<CloudSession>;
  signOut(): Promise<void>;
  list(): Promise<CloudRow[]>;
  /** expected=null 表示新插入（已存在即冲突）；否则按 updated_at 乐观锁更新，0 行受影响即冲突 */
  put(slot: number, data: SaveData, expected: string | null, meta: { playMs: number; clientAt: number | null }): Promise<PutResult>;
  /** 关页时 keepalive 发送，无法得知结果；body 过大返回 false */
  beacon(slot: number, data: SaveData, expected: string): boolean;
}
/** 本地存档适配（settings.ts 的 Slots），本地始终是主版本 */
export interface LocalSlots {
  count(): number; setCount(n: number): number; active(): number;
  read(i: number): SaveData | null; write(i: number, d: SaveData): void;
  playMs(i: number): number; lastAt(i: number): number | null;
}
export interface KV { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void; key?(i: number): string | null; readonly length?: number }
