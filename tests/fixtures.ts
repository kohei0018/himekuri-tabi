import type { Area, ResolvedEvent, DateRange } from '../src/lib/types';

export const areas: Area[] = [
  { id: 'kyoto', name: '京都市', prefecture: '京都府', lat: 35.0116, lng: 135.7681 },
  { id: 'arashiyama', name: '嵐山・嵯峨野', prefecture: '京都府', lat: 35.0094, lng: 135.6668 },
  { id: 'osaka', name: '大阪市', prefecture: '大阪府', lat: 34.6937, lng: 135.5023 },
  { id: 'sapporo', name: '札幌', prefecture: '北海道', lat: 43.0621, lng: 141.3544 },
];

let n = 0;
export function ev(p: Partial<ResolvedEvent> & { dates: DateRange[] }): ResolvedEvent {
  n++;
  return {
    id: `ev-${n}`,
    name: `イベント${n}`,
    kind: 'event',
    genre: ['祭り'],
    country: 'JP',
    region: 'domestic',
    prefecture: '京都府',
    city: '京都市',
    lat: 35.0116,
    lng: 135.7681,
    nearest: { city: '京都市' },
    summary: 's',
    official_url: 'https://x.org',
    status: 'estimated',
    attendance: { value: 30000, basis: '主催者発表', source_url: 'https://x.org' },
    ...p,
  };
}

export const d = (start: string, end = start): DateRange => ({ start, end });
