#!/usr/bin/env node

/**
 * Release Script for Canopy
 * Creates a build tag in format: v2026.01.12-1430
 *
 * Usage:
 *   node scripts/release.js
 *   npm run release
 */

import { execSync } from 'child_process';
import { createInterface } from 'readline';

function exec(cmd) {
  return execSync(cmd, { encoding: 'utf-8' }).trim();
}

function execSilent(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch {
    return '';
  }
}

async function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
}

async function main() {
  // Sync version
  console.log('Syncing version...');
  exec('node scripts/sync-version.js');

  // Generate tag from current date and time
  const now = new Date();
  const tag = `v${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

  console.log(`Creating release tag: ${tag}`);

  // Check for uncommitted changes
  const status = execSilent('git status --porcelain');
  if (status) {
    console.log('Warning: You have uncommitted changes.');
    const answer = await prompt('Continue anyway? (y/N) ');
    if (answer !== 'y') {
      console.log('Aborted.');
      process.exit(1);
    }
  }

  // Create the tag
  exec(`git tag "${tag}"`);
  console.log(`Tag ${tag} created locally.`);

  // Ask to push
  const pushAnswer = await prompt('Push tag to origin? (Y/n) ');
  if (pushAnswer !== 'n') {
    exec(`git push origin "${tag}"`);
    console.log('Tag pushed. GitHub Action will now build the release.');

    const remoteUrl = execSilent('git remote get-url origin');
    const repoMatch = remoteUrl.match(/github\.com[:/](.+?)(\.git)?$/);
    if (repoMatch) {
      console.log(`Check: https://github.com/${repoMatch[1]}/actions`);
    }
  } else {
    console.log(`Tag not pushed. Run 'git push origin ${tag}' when ready.`);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
