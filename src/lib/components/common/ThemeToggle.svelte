<script lang="ts">
  import AtlaskitIcon from './AtlaskitIcon.svelte';
  import Tooltip from './Tooltip.svelte';
  import { themeState, toggleTheme } from '../../stores/theme.svelte';
</script>

<Tooltip text={themeState.resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
  <button
    onclick={toggleTheme}
    class="p-2 rounded-lg transition-colors hover:bg-surface-hovered"
    aria-label="Toggle theme"
  >
    {#if themeState.resolvedTheme === 'dark'}
      <AtlaskitIcon name="sun" size={20} color="var(--color-text-subtle)" />
    {:else}
      <AtlaskitIcon name="moon" size={20} color="var(--color-text-subtle)" />
    {/if}
  </button>
</Tooltip>
