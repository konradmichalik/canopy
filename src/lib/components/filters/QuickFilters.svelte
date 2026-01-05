<script lang="ts">
  import {
    User,
    Circle,
    Zap,
    CircleDot,
    Loader2,
    CheckCircle,
    BookOpen,
    CheckSquare,
    Bug
  } from 'lucide-svelte';
  import { filtersState, toggleFilter, toggleDynamicFilter, getActiveFilters } from '../../stores/filters.svelte';
  import MultiSelectDropdown from './MultiSelectDropdown.svelte';

  // Icon mapping
  function getIcon(iconName: string | undefined) {
    switch (iconName) {
      case 'user': return User;
      case 'circle': return Circle;
      case 'zap': return Zap;
      case 'circle-dot': return CircleDot;
      case 'loader': return Loader2;
      case 'check-circle': return CheckCircle;
      case 'book-open': return BookOpen;
      case 'check-square': return CheckSquare;
      case 'bug': return Bug;
      default: return Circle;
    }
  }

  // Active filter count
  const activeCount = $derived(getActiveFilters().length);
</script>

<div class="flex flex-col gap-3">
  <!-- Filter groups -->
  <div class="flex flex-wrap items-center gap-2">
    <!-- Toggle buttons for static filters (general and sprint) -->
    {#each filtersState.filters as filter (filter.id)}
      {@const IconComponent = getIcon(filter.icon)}
      <button
        onclick={() => toggleFilter(filter.id)}
        class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-colors
          {filter.isActive
            ? 'bg-brand-subtlest border-border-brand text-text-brand font-medium'
            : 'bg-surface-raised border-border text-text-subtle hover:border-border-bold hover:bg-surface-hovered'}"
        title={filter.jqlCondition}
      >
        <IconComponent class="w-3 h-3" />
        {filter.label}
      </button>
    {/each}

    <!-- Dropdown for dynamic status filters -->
    {#if filtersState.dynamicStatusFilters.length > 0}
      <MultiSelectDropdown
        label="Status"
        filters={filtersState.dynamicStatusFilters}
        onToggle={toggleDynamicFilter}
        {getIcon}
      />
    {/if}

    <!-- Dropdown for dynamic type filters -->
    {#if filtersState.dynamicTypeFilters.length > 0}
      <MultiSelectDropdown
        label="Type"
        filters={filtersState.dynamicTypeFilters}
        onToggle={toggleDynamicFilter}
        {getIcon}
      />
    {/if}
  </div>

  <!-- Active filters summary -->
  {#if activeCount > 0}
    <div class="text-xs text-text-subtle">
      {activeCount} filter{activeCount > 1 ? 's' : ''} active
    </div>
  {/if}
</div>
