<script lang="ts">
  import AtlaskitIcon, { type AtlaskitIconName } from '../common/AtlaskitIcon.svelte';
  import {
    filtersState,
    toggleFilter,
    toggleDynamicFilter,
    getActiveFilters,
    resetFilters,
    setSearchText,
    clearSearchText
  } from '../../stores/filters.svelte';
  import { isFieldEnabled } from '../../stores/fieldConfig.svelte';
  import MultiSelectDropdown from './MultiSelectDropdown.svelte';

  // Icon name mapping (Lucide names → Atlaskit names)
  // Also supports direct Atlaskit names
  function getIconName(iconName: string | undefined): AtlaskitIconName {
    switch (iconName) {
      // Direct Atlaskit icon names (used by type filters)
      case 'epic':
      case 'story':
      case 'task':
      case 'bug':
      case 'subtasks':
        return iconName;
      // Lucide to Atlaskit mappings (legacy support)
      case 'user':
        return 'person';
      case 'circle':
        return 'circle';
      case 'zap':
        return 'epic';
      case 'circle-dot':
        return 'circle-filled';
      case 'loader':
        return 'refresh';
      case 'check-circle':
        return 'check-circle';
      case 'book-open':
        return 'story';
      case 'check-square':
        return 'task';
      case 'alert-triangle':
        return 'warning';
      case 'puzzle':
        return 'component';
      case 'package':
        return 'release';
      default:
        return 'circle';
    }
  }

  // Field visibility
  const showPriorityFilters = $derived(isFieldEnabled('priority'));
  const showResolutionFilters = $derived(isFieldEnabled('resolution'));
  const showComponentFilters = $derived(isFieldEnabled('components'));
  const showFixVersionFilters = $derived(isFieldEnabled('fixVersions'));

  // Active filter count (including search text as a filter)
  const activeCount = $derived(
    getActiveFilters().length + (filtersState.searchText ? 1 : 0)
  );

  // Debounce timer for search input
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let localSearchText = $state(filtersState.searchText);

  // Sync local search text with store when store changes externally (e.g., reset)
  $effect(() => {
    localSearchText = filtersState.searchText;
  });

  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    localSearchText = target.value;

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for debounced search
    debounceTimer = setTimeout(() => {
      setSearchText(localSearchText);
    }, 300);
  }

  function handleSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      // Immediate search on Enter
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      setSearchText(localSearchText);
    } else if (event.key === 'Escape') {
      // Clear search on Escape
      localSearchText = '';
      clearSearchText();
    }
  }

  function handleClearSearch() {
    localSearchText = '';
    clearSearchText();
  }
</script>

<div class="flex flex-col gap-3">
  <!-- Filter groups -->
  <div class="flex flex-wrap items-center gap-2">
    <!-- Search input -->
    <div class="relative">
      <div class="absolute inset-y-0 left-2 flex items-center pointer-events-none">
        <AtlaskitIcon name="search" size={14} class="text-text-subtlest" />
      </div>
      <input
        type="text"
        placeholder="Search title or key..."
        value={localSearchText}
        oninput={handleSearchInput}
        onkeydown={handleSearchKeydown}
        class="w-44 pl-7 pr-7 py-1 text-xs rounded-md border border-border bg-surface-sunken
          text-text placeholder:text-text-subtlest
          focus:outline-none focus:ring-1 focus:ring-border-brand focus:border-border-brand
          hover:border-border-bold transition-colors"
      />
      {#if localSearchText}
        <button
          onclick={handleClearSearch}
          class="absolute inset-y-0 right-1.5 flex items-center text-text-subtlest hover:text-text-subtle"
          title="Clear search (Esc)"
        >
          <AtlaskitIcon name="cross" size={12} />
        </button>
      {/if}
    </div>

    <!-- Toggle buttons for static filters (general and sprint) -->
    {#each filtersState.filters as filter (filter.id)}
      <button
        onclick={() => toggleFilter(filter.id)}
        class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-colors
          {filter.isActive
          ? 'bg-brand-subtlest border-border-brand text-text-brand font-medium'
          : 'bg-surface-raised border-border text-text-subtle hover:border-border-bold hover:bg-surface-hovered'}"
        title={filter.jqlCondition}
      >
        <AtlaskitIcon name={getIconName(filter.icon)} size={12} />
        {filter.label}
      </button>
    {/each}

    <!-- Dropdown for dynamic status filters -->
    {#if filtersState.dynamicStatusFilters.length > 0}
      <MultiSelectDropdown
        label="Status"
        filters={filtersState.dynamicStatusFilters}
        onToggle={toggleDynamicFilter}
        {getIconName}
      />
    {/if}

    <!-- Dropdown for dynamic type filters -->
    {#if filtersState.dynamicTypeFilters.length > 0}
      <MultiSelectDropdown
        label="Type"
        filters={filtersState.dynamicTypeFilters}
        onToggle={toggleDynamicFilter}
        {getIconName}
      />
    {/if}

    <!-- Dropdown for dynamic assignee filters -->
    {#if filtersState.dynamicAssigneeFilters.length > 0}
      <MultiSelectDropdown
        label="Assignee"
        filters={filtersState.dynamicAssigneeFilters}
        onToggle={toggleDynamicFilter}
        {getIconName}
      />
    {/if}

    <!-- Dropdown for dynamic priority filters (only if priority field is enabled) -->
    {#if showPriorityFilters && filtersState.dynamicPriorityFilters.length > 0}
      <MultiSelectDropdown
        label="Priority"
        filters={filtersState.dynamicPriorityFilters}
        onToggle={toggleDynamicFilter}
        {getIconName}
      />
    {/if}

    <!-- Dropdown for dynamic resolution filters (only if resolution field is enabled) -->
    {#if showResolutionFilters && filtersState.dynamicResolutionFilters.length > 0}
      <MultiSelectDropdown
        label="Resolution"
        filters={filtersState.dynamicResolutionFilters}
        onToggle={toggleDynamicFilter}
        {getIconName}
      />
    {/if}

    <!-- Dropdown for dynamic component filters (only if components field is enabled) -->
    {#if showComponentFilters && filtersState.dynamicComponentFilters.length > 0}
      <MultiSelectDropdown
        label="Component"
        filters={filtersState.dynamicComponentFilters}
        onToggle={toggleDynamicFilter}
        {getIconName}
      />
    {/if}

    <!-- Dropdown for dynamic fix version filters (only if fixVersions field is enabled) -->
    {#if showFixVersionFilters && filtersState.dynamicFixVersionFilters.length > 0}
      <MultiSelectDropdown
        label="Release"
        filters={filtersState.dynamicFixVersionFilters}
        onToggle={toggleDynamicFilter}
        {getIconName}
      />
    {/if}

    <!-- Reset button -->
    {#if activeCount > 0}
      <button
        onclick={resetFilters}
        class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border border-border text-text-subtle hover:border-border-bold hover:bg-surface-hovered transition-colors"
        title="Reset all filters"
      >
        <AtlaskitIcon name="cross" size={12} />
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
