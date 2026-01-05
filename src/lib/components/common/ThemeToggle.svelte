<script lang="ts">
  import AtlaskitIcon from './AtlaskitIcon.svelte';
  import { themeState, toggleTheme } from '../../stores/theme.svelte';
</script>

<button
  onclick={toggleTheme}
  class="p-2 rounded-lg transition-colors hover:bg-surface-hovered"
  title={themeState.resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
  aria-label="Toggle theme"
>
  {#if themeState.resolvedTheme === 'dark'}
    <AtlaskitIcon name="sun" size={20} color="var(--color-text-subtle)" />
  {:else}
    <AtlaskitIcon name="moon" size={20} color="var(--color-text-subtle)" />
  {/if}
</button>
