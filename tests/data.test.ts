import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parse } from 'yaml';
import { eventFileSchema, areaSchema } from '../src/lib/schema';

const dir = join(__dirname, '..', 'data', 'events');
const files = readdirSync(dir).filter((f) => f.endsWith('.yaml'));

test('there are event files', () => expect(files.length).toBeGreaterThan(0));

test.each(files)('%s passes the schema and its id matches the file name', (f) => {
  const data = parse(readFileSync(join(dir, f), 'utf8'));
  const r = eventFileSchema.safeParse(data);
  expect(r.success ? '' : JSON.stringify(r.error.issues)).toBe('');
  expect(data.id).toBe(basename(f, '.yaml'));
});

test('areas pass the schema and ids are unique', () => {
  const areas = parse(readFileSync(join(__dirname, '..', 'data', 'areas.yaml'), 'utf8')) as unknown[];
  for (const a of areas) expect(areaSchema.safeParse(a).success).toBe(true);
  const ids = areas.map((a) => (a as { id: string }).id);
  expect(new Set(ids).size).toBe(ids.length);
});
