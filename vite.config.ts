import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'
import { readFileSync } from 'fs'
import { execSync } from 'child_process'

// Read version from package.json
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Get git tag if current commit is tagged (set during CI release builds)
function getGitTag(): string {
  try {
    return execSync('git describe --tags --exact-match 2>/dev/null', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
  } catch {
    return ''
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_NAME__: JSON.stringify(pkg.description || 'Canopy'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __GIT_TAG__: JSON.stringify(getGitTag()),
    __DEFAULT_PROXY_URL__: JSON.stringify(
      process.env.VERCEL ? '/api/jira' : 'http://localhost:3001/jira'
    ),
  },
})
