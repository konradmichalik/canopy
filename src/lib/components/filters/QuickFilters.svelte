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
    Bug,
    AlertTriangle,
    Puzzle,
    Package,
    X
  } from 'lucide-svelte';
  import {
    filtersState,
    toggleFilter,
    toggleDynamicFilter,
    getActiveFilters,
    resetFilters
  } from '../../stores/filters.svelte';
  import { isFieldEnabled } from '../../stores/fieldConfig.svelte';
  import MultiSelectDropdown from './MultiSelectDropdown.svelte';

  // Icon mapping
  function getIcon(iconName: string | undefined) {
    switch (iconName) {
      case 'user':
        return User;
      case 'circle':
        return Circle;
      case 'zap':
        return Zap;
      case 'circle-dot':
        return CircleDot;
      case 'loader':
        return Loader2;
      case 'check-circle':
        return CheckCircle;
      case 'book-open':
        return BookOpen;
      case 'check-square':
        return CheckSquare;
      case 'bug':
        return Bug;
      case 'alert-triangle':
        return AlertTriangle;
      case 'puzzle':
        return Puzzle;
      case 'package':
        return Package;
      default:
        return Circle;
    }
  }

  // Field visibility
  const showPriorityFilters = $derived(isFieldEnabled('priority'));
  const showResolutionFilters = $derived(isFieldEnabled('resolution'));
  const showComponentFilters = $derived(isFieldEnabled('components'));
  const showFixVersionFilters = $derived(isFieldEnabled('fixVersions'));

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

    <!-- Dropdown for dynamic assignee filters -->
    {#if filtersState.dynamicAssigneeFilters.length > 0}
      <MultiSelectDropdown
        label="Assignee"
        filters={filtersState.dynamicAssigneeFilters}
        onToggle={toggleDynamicFilter}
        {getIcon}
      />
    {/if}

    <!-- Dropdown for dynamic priority filters (only if priority field is enabled) -->
    {#if showPriorityFilters && filtersState.dynamicPriorityFilters.length > 0}
      <MultiSelectDropdown
        label="Priority"
        filters={filtersState.dynamicPriorityFilters}
        onToggle={toggleDynamicFilter}
        {getIcon}
      />
    {/if}

    <!-- Dropdown for dynamic resolution filters (only if resolution field is enabled) -->
    {#if showResolutionFilters && filtersState.dynamicResolutionFilters.length > 0}
      <MultiSelectDropdown
        label="Resolution"
        filters={filtersState.dynamicResolutionFilters}
        onToggle={toggleDynamicFilter}
        {getIcon}
      />
    {/if}

    <!-- Dropdown for dynamic component filters (only if components field is enabled) -->
    {#if showComponentFilters && filtersState.dynamicComponentFilters.length > 0}
      <MultiSelectDropdown
        label="Component"
        filters={filtersState.dynamicComponentFilters}
        onToggle={toggleDynamicFilter}
        {getIcon}
      />
    {/if}

    <!-- Dropdown for dynamic fix version filters (only if fixVersions field is enabled) -->
    {#if showFixVersionFilters && filtersState.dynamicFixVersionFilters.length > 0}
      <MultiSelectDropdown
        label="Release"
        filters={filtersState.dynamicFixVersionFilters}
        onToggle={toggleDynamicFilter}
        {getIcon}
      />
    {/if}

    <!-- Reset button -->
    {#if activeCount > 0}
      <button
        onclick={resetFilters}
        class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border border-border text-text-subtle hover:border-border-bold hover:bg-surface-hovered transition-colors"
        title="Reset all filters"
      >
        <X class="w-3 h-3" />
        Reset
      </button>
    {/if}
  </div>

  <!-- Active filters summary -->
  {#if activeCount > 0}
    <div class="text-xs text-text-subtle">
      {activeCount} filter{activeCount > 1 ? 's' : ''} active
    </div>
  {/if}
</div>
