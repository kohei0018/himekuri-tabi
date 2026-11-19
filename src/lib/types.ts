import type { z } from 'astro/zod';
import type { eventFileSchema, areaSchema, ruleSchema, occurrenceSchema, bloomSchema, statusSchema } from './schema';

export type DateStr = string; // 'YYYY-MM-DD'
export type DateRange = { start: DateStr; end: DateStr };
export type Rule = z.infer<typeof ruleSchema>;
export type Status = z.infer<typeof statusSchema>;
export type Occurrence = z.infer<typeof occurrenceSchema>;
export type BloomInfo = z.infer<typeof bloomSchema>;
export type EventFile = z.infer<typeof eventFileSchema>;
export type Area = z.infer<typeof areaSchema>;

export type ResolvedEvent = Omit<EventFile, 'rules' | 'occurrences' | 'bloom'> & {
  dates: DateRange[];
  status: Status;
  ruleText?: string;
  sourceUrl?: string;
  forecastUrl?: string;
};
