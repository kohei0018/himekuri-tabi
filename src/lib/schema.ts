import { z } from 'astro/zod';

// 実在する日付だけを通す（2027-04-31 や 13-45 のような入力ミスをビルドで止める）
const realDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
};
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(realDate, { message: '存在しない日付' });
const mmdd = z.string().regex(/^\d{2}-\d{2}$/).refine((s) => realDate(`2028-${s}`), { message: '存在しない月日' });
const url = z.url();

export const dateRangeSchema = z
  .object({ start: dateStr, end: dateStr })
  .refine((r) => r.start <= r.end, { message: 'end は start 以降にする' });

const length = z.number().int().min(1).optional();

export const ruleSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('fixed'), month: z.number().int().min(1).max(12), day: z.number().int().min(1).max(31), length }),
  z.object({
    type: z.literal('nth_weekday'),
    month: z.number().int().min(1).max(12),
    weekday: z.number().int().min(0).max(6),
    n: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(-1)]),
    length,
  }),
  z.object({ type: z.literal('holiday_relative'), holiday: z.string().min(1), offset: z.number().int(), length }),
  z.object({ type: z.literal('manual') }),
]);

export const statusSchema = z.enum(['confirmed', 'estimated', 'normal']);

export const occurrenceSchema = z
  .object({
    year: z.number().int(),
    status: statusSchema,
    dates: z.array(dateRangeSchema).min(1).optional(),
    source_url: url.optional(),
    note: z.string().optional(),
  })
  .superRefine((o, ctx) => {
    if (o.status === 'confirmed' && (!o.dates || !o.source_url)) {
      ctx.addIssue({ code: 'custom', message: 'confirmed には dates と source_url が必須' });
    }
    if (o.dates?.some((r) => !r.start.startsWith(`${o.year}-`))) {
      ctx.addIssue({ code: 'custom', message: 'dates の年が year と違う' });
    }
  });

export const bloomSchema = z.object({
  station: z.string().min(1),
  flowering: mmdd,
  full_bloom: mmdd,
  forecast_url: url,
});

export const attendanceSchema = z.object({
  value: z.number().int().positive(),
  basis: z.string().min(1),
  source_url: url,
});

export const eventFileSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    name: z.string().min(1),
    kind: z.enum(['event', 'bloom', 'exhibition']),
    genre: z.array(z.string().min(1)).min(1),
    country: z.string().length(2),
    region: z.enum(['domestic', 'overseas']),
    prefecture: z.string().min(1),
    city: z.string().min(1),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    nearest: z.object({ city: z.string().min(1), airport: z.string().optional() }),
    summary: z.string().min(1),
    official_url: url,
    attendance: attendanceSchema.optional(),
    rules: z.array(ruleSchema).min(1).optional(),
    bloom: bloomSchema.optional(),
    occurrences: z.array(occurrenceSchema).min(1),
  })
  .superRefine((e, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (e.kind === 'event' && !e.attendance) issue('event には attendance が必須');
    if (e.kind !== 'event' && e.attendance) issue('bloom と exhibition には attendance を持たせない');
    if (e.kind === 'bloom' && !e.bloom) issue('bloom には bloom（平年値）が必須');
    if (e.kind !== 'bloom' && !e.rules) issue('bloom 以外には rules が必須');
    const onlyManual = (e.rules ?? []).every((r) => r.type === 'manual');
    if (e.rules && onlyManual && e.occurrences.some((o) => !o.dates)) issue('manual だけのときは occurrences に dates が必須');
  });

export const areaSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().min(1),
  prefecture: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
});
