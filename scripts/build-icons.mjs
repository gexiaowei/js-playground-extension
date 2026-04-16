import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const rootDir = process.cwd();
const iconsDir = path.join(rootDir, 'icons');
const svgPath = path.join(iconsDir, 'logo.svg');
const iconSizes = [16, 32, 48, 96, 128];

async function buildIcons() {
  await mkdir(iconsDir, { recursive: true });

  const svg = await readFile(svgPath, 'utf8');

  for (const size of iconSizes) {
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: size
      }
    });

    const pngData = resvg.render().asPng();
    const outputPath = path.join(iconsDir, `logo-${size}.png`);
    await writeFile(outputPath, pngData);
    console.log(`Created ${path.relative(rootDir, outputPath)}`);
  }
}

buildIcons().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
