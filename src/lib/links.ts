import type { Area, ResolvedEvent, Status } from './types';
import { distanceKm } from './geo';
import { RAKUTEN_AFFILIATE_ID } from '../config';

export function nearestArea(e: Pick<ResolvedEvent, 'lat' | 'lng'>, areas: Area[]): Area | undefined {
  return [...areas].sort((a, b) => distanceKm(a, e) - distanceKm(b, e))[0];
}

// 「このイベントがある時期で探す」。ページ内リンクは相対パス
export function searchLinkFor(e: ResolvedEvent, areas: Area[]): string {
  const p = new URLSearchParams({ when: e.dates[0].start.slice(0, 7) });
  const a = nearestArea(e, areas);
  if (a) p.set('where', a.id);
  return `/?${p.toString()}`;
}

export function affiliateWrap(url: string, id: string): string {
  return id ? `https://hb.afl.rakuten.co.jp/hgc/${id}/?pc=${encodeURIComponent(url)}` : url;
}

// 楽天トラベルのキーワード検索（市区町村名）。日付のパラメータは形式を確認してから足す
export function hotelLink(e: Pick<ResolvedEvent, 'nearest' | 'city'>): string {
  const url = `https://kw.travel.rakuten.co.jp/keyword/Search.do?f_keyword=${encodeURIComponent(e.nearest.city || e.city)}`;
  return affiliateWrap(url, RAKUTEN_AFFILIATE_ID);
}

const LABELS: Record<Status, '確定' | '推定' | '平年値'> = { confirmed: '確定', estimated: '推定', normal: '平年値' };
export const statusLabel = (s: Status) => LABELS[s];
