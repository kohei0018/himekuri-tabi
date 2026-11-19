import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { parse } from 'yaml';
import { z } from 'astro/zod';
import { eventFileSchema, areaSchema } from './lib/schema';

const events = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './data/events' }),
  schema: eventFileSchema,
});

// getCollection は ID 順に並べ直すので、ファイルの順（＝同点のときの並び順）を order として持たせる
const areas = defineCollection({
  loader: file('data/areas.yaml', {
    parser: (text) => (parse(text) as Record<string, unknown>[]).map((a, order) => ({ ...a, order })),
  }),
  schema: areaSchema.extend({ order: z.number().int() }),
});

export const collections = { events, areas };
