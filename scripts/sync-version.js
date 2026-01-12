#!/usr/bin/env node

/**
 * Sync Version Script
 * Synchronizes the version from package.json to tauri.conf.json
 *
 * Usage:
 *   node scripts/sync-version.js
 *
 * Can also be used as a pre-build hook or in CI/CD pipelines.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Read package.json
const packageJsonPath = join(rootDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;

// Read tauri.conf.json
const tauriConfigPath = join(rootDir, 'src-tauri', 'tauri.conf.json');
const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, 'utf-8'));

// Check if version changed
if (tauriConfig.version === version) {
  console.log(`Version already in sync: ${version}`);
  process.exit(0);
}

const oldVersion = tauriConfig.version;

// Update version
tauriConfig.version = version;

// Write back
writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2) + '\n');

console.log(`Version synced: ${oldVersion} → ${version}`);
console.log(`  package.json: ${version}`);
console.log(`  tauri.conf.json: ${version}`);
