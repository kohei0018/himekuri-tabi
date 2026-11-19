// 検索結果 → HTML 文字列。イベント由来の文字列は必ず esc() を通す
import type { DateRange, DateStr, ResolvedEvent } from '../lib/types';
import type { Hit, SearchResult } from '../lib/search';
import type { Query } from '../lib/query';
import type { Shift } from '../lib/shift';
import { toSearchParams } from '../lib/query';
import { shiftLabel } from '../lib/shift';
import { eventScore } from '../lib/score';
import { distanceKm } from '../lib/geo';
import { hotelLink, statusLabel } from '../lib/links';
import { eachDay, monthRange, overlaps, weekday } from '../lib/day';
import { HOLIDAYS_2027 } from '../lib/holidays';

export type Extras = { shifts: Shift[]; crowded: DateStr[]; query: Query };

const WD = ['日', '月', '火', '水', '木', '金', '土'];
const UPCOMING_MAX = 10;

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

const md = (d: DateStr) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;
const rangeLabel = (r: DateRange) => (r.start === r.end ? `${md(r.start)}（${WD[weekday(r.start)]}）` : `${md(r.start)}〜${md(r.end)}`);
const href = (q: Query) => esc(`?${toSearchParams(q).toString()}`);

function badge(e: ResolvedEvent): string {
  const cls = e.status === 'confirmed' ? 'badge badge-confirmed' : 'badge badge-estimated';
  return `<span class="${cls}">${statusLabel(e.status)}</span>`;
}

function card(h: Hit, opts: { from?: { lat: number; lng: number }; crowded?: DateStr[] } = {}): string {
  const e = h.event;
  const isCrowded = (opts.crowded ?? []).some((d) => h.days.some((r) => d >= r.start && d <= r.end));
  const km = opts.from ? `約${Math.round(distanceKm(opts.from, e))}km` : '';
  const meta = [`${e.prefecture} ${e.city}`, km, e.attendance ? `動員 約${e.attendance.value.toLocaleString('ja-JP')}人（推計）` : '']
    .filter(Boolean)
    .join(' · ');
  return `<article class="card${isCrowded ? ' is-crowded' : ''}">
<div class="card-head"><span class="card-date">${h.days.map(rangeLabel).join('・')}</span>${badge(e)}</div>
<h3><a href="/events/${esc(e.id)}/">${esc(e.name)}</a></h3>
<p class="meta">${esc(meta)}</p>
${isCrowded ? '<span class="tag-crowd">宿が埋まりやすい日</span>' : ''}
<a class="btn btn-primary" href="${esc(hotelLink(e))}" rel="sponsored noopener">近くの宿を見る</a>
</article>`;
}

const empty = '<p class="empty">この時期のイベントはまだありません。</p>';

function shiftBox(s: Shift, q: Query): string {
  const names = s.added.map((h) => esc(h.event.name)).join('、');
  return `<div class="shift"><p><strong>${esc(shiftLabel(s))}</strong>、${names}も見られます。</p>
<a class="btn btn-outline" href="${href({ ...q, when: { kind: 'range', range: s.range } })}">この日程で探す</a></div>`;
}

function calendarMonth(month: string, hits: Hit[]): string {
  const m = monthRange(month);
  const blanks = '<div class="cal-blank"></div>'.repeat(weekday(m.start));
  const cells = eachDay(m)
    .map((day) => {
      const on = hits.filter((h) => h.days.some((r) => overlaps(r, { start: day, end: day })));
      on.sort((a, b) => eventScore(b.event) - eventScore(a.event));
      const chips = on
        .slice(0, 2)
        .map((h) => `<span class="chip ${h.event.status === 'confirmed' ? 'chip-confirmed' : 'chip-estimated'}">${esc(h.event.name)}</span>`)
        .join('');
      const more = on.length > 2 ? `<span class="chip-more">+${on.length - 2}件</span>` : '';
      const wd = weekday(day);
      const holiday = HOLIDAYS_2027[day];
      const cls = `cal-day wd-${wd}${holiday ? ' is-holiday' : ''}`;
      const label = `${Number(day.slice(5, 7))}月${Number(day.slice(8, 10))}日（${WD[wd]}${holiday ? `・${holiday}` : ''}）イベント${on.length}件`;
      return `<button type="button" class="${cls}" data-day="${day}" aria-label="${label}"><span class="cal-num">${Number(day.slice(8, 10))}</span>${chips}${more}</button>`;
    })
    .join('');
  const head = WD.map((w, i) => `<div class="cal-wd wd-${i}">${w}</div>`).join('');
  const [y, mo] = month.split('-').map(Number);
  return `<section class="cal" data-month="${month}"><h2>${y}年${mo}月</h2>
<div class="cal-grid">${head}${blanks}${cells}</div>
<div class="cal-detail" aria-live="polite"></div></section>`;
}

export function renderDay(day: DateStr, hits: Hit[]): string {
  const on = hits.filter((h) => h.days.some((r) => day >= r.start && day <= r.end));
  const title = `${Number(day.slice(5, 7))}月${Number(day.slice(8, 10))}日（${WD[weekday(day)]}）のイベント`;
  return `<h3 class="day-title">${title}</h3>${on.length ? on.map((h) => card(h)).join('') : '<p class="empty">この日に登録されているイベントはありません。</p>'}`;
}

export function renderResult(r: SearchResult, x: Extras): string {
  switch (r.mode) {
    case 'upcoming': {
      const hits = r.hits.slice(0, UPCOMING_MAX);
      return `<h2>これからのイベント</h2>${hits.length ? hits.map((h) => card(h)).join('') : empty}`;
    }
    case 'candidates': {
      if (!r.areas.length) return `<h2>行き先の候補</h2>${empty}`;
      const items = r.areas
        .map(({ area, hits }) => {
          const top = hits.slice(0, 3).map((h) => esc(h.event.name)).join('、');
          return `<a class="candidate" href="${href({ ...x.query, where: area.id })}"><span class="candidate-name">${esc(area.name)}</span><span class="candidate-count">${hits.length}件</span><span class="candidate-top">${top}</span></a>`;
        })
        .join('');
      return `<h2>行き先の候補</h2><div class="candidates">${items}</div>`;
    }
    case 'calendar':
      return `<h2>${esc(r.area.name)}の周辺</h2>${r.months.length ? r.months.map((m) => calendarMonth(m.month, m.hits)).join('') : empty}`;
    case 'overlap': {
      const shifts = x.shifts.map((s) => shiftBox(s, x.query)).join('');
      const list = r.hits.length ? r.hits.map((h) => card(h, { from: r.area, crowded: x.crowded })).join('') : empty;
      return `${shifts}<h2>かぶるイベント <span class="count">${r.hits.length}件</span></h2>${list}`;
    }
  }
}
