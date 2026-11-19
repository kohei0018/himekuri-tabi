import type { ResolvedEvent } from './types';

// おまけ度（設計書 4.5）。値はここだけで変える
export function eventScore(e: Pick<ResolvedEvent, 'kind' | 'attendance'>): number {
  if (e.kind !== 'event') return 1;
  const v = e.attendance?.value ?? 0;
  if (v >= 1000000) return 3;
  if (v >= 100000) return 2;
  if (v >= 10000) return 1;
  return 0;
}

export function passesSize(e: Pick<ResolvedEvent, 'attendance'>, size: number): boolean {
  return !e.attendance || e.attendance.value >= size;
}
