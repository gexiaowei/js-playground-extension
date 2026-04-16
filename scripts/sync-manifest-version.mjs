import { readFile, writeFile } from 'node:fs/promises';

const packageJsonPath = new URL('../package.json', import.meta.url);
const manifestPath = new URL('../manifest.json', import.meta.url);

async function main() {
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const packageVersion = packageJson.version;

  if (!packageVersion) {
    throw new Error('package.json is missing a version field');
  }

  if (manifest.version === packageVersion) {
    console.log(`manifest.json already matches package.json version ${packageVersion}`);
    return;
  }

  manifest.version = packageVersion;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`Updated manifest.json version to ${packageVersion}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
