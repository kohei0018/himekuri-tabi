import { parseQuery, type Query } from '../lib/query';

export type FormFields = { when: string; from: string; to: string; where: string; size: string };

// フォームの値 → Query。「日にちを指定する」で日付がまだ揃っていない（または逆順の）ときは null（入力途中なのでフォームを触らない）
export function formQuery(f: FormFields, areaIds: string[]): Query | null {
  const p = new URLSearchParams();
  if (f.when === 'range') {
    if (!f.from || !f.to || f.from > f.to) return null;
    p.set('when', `${f.from}..${f.to}`);
  } else if (f.when) p.set('when', f.when);
  if (f.where) p.set('where', f.where);
  if (f.size) p.set('size', f.size);
  return parseQuery(p, areaIds);
}
