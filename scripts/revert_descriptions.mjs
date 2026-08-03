import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, '..', 'assets', 'gallery-data.js');

let source = readFileSync(DATA_FILE, 'utf8');
const re = /(\{ file: "[^"]+", alt: "[^"]*"), desc: "[^"]*"(\s*\})/g;
source = source.replace(re, '$1$2');
const re2 = /(\{ file: "[^"]+"), desc: "[^"]*"(,\s*alt: "[^"]*"\s*\})/g;
source = source.replace(re2, '$1$2');
writeFileSync(DATA_FILE, source, 'utf8');
console.log('✅ All desc fields cleared.');
