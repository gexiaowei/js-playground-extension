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
  'scripts'
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

async function stageExtensionFiles() {
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
}

async function ensurePrivateKey() {
  await mkdir(keyDir, { recursive: true });

  if (await pathExists(keyPath)) {
    return;
  }

  console.log(`Generating private key at ${path.relative(rootDir, keyPath)}`);
  await run('pnpm', ['exec', 'crx', 'keygen', keyDir]);
}

async function buildCrx() {
  await mkdir(distDir, { recursive: true });
  await stageExtensionFiles();
  await ensurePrivateKey();

  console.log(`Packing extension from ${path.relative(rootDir, stageDir)}`);

  const privateKey = await readFile(keyPath);
  const extension = new ChromeExtension({
    privateKey,
    rootDirectory: stageDir,
    version: 3
  });

  await extension.load();
  const zipBuffer = await extension.loadContents();
  const crxBuffer = await extension.pack(zipBuffer);

  await writeFile(zipOutputPath, zipBuffer);
  await writeFile(crxOutputPath, crxBuffer);

  console.log(`Created ${path.relative(rootDir, crxOutputPath)}`);
  console.log(`Created ${path.relative(rootDir, zipOutputPath)}`);
}

buildCrx().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
