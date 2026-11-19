import { getCollection } from 'astro:content';
import { toResolved } from './resolve';
import { TARGET_YEAR } from '../config';
import type { Area, ResolvedEvent } from './types';

// ビルド時だけ使う。ページとエンドポイントで同じ結果を共有する
export async function loadSite(): Promise<{ year: number; areas: Area[]; events: ResolvedEvent[] }> {
  const [events, areas] = await Promise.all([getCollection('events'), getCollection('areas')]);
  return {
    year: TARGET_YEAR,
    areas: areas
      .map((a) => a.data)
      .sort((a, b) => a.order - b.order)
      .map(({ order: _order, ...a }) => a),
    events: toResolved(events.map((e) => e.data), TARGET_YEAR),
  };
}
