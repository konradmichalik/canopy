<script lang="ts">
  import AtlaskitIcon, { type AtlaskitIconName } from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
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

  // Check if there are any visible dynamic filters
  const hasVisibleDynamicFilters = $derived(
    DYNAMIC_FILTER_CATEGORIES.some(
      (category) => filtersState.dynamicFilters[category].length > 0 && isCategoryVisible(category)
    )
  );

  // Debounce timer for search input
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  // Local state for controlled input - syncs with store on external changes (e.g., reset)
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

<div class="space-y-3">
  <!-- Row 1: Search + Quick Filters -->
  <div class="flex items-center gap-3">
    <!-- Search input -->
    <div class="relative flex-shrink-0">
      <div class="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
        <AtlaskitIcon name="search" size={14} class="text-muted-foreground" />
      </div>
      <Input
        type="text"
        placeholder="Search..."
        value={localSearchText}
        oninput={handleSearchInput}
        onkeydown={handleSearchKeydown}
        class="w-40 h-8 pl-8 pr-8 text-xs"
      />
      {#if localSearchText}
        <button
          onclick={handleClearSearch}
          class="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
        >
          <AtlaskitIcon name="cross" size={12} />
        </button>
      {/if}
    </div>

    <!-- Divider -->
    <div class="h-5 w-px bg-border"></div>

    <!-- Quick Filters (Static) -->
    <div class="flex items-center gap-1.5">
      <span class="text-xs text-muted-foreground font-medium mr-1">Quick:</span>
      <RecencyDropdown selectedOption={filtersState.recencyFilter} onSelect={setRecencyFilter} />
      {#each filtersState.filters as filter (filter.id)}
        <Tooltip text={filter.jqlCondition}>
          <button
            onclick={() => toggleFilter(filter.id)}
            class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-colors
              {filter.isActive
              ? 'bg-primary/10 border-primary/30 text-primary font-medium'
              : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:bg-accent'}"
          >
            <AtlaskitIcon name={getIconName(filter.icon)} size={12} />
            {filter.label}
          </button>
        </Tooltip>
      {/each}
    </div>

    <!-- Active filters count + Reset -->
    {#if activeCount > 0}
      <div class="ml-auto flex items-center gap-2 flex-shrink-0">
        <span class="text-xs text-muted-foreground">
          {activeCount} active
        </span>
        <Button variant="ghost" size="sm" class="h-7 text-xs" onclick={resetFilters}>
          <AtlaskitIcon name="cross" size={12} />
          Reset
        </Button>
      </div>
    {/if}
  </div>

  <!-- Row 2: Data Filters (Dynamic dropdowns) -->
  {#if hasVisibleDynamicFilters}
    <div class="flex items-center gap-3 pt-2 border-t border-border/50">
      <span class="text-xs text-muted-foreground font-medium">Filter by:</span>
      <div class="flex flex-wrap items-center gap-1.5">
        {#each DYNAMIC_FILTER_CATEGORIES as category (category)}
          {@const filters = filtersState.dynamicFilters[category]}
          {@const config = DYNAMIC_FILTER_CONFIG[category]}
          {#if filters.length > 0 && isCategoryVisible(category)}
            <MultiSelectDropdown
              label={config.label}
              icon={config.icon}
              {filters}
              onToggle={toggleDynamicFilter}
              {getIconName}
            />
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</div>
