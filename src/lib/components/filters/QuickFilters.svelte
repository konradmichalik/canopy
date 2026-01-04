<script lang="ts">
  import { User, CheckCircle } from 'lucide-svelte';
  import { filtersState, toggleFilter } from '../../stores/filters.svelte';
</script>

<div class="flex items-center gap-2 flex-wrap">
  <span class="text-sm text-[var(--color-text-secondary)]">Filter:</span>

  {#each filtersState.filters as filter (filter.id)}
    <button
      onclick={() => toggleFilter(filter.id)}
      class="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-full border transition-colors
        {filter.isActive
          ? 'bg-jira-blue/10 border-jira-blue text-jira-blue'
          : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]'}"
    >
      {#if filter.id === 'assigned-to-me'}
        <User class="w-3.5 h-3.5" />
      {:else if filter.id === 'unresolved'}
        <CheckCircle class="w-3.5 h-3.5" />
      {/if}
      {filter.label}
    </button>
  {/each}
</div>
