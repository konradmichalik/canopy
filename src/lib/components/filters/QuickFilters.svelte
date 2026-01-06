<script lang="ts">
  import AtlaskitIcon, { type AtlaskitIconName } from '../common/AtlaskitIcon.svelte';
  import {
    filtersState,
    toggleFilter,
    toggleDynamicFilter,
    getActiveFilters,
    resetFilters,
    setSearchText,
    clearSearchText,
    setRecencyFilter,
    DYNAMIC_FILTER_CATEGORIES,
    DYNAMIC_FILTER_CONFIG,
    type DynamicFilterCategory
  } from '../../stores/filters.svelte';
  import { isFieldEnabled, type DisplayFieldId } from '../../stores/fieldConfig.svelte';
  import MultiSelectDropdown from './MultiSelectDropdown.svelte';
  import RecencyDropdown from './RecencyDropdown.svelte';

  // Convert icon name to Atlaskit icon name (pass-through with fallback)
  function getIconName(iconName: string | undefined): AtlaskitIconName {
    return (iconName as AtlaskitIconName) || 'circle';
  }

  // Mapping from filter category to field config ID for visibility check
  const CATEGORY_FIELD_MAP: Partial<Record<DynamicFilterCategory, DisplayFieldId>> = {
    priority: 'priority',
    resolution: 'resolution',
    component: 'components',
    fixVersion: 'fixVersions'
  };

  // Check if a filter category should be visible
  function isCategoryVisible(category: DynamicFilterCategory): boolean {
    const fieldId = CATEGORY_FIELD_MAP[category];
    // If no field mapping, always show (status, type, assignee)
    if (!fieldId) return true;
    return isFieldEnabled(fieldId);
  }

  // Active filter count (including search text and recency filter)
  const activeCount = $derived(
    getActiveFilters().length +
      (filtersState.searchText ? 1 : 0) +
      (filtersState.recencyFilter ? 1 : 0)
  );

  // Debounce timer for search input
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  // Local state for controlled input - syncs with store on external changes (e.g., reset)
  // eslint-disable-next-line svelte/prefer-writable-derived -- intentional: bidirectional sync with debounce
  let localSearchText = $state(filtersState.searchText);

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

<div class="flex items-center justify-between gap-4">
  <!-- Filter groups (left side) -->
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

    <!-- Recency filter dropdown -->
    <RecencyDropdown selectedOption={filtersState.recencyFilter} onSelect={setRecencyFilter} />

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

    <!-- Dynamic filter dropdowns (generated from categories) -->
    {#each DYNAMIC_FILTER_CATEGORIES as category (category)}
      {@const filters = filtersState.dynamicFilters[category]}
      {@const config = DYNAMIC_FILTER_CONFIG[category]}
      {#if filters.length > 0 && isCategoryVisible(category)}
        <MultiSelectDropdown
          label={config.label}
          {filters}
          onToggle={toggleDynamicFilter}
          {getIconName}
        />
      {/if}
    {/each}
  </div>

  <!-- Active filters summary + Reset (right side) -->
  {#if activeCount > 0}
    <div class="flex items-center gap-2 flex-shrink-0">
      <span class="text-xs text-text-subtle">
        {activeCount} filter{activeCount > 1 ? 's' : ''} active
      </span>
      <button
        onclick={resetFilters}
        class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border border-border text-text-subtle hover:border-border-bold hover:bg-surface-hovered transition-colors"
        title="Reset all filters"
      >
        <AtlaskitIcon name="cross" size={12} />
        Reset
      </button>
    </div>
  {/if}
</div>
