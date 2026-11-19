import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { eventFileSchema, areaSchema } from './lib/schema';

const events = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './data/events' }),
  schema: eventFileSchema,
});

const areas = defineCollection({
  loader: file('data/areas.yaml'),
  schema: areaSchema,
});

export const collections = { events, areas };
