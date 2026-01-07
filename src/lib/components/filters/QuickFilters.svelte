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
  import GroupByDropdown from '../tree/GroupByDropdown.svelte';
  import FieldSelector from '../tree/FieldSelector.svelte';
  import SortDropdown from '../tree/SortDropdown.svelte';

  // Props for external control
  interface Props {
    expanded: boolean;
  }

  let { expanded }: Props = $props();

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
  // Local search text that tracks store but can be edited independently
  // Uses a reference to track and sync with store changes
  let inputElement: HTMLInputElement | undefined = $state();
  let lastStoreValue = '';

  // Sync input with store when store changes externally (e.g., reset)
  const storeSearchText = $derived(filtersState.searchText);
  $effect(() => {
    if (storeSearchText !== lastStoreValue) {
      lastStoreValue = storeSearchText;
      if (inputElement && inputElement.value !== storeSearchText) {
        inputElement.value = storeSearchText;
      }
    }
  });

  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for debounced search
    debounceTimer = setTimeout(() => {
      lastStoreValue = value;
      setSearchText(value);
    }, 300);
  }

  function handleSearchKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLInputElement;
    if (event.key === 'Enter') {
      // Immediate search on Enter
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      lastStoreValue = target.value;
      setSearchText(target.value);
    } else if (event.key === 'Escape') {
      // Clear search on Escape
      target.value = '';
      lastStoreValue = '';
      clearSearchText();
    }
  }

  function handleClearSearch() {
    if (inputElement) {
      inputElement.value = '';
    }
    lastStoreValue = '';
    clearSearchText();
  }
</script>

{#if expanded}
<div class="space-y-3">
  <!-- Row 1: Search + Quick Filters -->
  <div class="flex items-center gap-3">
    <!-- Search input -->
    <div class="relative flex-shrink-0">
      <div class="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
        <AtlaskitIcon name="search" size={14} class="text-muted-foreground" />
      </div>
      <Input
        bind:ref={inputElement}
        type="text"
        placeholder="Search..."
        value={storeSearchText}
        oninput={handleSearchInput}
        onkeydown={handleSearchKeydown}
        class="w-40 h-8 pl-8 pr-8 text-xs"
      />
      {#if storeSearchText || inputElement?.value}
        <button
          onclick={handleClearSearch}
          class="absolute inset-y-0 right-2 flex items-center cursor-pointer text-muted-foreground hover:text-foreground"
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
            class="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-colors
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

    <!-- Reset button -->
    {#if activeCount > 0}
      <Button variant="ghost" size="sm" class="h-7 text-xs" onclick={resetFilters}>
        <AtlaskitIcon name="cross" size={12} />
        Reset
      </Button>
    {/if}
  </div>

  <!-- Row 2: Filter by (left) + View Controls (right) -->
  <div class="flex items-center justify-between gap-3 pt-2 border-t border-border/50">
    <!-- Left: Data Filters (Dynamic dropdowns) -->
    <div class="flex items-center gap-3">
      {#if hasVisibleDynamicFilters}
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
      {/if}
    </div>

    <!-- Right: View Controls (Grouping, Fields, Sorting) -->
    <div class="flex items-center gap-3 flex-shrink-0">
      <span class="text-xs text-muted-foreground font-medium">View:</span>
      <div class="flex items-center gap-1.5">
        <GroupByDropdown />
        <FieldSelector />
        <SortDropdown />
      </div>
    </div>
  </div>
</div>
{/if}
