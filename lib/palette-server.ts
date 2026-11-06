import { readFileSync } from 'node:fs';
import { join } from 'node:path';
export function buildAccent(){const css=readFileSync(join(process.cwd(),'app/globals.css'),'utf8');const match=css.match(/--accent:\s*(#[0-9a-f]{6})/i);if(!match)throw new Error('Missing accent token');return match[1];}
