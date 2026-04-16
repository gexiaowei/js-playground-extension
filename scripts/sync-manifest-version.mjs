import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageJsonPath = new URL('../package.json', import.meta.url);
const manifestPaths = [
  new URL('../manifest.json', import.meta.url),
  new URL('../manifest.selfhosted.json', import.meta.url)
];

async function main() {
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const packageVersion = packageJson.version;

  if (!packageVersion) {
    throw new Error('package.json is missing a version field');
  }

  for (const manifestPath of manifestPaths) {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

    const label = path.basename(fileURLToPath(manifestPath));

    if (manifest.version === packageVersion) {
      console.log(`${label} already matches package.json version ${packageVersion}`);
      continue;
    }

    manifest.version = packageVersion;
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    console.log(`Updated ${label} version to ${packageVersion}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
