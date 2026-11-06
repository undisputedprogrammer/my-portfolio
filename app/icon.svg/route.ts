import { buildAccent } from '@/lib/palette-server';
export const dynamic='force-static';
export function GET(){return new Response(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0A0A0B"/><path d="M13 44V20l12 16 12-16v24M43 44l8-24" stroke="${buildAccent()}" fill="none" stroke-width="4"/></svg>`,{headers:{'Content-Type':'image/svg+xml'}});}
