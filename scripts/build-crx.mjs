import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ChromeExtension = require('crx');

const rootDir = process.cwd();
const buildDir = path.join(rootDir, '.build');
const stageDir = path.join(buildDir, 'chrome-extension');
const distDir = path.join(rootDir, 'dist');
const keyDir = path.join(rootDir, '.keys');
const keyPath = path.join(keyDir, 'key.pem');

const extensionSlug = 'javascript-playground';
const crxOutputPath = path.join(distDir, `${extensionSlug}.crx`);
const zipOutputPath = path.join(distDir, `${extensionSlug}.zip`);
const zipStoreOutputPath = path.join(distDir, `${extensionSlug}-store.zip`);
const updatesOutputPath = path.join(distDir, 'updates.xml');

const excludedEntries = new Set([
  '.DS_Store',
  '.build',
  '.git',
  '.keys',
  'create-icons.html',
  'download-beautify.sh',
  'download-codemirror.sh',
  'dist',
  'node_modules',
  'package.json',
  'pnpm-lock.yaml',
  'README.md',
  'scripts',
  'manifest.json',
  'manifest.selfhosted.json'
]);

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit'
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });

    child.on('error', reject);
  });
}

async function stageExtensionFiles(manifestSourceBasename) {
  await rm(buildDir, { recursive: true, force: true });
  await mkdir(stageDir, { recursive: true });

  const entries = await readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    if (excludedEntries.has(entry.name)) {
      continue;
    }

    const sourcePath = path.join(rootDir, entry.name);
    const destinationPath = path.join(stageDir, entry.name);
    await cp(sourcePath, destinationPath, { recursive: true });
  }

  const manifestSourcePath = path.join(rootDir, manifestSourceBasename);
  const manifestDestPath = path.join(stageDir, 'manifest.json');
  const manifestContent = await readFile(manifestSourcePath, 'utf8');
  await writeFile(manifestDestPath, manifestContent);
}

async function ensurePrivateKey() {
  await mkdir(keyDir, { recursive: true });

  if (await pathExists(keyPath)) {
    return;
  }

  if (process.env.CI) {
    throw new Error(`Missing private key at ${path.relative(rootDir, keyPath)}. Set CHROME_EXTENSION_PRIVATE_KEY_B64 in GitHub Actions secrets.`);
  }

  console.log(`Generating private key at ${path.relative(rootDir, keyPath)}`);
  await run('pnpm', ['exec', 'crx', 'keygen', keyDir]);
}

function getRepositorySlug(packageJson) {
  const repository = typeof packageJson.repository === 'string'
    ? packageJson.repository
    : packageJson.repository?.url;

  if (!repository) {
    throw new Error('package.json is missing repository.url');
  }

  const sshMatch = repository.match(/github\.com:([^/]+\/[^/.]+)(?:\.git)?$/);
  if (sshMatch) {
    return sshMatch[1];
  }

  const httpsMatch = repository.match(/github\.com\/([^/]+\/[^/.]+)(?:\.git)?$/);
  if (httpsMatch) {
    return httpsMatch[1];
  }

  throw new Error(`Unsupported GitHub repository URL: ${repository}`);
}

function getReleaseTag(version) {
  return process.env.GITHUB_REF_NAME || `v${version}`;
}

async function writeUpdateManifest(extension) {
  const packageJson = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'));
  const repositorySlug = process.env.GITHUB_REPOSITORY || getRepositorySlug(packageJson);
  const tagName = getReleaseTag(extension.manifest.version);

  extension.codebase = `https://github.com/${repositorySlug}/releases/download/${tagName}/${extensionSlug}.crx`;
  const updateXml = extension.generateUpdateXML();
  await writeFile(updatesOutputPath, updateXml);
  console.log(`Created ${path.relative(rootDir, updatesOutputPath)}`);
}

async function buildCrx() {
  await mkdir(distDir, { recursive: true });
  await run('pnpm', ['build:icons']);
  await ensurePrivateKey();

  const privateKey = await readFile(keyPath);

  await stageExtensionFiles('manifest.json');
  console.log(`Packing store zip from ${path.relative(rootDir, stageDir)} (manifest.json)`);

  let extension = new ChromeExtension({
    privateKey,
    rootDirectory: stageDir,
    version: 3
  });

  await extension.load();
  let zipBuffer = await extension.loadContents();
  await writeFile(zipStoreOutputPath, zipBuffer);
  console.log(`Created ${path.relative(rootDir, zipStoreOutputPath)}`);

  await stageExtensionFiles('manifest.selfhosted.json');
  console.log(`Packing self-hosted .crx / .zip from ${path.relative(rootDir, stageDir)} (manifest.selfhosted.json)`);

  extension = new ChromeExtension({
    privateKey,
    rootDirectory: stageDir,
    version: 3
  });

  await extension.load();
  zipBuffer = await extension.loadContents();
  const crxBuffer = await extension.pack(zipBuffer);
  await writeUpdateManifest(extension);

  await writeFile(zipOutputPath, zipBuffer);
  await writeFile(crxOutputPath, crxBuffer);

  console.log(`Created ${path.relative(rootDir, crxOutputPath)}`);
  console.log(`Created ${path.relative(rootDir, zipOutputPath)}`);
}

buildCrx().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
