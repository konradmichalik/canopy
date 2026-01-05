<script lang="ts">
  import { User, CheckCircle } from 'lucide-svelte';
  import { filtersState, toggleFilter } from '../../stores/filters.svelte';
</script>

<div class="flex items-center gap-2 flex-wrap">
  <span class="text-sm text-text-subtle">Filter:</span>

  {#each filtersState.filters as filter (filter.id)}
    <button
      onclick={() => toggleFilter(filter.id)}
      class="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-full border transition-colors
        {filter.isActive
          ? 'bg-brand/10 border-border-brand text-text-brand'
          : 'bg-surface-raised border-border text-text-subtle hover:border-border-bold'}"
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
