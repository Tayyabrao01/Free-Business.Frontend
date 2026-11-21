const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  'stream-chat-react-native',
  'src',
  'optionalDependencies',
  'getPhotos.ts'
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

const source = fs.readFileSync(target, 'utf8');
const start = 'export const getPhotos = CameraRollDependency\n  ? async ({ after, first }): Promise<ReturnType> => {';
const end = '      }\n    }\n  : null;';

if (source.includes('  ? (async ({ after, first }): Promise<ReturnType> => {')) {
  process.exit(0);
}

if (!source.includes(start) || !source.includes(end)) {
  throw new Error(`Could not apply Stream getPhotos TypeScript syntax patch: ${target}`);
}

const patched = source
  .replace(start, 'export const getPhotos = CameraRollDependency\n  ? (async ({ after, first }): Promise<ReturnType> => {')
  .replace(end, '      }\n    })\n  : null;');

fs.writeFileSync(target, patched, 'utf8');
console.log('Patched stream-chat-react-native getPhotos.ts TypeScript syntax');
