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

// Read Cargo.toml
const cargoTomlPath = join(rootDir, 'src-tauri', 'Cargo.toml');
let cargoToml = readFileSync(cargoTomlPath, 'utf-8');

// Check if versions are already in sync
const tauriInSync = tauriConfig.version === version;
const cargoVersionMatch = cargoToml.match(/^version = "(.+)"$/m);
const cargoInSync = cargoVersionMatch && cargoVersionMatch[1] === version;

if (tauriInSync && cargoInSync) {
  console.log(`Version already in sync: ${version}`);
  process.exit(0);
}

const oldTauriVersion = tauriConfig.version;
const oldCargoVersion = cargoVersionMatch ? cargoVersionMatch[1] : 'unknown';

// Update tauri.conf.json
tauriConfig.version = version;
writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2) + '\n');

// Update Cargo.toml
cargoToml = cargoToml.replace(/^version = ".*"$/m, `version = "${version}"`);
writeFileSync(cargoTomlPath, cargoToml);

console.log(`Version synced: ${oldTauriVersion} → ${version}`);
console.log(`  package.json: ${version}`);
console.log(`  tauri.conf.json: ${version}`);
console.log(`  Cargo.toml: ${version}`);
