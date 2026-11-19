// トップページのブラウザ側。URL ⇄ フォーム ⇄ 結果を同期する
import type { Area, DateStr, ResolvedEvent } from '../lib/types';
import type { Hit, SearchResult } from '../lib/search';
import { parseQuery, toSearchParams, type Query } from '../lib/query';
import { search, eventsNear } from '../lib/search';
import { suggestShifts } from '../lib/shift';
import { crowdedDays } from '../lib/crowd';
import { passesSize } from '../lib/score';
import { renderResult, renderDay } from './render';

type Site = { year: number; areas: Area[]; events: ResolvedEvent[] };

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function today(): DateStr {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formParams(): URLSearchParams {
  const when = $<HTMLSelectElement>('when').value;
  const from = $<HTMLInputElement>('from').value;
  const to = $<HTMLInputElement>('to').value;
  const p = new URLSearchParams();
  if (when === 'range') {
    if (from && to) p.set('when', `${from}..${to}`);
  } else if (when) p.set('when', when);
  const where = $<HTMLSelectElement>('where').value;
  if (where) p.set('where', where);
  const pressed = document.querySelector<HTMLButtonElement>('.size[aria-pressed="true"]');
  if (pressed) p.set('size', pressed.dataset.size!);
  return p;
}

function queryToForm(q: Query): void {
  const when = $<HTMLSelectElement>('when');
  const rangeFields = $('range-fields');
  if (q.when?.kind === 'range') {
    when.value = 'range';
    $<HTMLInputElement>('from').value = q.when.range.start;
    $<HTMLInputElement>('to').value = q.when.range.end;
  } else {
    when.value = q.when?.month ?? '';
    // データのない月が URL で来たときは選択肢に足す
    if (q.when && when.value !== q.when.month) {
      when.add(new Option(q.when.month, q.when.month), when.options.length - 1);
      when.value = q.when.month;
    }
  }
  rangeFields.hidden = when.value !== 'range';
  $<HTMLSelectElement>('where').value = q.where ?? '';
  for (const b of document.querySelectorAll<HTMLButtonElement>('.size')) {
    b.setAttribute('aria-pressed', String(Number(b.dataset.size) === q.size));
  }
}

export async function start(): Promise<void> {
  const result = $('result');
  let site: Site;
  try {
    const res = await fetch('/data/events.json');
    site = (await res.json()) as Site;
  } catch {
    result.innerHTML = '<p class="empty">データを読み込めませんでした。時間をおいて開き直してください。</p>';
    return;
  }
  const ids = site.areas.map((a) => a.id);
  let last: SearchResult | null = null;

  const draw = (q: Query) => {
    queryToForm(q);
    const r = search(q, site.events, site.areas, today());
    last = r;
    let shifts: ReturnType<typeof suggestShifts> = [];
    let crowded: DateStr[] = [];
    if (r.mode === 'overlap') {
      const pool = eventsNear(r.area, site.events).filter((e) => passesSize(e, q.size));
      shifts = suggestShifts(r.period, pool);
      crowded = crowdedDays(r.period, pool);
    }
    result.innerHTML = renderResult(r, { shifts, crowded, query: q });
  };

  const go = (q: Query, push: boolean) => {
    const s = toSearchParams(q).toString();
    const url = s ? `?${s}` : location.pathname;
    if (push) history.pushState(null, '', url);
    else history.replaceState(null, '', url);
    draw(q);
  };

  const fromForm = () => parseQuery(formParams(), ids);

  $<HTMLFormElement>('search').addEventListener('submit', (ev) => {
    ev.preventDefault();
    go(fromForm(), true);
  });
  $<HTMLFormElement>('search').addEventListener('change', () => {
    $('range-fields').hidden = $<HTMLSelectElement>('when').value !== 'range';
    go(fromForm(), false);
  });
  for (const b of document.querySelectorAll<HTMLButtonElement>('.size')) {
    b.addEventListener('click', () => {
      for (const o of document.querySelectorAll('.size')) o.setAttribute('aria-pressed', String(o === b));
      go(fromForm(), false);
    });
  }

  // 結果の中のリンク（?…）はページを読み直さずに切り替える。カレンダーの日付はその日の一覧を出す
  result.addEventListener('click', (ev) => {
    const target = ev.target as HTMLElement;
    const a = target.closest<HTMLAnchorElement>('a[href^="?"]');
    if (a) {
      ev.preventDefault();
      go(parseQuery(new URLSearchParams(a.getAttribute('href')!.slice(1)), ids), true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const day = target.closest<HTMLButtonElement>('.cal-day');
    if (day && last?.mode === 'calendar') {
      const section = day.closest<HTMLElement>('.cal')!;
      const month = last.months.find((m) => m.month === section.dataset.month);
      const hits: Hit[] = month?.hits ?? [];
      for (const b of section.querySelectorAll('.cal-day')) b.classList.toggle('is-selected', b === day);
      section.querySelector('.cal-detail')!.innerHTML = renderDay(day.dataset.day!, hits);
    }
  });

  window.addEventListener('popstate', () => draw(parseQuery(new URLSearchParams(location.search), ids)));
  draw(parseQuery(new URLSearchParams(location.search), ids));
}
