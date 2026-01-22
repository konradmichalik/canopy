<script lang="ts">
  import AtlaskitIcon, { type AtlaskitIconName } from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import ConfirmDeleteModal from '../common/ConfirmDeleteModal.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
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
    type DynamicFilterCategory,
    type CustomFilter,
    type CustomFilterIcon,
    CUSTOM_FILTER_ICONS,
    hasActiveFiltersToSave,
    saveCustomFilter,
    deleteCustomFilter,
    updateCustomFilter,
    applyCustomFilter,
    getActiveFilterConditions
  } from '../../stores/filters.svelte';
  import { RECENCY_FILTER_OPTIONS, QUERY_COLORS, type QueryColor } from '../../types/tree';
  import { issuesState } from '../../stores/issues.svelte';
  import { addQuery, isTitleUnique, reorderQueryCustomFilters } from '../../stores/jql.svelte';
  import { routerState } from '../../stores/router.svelte';
  import { applyQuickFilters } from '../../utils/jql-helpers';
  import { createDragDrop } from '../../utils/drag-drop.svelte';
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

  // Generate tooltip text for a saved filter
  function getSavedFilterTooltip(filter: CustomFilter): string {
    const parts: string[] = [];

    if (filter.filterIds.length > 0) {
      parts.push(`${filter.filterIds.length} filter${filter.filterIds.length > 1 ? 's' : ''}`);
    }
    if (filter.recencyFilter) {
      const recencyLabel = RECENCY_FILTER_OPTIONS.find((o) => o.id === filter.recencyFilter)?.label;
      if (recencyLabel) parts.push(recencyLabel);
    }
    if (filter.searchText) {
      parts.push(`Search: "${filter.searchText}"`);
    }

    return parts.length > 0 ? parts.join(' · ') : 'No filters saved';
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
  let inputElement: HTMLInputElement | null = $state(null);
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

  // Unified dialog state for save/rename
  let dialogOpen = $state(false);
  let dialogMode = $state<'save' | 'rename'>('save');
  let dialogFilterId = $state<string | null>(null);
  let dialogFilterName = $state('');
  let dialogFilterIcon = $state<CustomFilterIcon | undefined>(undefined);
  let dialogInputRef: HTMLInputElement | null = $state(null);

  // Delete confirmation modal state - single variable for KISS
  let filterToDelete = $state<CustomFilter | null>(null);

  // Drag-and-drop for custom filters (using shared utility)
  const filterDrag = createDragDrop((fromIndex, toIndex) => {
    if (routerState.activeQueryId) {
      reorderQueryCustomFilters(routerState.activeQueryId, fromIndex, toIndex);
    }
  });

  // "Save as Query" dialog state
  let saveAsQueryDialogOpen = $state(false);
  let queryTitle = $state('');
  let queryColor = $state<QueryColor | undefined>(undefined);
  let queryTitleInputRef: HTMLInputElement | null = $state(null);

  function confirmDeleteFilter() {
    if (filterToDelete) {
      deleteCustomFilter(filterToDelete.id);
    }
  }

  // Check if we can save the current filters
  const canSaveFilter = $derived(hasActiveFiltersToSave());

  // Check if there are any custom filters
  const hasCustomFilters = $derived(filtersState.customFilters.length > 0);

  // Dialog config based on mode
  const dialogConfig = $derived({
    title: dialogMode === 'save' ? 'Save Custom Filter' : 'Edit Filter',
    description:
      dialogMode === 'save'
        ? 'Save the current filter selection as a reusable custom filter.'
        : 'Update the name and icon for this saved filter.',
    buttonText: dialogMode === 'save' ? 'Save Filter' : 'Save'
  });

  function openSaveDialog() {
    dialogMode = 'save';
    dialogFilterId = null;
    dialogFilterName = '';
    dialogFilterIcon = undefined;
    dialogOpen = true;
    setTimeout(() => dialogInputRef?.focus(), 50);
  }

  function openRenameDialog(filterId: string, currentName: string, currentIcon?: CustomFilterIcon) {
    dialogMode = 'rename';
    dialogFilterId = filterId;
    dialogFilterName = currentName;
    dialogFilterIcon = currentIcon;
    dialogOpen = true;
    setTimeout(() => {
      dialogInputRef?.focus();
      dialogInputRef?.select();
    }, 50);
  }

  function handleDialogSubmit() {
    const name = dialogFilterName.trim();
    if (!name) return;

    if (dialogMode === 'save') {
      saveCustomFilter(name, dialogFilterIcon);
    } else if (dialogFilterId) {
      updateCustomFilter(dialogFilterId, name, dialogFilterIcon);
    }

    dialogOpen = false;
    dialogFilterName = '';
    dialogFilterIcon = undefined;
    dialogFilterId = null;
  }

  // Generic keydown handler for dialogs (DRY)
  function createDialogKeydown(
    canSubmit: () => boolean,
    onSubmit: () => void,
    onClose: () => void
  ) {
    return (event: KeyboardEvent) => {
      if (event.key === 'Enter' && canSubmit()) {
        onSubmit();
      } else if (event.key === 'Escape') {
        onClose();
      }
    };
  }

  const handleDialogKeydown = createDialogKeydown(
    () => !!dialogFilterName.trim(),
    handleDialogSubmit,
    () => (dialogOpen = false)
  );

  // "Save as Query" functions
  const canSaveAsQuery = $derived(hasActiveFiltersToSave() && issuesState.currentJql);

  const generatedJql = $derived(() => {
    if (!issuesState.currentJql) return '';
    const conditions = getActiveFilterConditions();
    if (conditions.length === 0) return issuesState.currentJql;
    return applyQuickFilters(issuesState.currentJql, conditions);
  });

  const isQueryTitleDuplicate = $derived(
    queryTitle.trim().length > 0 && !isTitleUnique(queryTitle.trim())
  );

  const hasLocalOnlyFilters = $derived(
    filtersState.searchText || filtersState.recencyFilter === 'recently-commented'
  );

  function openSaveAsQueryDialog() {
    queryTitle = '';
    queryColor = undefined;
    saveAsQueryDialogOpen = true;
    setTimeout(() => queryTitleInputRef?.focus(), 50);
  }

  function toggleQueryColor(c: QueryColor): void {
    queryColor = queryColor === c ? undefined : c;
  }

  function handleSaveAsQuery(): void {
    const jql = generatedJql();
    if (!jql || !queryTitle.trim() || isQueryTitleDuplicate) return;

    const newQuery = addQuery(queryTitle.trim(), jql, queryColor);
    saveAsQueryDialogOpen = false;
    queryTitle = '';
    queryColor = undefined;

    // Dispatch event for navigation
    document.dispatchEvent(
      new CustomEvent('query-created', {
        detail: { query: newQuery },
        bubbles: true
      })
    );

    // Reset filters (now baked into JQL)
    resetFilters();
  }

  const handleSaveAsQueryKeydown = createDialogKeydown(
    () => !!queryTitle.trim() && !isQueryTitleDuplicate,
    handleSaveAsQuery,
    () => (saveAsQueryDialogOpen = false)
  );
</script>

<!-- Saved Filters Row (always visible if there are saved filters) -->
{#if hasCustomFilters}
  <div class="flex items-center gap-1.5 mb-3">
    {#each filtersState.customFilters as customFilter, index (customFilter.id)}
      {@const isActive = filtersState.activeCustomFilterId === customFilter.id}
      {@const isDragging = filterDrag.isDragging(index)}
      {@const isDragOver = filterDrag.isDragOver(index)}
      <Tooltip text={getSavedFilterTooltip(customFilter)}>
        <div
          role="listitem"
          class="group inline-flex items-center rounded-full border transition-all
          {isActive
            ? 'bg-primary/10 border-primary/30'
            : 'bg-card border-border hover:border-primary/30'}
          {isDragging ? 'opacity-50 scale-95' : ''}
          {isDragOver ? 'ring-2 ring-primary ring-offset-1' : ''}"
          ondragover={(e) => filterDrag.handleDragOver(e, index)}
          ondrop={() => filterDrag.handleDrop(index)}
        >
          <!-- Drag handle (visible on hover) -->
          <div
            draggable="true"
            ondragstart={() => filterDrag.handleDragStart(index)}
            ondragend={filterDrag.handleDragEnd}
            class="cursor-grab active:cursor-grabbing pl-1.5 pr-0.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            role="button"
            tabindex="-1"
            onclick={(e: MouseEvent) => e.stopPropagation()}
            onkeydown={(e: KeyboardEvent) => e.stopPropagation()}
          >
            <AtlaskitIcon name="drag-handle" size={10} />
          </div>
          <!-- Main button - applies filter on click -->
          <button
            onclick={() => applyCustomFilter(customFilter.id)}
            class="cursor-pointer inline-flex items-center gap-1.5 pr-1.5 py-1 text-xs transition-colors
            {isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}"
          >
            <AtlaskitIcon name={customFilter.icon || 'filter'} size={12} />
            {customFilter.name}
          </button>
          <!-- Dropdown trigger for edit/delete (visible on hover) -->
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <button
                class="cursor-pointer inline-flex items-center justify-center w-5 h-5 mr-0.5 rounded-full transition-all opacity-0 group-hover:opacity-100
                {isActive
                  ? 'text-primary/60 hover:text-primary hover:bg-primary/10'
                  : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent'}"
              >
                <AtlaskitIcon name="chevron-down" size={10} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="start" class="min-w-32">
              <DropdownMenu.Item
                onclick={() =>
                  openRenameDialog(customFilter.id, customFilter.name, customFilter.icon)}
              >
                <AtlaskitIcon name="edit" size={14} class="mr-2" />
                Edit
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                onclick={() => (filterToDelete = customFilter)}
                class="text-destructive focus:text-destructive"
              >
                <AtlaskitIcon name="delete" size={14} class="mr-2" />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </Tooltip>
    {/each}
  </div>
{/if}

{#if expanded}
  <div class="space-y-3">
    <!-- Row 1: Search (left) + View Controls (right) -->
    <div class="flex items-center justify-between gap-3">
      <!-- Left: Search input -->
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
          class="w-48 h-8 pl-8 pr-8 text-xs"
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

    <!-- Row 2: All Filters -->
    <div class="flex items-center gap-3 pt-2 border-t border-border/50">
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

      <!-- Divider -->
      {#if hasVisibleDynamicFilters}
        <div class="h-5 w-px bg-border"></div>
      {/if}

      <!-- Data Filters (Dynamic dropdowns) -->
      {#if hasVisibleDynamicFilters}
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-muted-foreground font-medium mr-1">By:</span>
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

      <!-- Spacer -->
      <div class="flex-1"></div>

      <!-- Save filter dropdown -->
      {#if canSaveFilter}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <button
              class="cursor-pointer inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full border border-dashed transition-colors
              border-border text-muted-foreground hover:border-primary/30 hover:bg-accent hover:text-foreground"
            >
              <AtlaskitIcon name="add" size={12} />
              Save
              <AtlaskitIcon name="chevron-down" size={10} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end" class="min-w-40">
            <DropdownMenu.Item onclick={openSaveDialog}>
              <AtlaskitIcon name="filter" size={14} class="mr-2" />
              As Quickfilter
            </DropdownMenu.Item>
            {#if canSaveAsQuery}
              <DropdownMenu.Item onclick={openSaveAsQueryDialog}>
                <AtlaskitIcon name="layers" size={14} class="mr-2" />
                As Query
              </DropdownMenu.Item>
            {/if}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}

      <!-- Reset button -->
      {#if activeCount > 0}
        <Button variant="ghost" size="sm" class="h-7 text-xs" onclick={resetFilters}>
          <AtlaskitIcon name="cross" size={12} />
          Reset
        </Button>
      {/if}
    </div>
  </div>
{/if}

<!-- Unified Filter Name Dialog (Save/Rename) -->
<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Content class="sm:max-w-md">
    <div class="flex flex-col space-y-1.5 text-center sm:text-left">
      <h2 class="text-lg font-semibold leading-none tracking-tight">{dialogConfig.title}</h2>
      <p class="text-sm text-muted-foreground">{dialogConfig.description}</p>
    </div>
    <div class="py-4 space-y-4">
      <Input
        bind:ref={dialogInputRef}
        type="text"
        placeholder="Filter name..."
        bind:value={dialogFilterName}
        onkeydown={handleDialogKeydown}
        class="w-full"
      />
      <!-- Icon selection -->
      <div class="space-y-2">
        <span class="text-sm font-medium text-muted-foreground">Icon (optional)</span>
        <div class="flex flex-wrap gap-1">
          {#each CUSTOM_FILTER_ICONS as icon (icon)}
            <button
              type="button"
              onclick={() => (dialogFilterIcon = dialogFilterIcon === icon ? undefined : icon)}
              class="p-2 rounded-md border transition-colors cursor-pointer
                {dialogFilterIcon === icon
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:bg-accent'}"
            >
              <AtlaskitIcon name={icon} size={16} />
            </button>
          {/each}
        </div>
      </div>
    </div>
    <div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
      <Button variant="outline" onclick={() => (dialogOpen = false)}>Cancel</Button>
      <Button onclick={handleDialogSubmit} disabled={!dialogFilterName.trim()}
        >{dialogConfig.buttonText}</Button
      >
    </div>
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Modal for Custom Filters -->
<ConfirmDeleteModal
  open={filterToDelete !== null}
  itemName={filterToDelete?.name ?? ''}
  itemType="filter"
  onConfirm={confirmDeleteFilter}
  onClose={() => (filterToDelete = null)}
/>

<!-- Save as Query Dialog -->
<Dialog.Root bind:open={saveAsQueryDialogOpen}>
  <Dialog.Content class="sm:max-w-lg">
    <div class="flex flex-col space-y-1.5 text-center sm:text-left">
      <h2 class="text-lg font-semibold leading-none tracking-tight">Save as Query</h2>
      <p class="text-sm text-muted-foreground">
        Create a new query with the current filters baked into the JQL.
      </p>
    </div>
    <div class="py-4 space-y-4">
      <!-- Query Title -->
      <div class="space-y-2">
        <label for="queryTitle" class="text-sm font-medium">Title</label>
        <Input
          id="queryTitle"
          bind:ref={queryTitleInputRef}
          type="text"
          placeholder="e.g., Active Sprint Tasks"
          bind:value={queryTitle}
          onkeydown={handleSaveAsQueryKeydown}
          class={isQueryTitleDuplicate ? 'border-destructive focus-visible:ring-destructive' : ''}
        />
        {#if isQueryTitleDuplicate}
          <div class="flex items-center gap-1.5 text-xs text-destructive">
            <AtlaskitIcon name="warning" size={14} />
            <span>A query with this title already exists</span>
          </div>
        {/if}
      </div>

      <!-- Color Selection -->
      <div class="space-y-2">
        <span class="text-sm font-medium">Color (optional)</span>
        <div class="flex flex-wrap gap-2">
          {#each QUERY_COLORS as c (c.id)}
            <Tooltip text={c.label}>
              <button
                type="button"
                onclick={() => toggleQueryColor(c.id)}
                class="w-7 h-7 rounded-full {c.bg} transition-all cursor-pointer
                  {queryColor === c.id
                  ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                  : 'hover:scale-110 opacity-70 hover:opacity-100'}"
                aria-label={c.label}
                aria-pressed={queryColor === c.id}
              ></button>
            </Tooltip>
          {/each}
        </div>
      </div>

      <!-- JQL Preview -->
      <div class="space-y-2">
        <span class="text-sm font-medium">Generated JQL</span>
        <div class="p-3 bg-muted rounded-md font-mono text-xs text-muted-foreground max-h-24 overflow-y-auto">
          {generatedJql()}
        </div>
      </div>

      <!-- Warning for local-only filters -->
      {#if hasLocalOnlyFilters}
        <div class="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-md">
          <AtlaskitIcon name="warning" size={16} class="text-warning mt-0.5 flex-shrink-0" />
          <p class="text-xs text-warning">
            {#if filtersState.searchText && filtersState.recencyFilter === 'recently-commented'}
              Search text and "Recently Commented" filter are client-side only and will not be included in the query.
            {:else if filtersState.searchText}
              Search text is client-side only and will not be included in the query.
            {:else}
              "Recently Commented" filter is client-side only and will not be included in the query.
            {/if}
          </p>
        </div>
      {/if}
    </div>
    <div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
      <Button variant="outline" onclick={() => (saveAsQueryDialogOpen = false)}>Cancel</Button>
      <Button onclick={handleSaveAsQuery} disabled={!queryTitle.trim() || isQueryTitleDuplicate}>
        <AtlaskitIcon name="layers" size={14} />
        Create Query
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
