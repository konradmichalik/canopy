import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'
import { execSync } from 'child_process'

// Get version from git tag (release builds) or fallback to "dev"
function getAppVersion(): string {
  try {
    // Check if current commit has an exact tag (CI release builds)
    return execSync('git describe --tags --exact-match 2>/dev/null', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
  } catch {
    // No exact tag - this is a dev build
    return 'dev'
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
    __APP_VERSION__: JSON.stringify(getAppVersion()),
    __APP_NAME__: JSON.stringify('Canopy'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __DEFAULT_PROXY_URL__: JSON.stringify(
      process.env.VERCEL ? '/api/jira' : 'http://localhost:3001/jira'
    ),
  },
})
