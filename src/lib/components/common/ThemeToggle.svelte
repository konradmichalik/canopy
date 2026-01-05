<script lang="ts">
  import { Sun, Moon } from 'lucide-svelte';
  import { themeState, toggleTheme } from '../../stores/theme.svelte';
</script>

<button
  onclick={toggleTheme}
  class="p-2 rounded-lg transition-colors hover:bg-surface-hovered"
  title={themeState.resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
  aria-label="Toggle theme"
>
  {#if themeState.resolvedTheme === 'dark'}
    <Sun class="w-5 h-5 text-text-subtle" />
  {:else}
    <Moon class="w-5 h-5 text-text-subtle" />
  {/if}
</button>
