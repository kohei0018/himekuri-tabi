import type { APIRoute } from 'astro';
import { loadSite } from '../../lib/collections';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(await loadSite()), { headers: { 'Content-Type': 'application/json' } });
};
