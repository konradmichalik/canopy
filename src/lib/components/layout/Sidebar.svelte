<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import type { SavedQuery, QueryColor, QuerySeparator } from '../../types';
  import { isSeparator } from '../../types/tree';
  import QueryListItem from '../jql/QueryListItem.svelte';
  import SeparatorListItem from '../jql/SeparatorListItem.svelte';
  import QueryForm from '../jql/QueryForm.svelte';
  import {
    jqlState,
    initializeQueries,
    addQuery,
    addImportedQuery,
    updateQuery,
    deleteQuery,
    duplicateQuery,
    reorderItems,
    addSeparator,
    updateSeparator,
    deleteSeparator,
    updateQueryDisplayFields,
    updateQueryActiveFilters,
    updateQuerySearchText,
    updateQuerySortConfig
  } from '../../stores/jql.svelte';
  import {
    routerState,
    setActiveQuery,
    onUrlSlugChange,
    getSlugFromUrl
  } from '../../stores/router.svelte';
  import { getQueryBySlug, getQuerySlug } from '../../stores/jql.svelte';
  import { loadIssues, clearIssues, preCheckIssueCount } from '../../stores/issues.svelte';
  import LargeResultWarningModal from '../common/LargeResultWarningModal.svelte';
  import {
    loadFieldConfig,
    setFieldConfigChangeCallback,
    type DisplayFieldId
  } from '../../stores/fieldConfig.svelte';
  import {
    loadActiveFilters,
    loadCustomFilters,
    setActiveFiltersChangeCallback,
    setSearchTextChangeCallback
  } from '../../stores/filters.svelte';
  import { loadSortConfig, setSortConfigChangeCallback } from '../../stores/sortConfig.svelte';
  import { loadGroupConfig, setGroupingChangeCallback } from '../../stores/grouping.svelte';
  import type { SortConfig, GroupByOption } from '../../types/tree';
  import { updateQueryGroupBy } from '../../stores/jql.svelte';
  import { readSingleQueryFile, importSingleQuery } from '../../utils/storage';
  import { createDragDrop } from '../../utils/drag-drop.svelte';

  interface Props {
    width: number;
    onClose?: () => void;
  }

  let { width, onClose: _onClose }: Props = $props();

  let showQueryForm = $state(false);
  let editingQuery = $state<SavedQuery | null>(null);
  let initialized = false;

  // Drag & Drop for query list items (using shared utility)
  const queryDrag = createDragDrop(reorderItems);

  // Import state
  let importFileInput: HTMLInputElement;
  let importMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

  // Large result warning state
  let pendingLargeQuery = $state<{ query: SavedQuery; total: number } | null>(null);

  // Set up query config (URL, filters, etc.) without loading issues
  function setupQueryConfig(query: SavedQuery, updateUrl: boolean = true): void {
    const slug = getQuerySlug(query);
    setActiveQuery(query.id, slug, updateUrl);
    loadFieldConfig(query.id, query.displayFields);
    loadActiveFilters(query.activeFilterIds, query.searchText);
    loadCustomFilters(query.customFilters, query.activeCustomFilterId);
    loadSortConfig(query.id, query.sortConfig);
    loadGroupConfig(query.id, query.groupBy);
  }

  // Load a query and its associated config
  async function loadQuery(
    query: SavedQuery,
    updateUrl: boolean = true,
    options: { loadAll?: boolean } = {}
  ): Promise<void> {
    setupQueryConfig(query, updateUrl);

    // If loadAll is explicitly set, skip pre-check
    if (options.loadAll !== undefined) {
      await loadIssues(query.jql, { loadAll: options.loadAll });
      return;
    }

    // Pre-check count for large result warning
    try {
      const { total, needsWarning } = await preCheckIssueCount(query.jql);

      if (needsWarning) {
        // Show warning modal
        pendingLargeQuery = { query, total };
        return;
      }

      // Load all if under threshold
      await loadIssues(query.jql, { loadAll: true });
    } catch {
      // On error, fall back to loading first batch
      await loadIssues(query.jql, { loadAll: false });
    }
  }

  // Handle warning modal callbacks
  function handleLoadFirstBatch(): void {
    if (pendingLargeQuery) {
      loadIssues(pendingLargeQuery.query.jql, { loadAll: false });
      pendingLargeQuery = null;
    }
  }

  function handleLoadAll(): void {
    if (pendingLargeQuery) {
      loadIssues(pendingLargeQuery.query.jql, { loadAll: true });
      pendingLargeQuery = null;
    }
  }

  function handleCancelLargeQuery(): void {
    pendingLargeQuery = null;
    // Clear active query since we didn't load anything
    setActiveQuery(null);
    clearIssues();
  }

  // Handle slug from URL (initial load or browser navigation)
  async function handleUrlSlug(slug: string | null): Promise<void> {
    if (!slug) {
      setActiveQuery(null, undefined, false);
      clearIssues();
      return;
    }

    const query = getQueryBySlug(slug);
    if (query) {
      await loadQuery(query, false);
    } else {
      setActiveQuery(null);
      clearIssues();
    }
  }

  // Initialize on mount (run only once)
  $effect(() => {
    if (initialized) return;
    initialized = true;
    void initializeQueries();

    // Set callback for field config changes
    setFieldConfigChangeCallback((enabledFields: DisplayFieldId[]) => {
      if (routerState.activeQueryId) {
        updateQueryDisplayFields(routerState.activeQueryId, enabledFields);
      }
    });

    // Set callback for filter changes
    setActiveFiltersChangeCallback((activeFilterIds: string[]) => {
      if (routerState.activeQueryId) {
        updateQueryActiveFilters(routerState.activeQueryId, activeFilterIds);
      }
    });

    // Set callback for search text changes
    setSearchTextChangeCallback((searchText: string) => {
      if (routerState.activeQueryId) {
        updateQuerySearchText(routerState.activeQueryId, searchText);
      }
    });

    // Set callback for sort config changes
    setSortConfigChangeCallback((sortConfig: SortConfig) => {
      if (routerState.activeQueryId) {
        updateQuerySortConfig(routerState.activeQueryId, sortConfig);
      }
    });

    // Set callback for grouping changes
    setGroupingChangeCallback((groupBy: GroupByOption) => {
      if (routerState.activeQueryId) {
        updateQueryGroupBy(routerState.activeQueryId, groupBy);
      }
    });

    // Register callback for browser navigation (back/forward)
    const unsubscribe = onUrlSlugChange(handleUrlSlug);

    // Load query from URL on initial page load
    handleUrlSlug(getSlugFromUrl());

    // Listen for queries created from filters (via QuickFilters "Save as Query")
    function handleQueryCreated(e: Event): void {
      const customEvent = e as CustomEvent<{ query: SavedQuery }>;
      if (customEvent.detail?.query) {
        void loadQuery(customEvent.detail.query);
      }
    }
    document.addEventListener('query-created', handleQueryCreated);

    return () => {
      unsubscribe();
      document.removeEventListener('query-created', handleQueryCreated);
    };
  });

  function handleNewQuery(): void {
    editingQuery = null;
    showQueryForm = true;
  }

  function handleEditQuery(query: SavedQuery): void {
    editingQuery = query;
    showQueryForm = true;
  }

  async function handleSaveQuery(
    title: string,
    jql: string,
    color?: QueryColor,
    showEntryNode?: boolean
  ): Promise<void> {
    if (editingQuery) {
      const isActiveQuery = routerState.activeQueryId === editingQuery.id;
      updateQuery(editingQuery.id, { title, jql, color, showEntryNode });

      // Reload issues if the edited query is currently active
      if (isActiveQuery) {
        await loadIssues(jql, { loadAll: true });
      }
    } else {
      const query = addQuery(title, jql, color);
      if (query && showEntryNode) {
        updateQuery(query.id, { showEntryNode });
      }
    }
    showQueryForm = false;
    editingQuery = null;
  }

  function handleDeleteQuery(query: SavedQuery): void {
    deleteQuery(query.id);
    // Clear active query if the deleted one was active
    if (routerState.activeQueryId === query.id) {
      clearIssues();
    }
  }

  function handleDuplicateQuery(query: SavedQuery): void {
    const duplicated = duplicateQuery(query.id);
    if (duplicated) {
      handleEditQuery(duplicated);
    }
  }

  async function handleSelectQuery(query: SavedQuery): Promise<void> {
    await loadQuery(query);
  }

  function handleCancelForm(): void {
    showQueryForm = false;
    editingQuery = null;
  }

  // Import handlers
  function handleImportClick(): void {
    importFileInput?.click();
  }

  async function handleImportFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const config = await readSingleQueryFile(file);
      const importedQuery = importSingleQuery(config);
      addImportedQuery(importedQuery);
      showImportMessage('success', `Query "${importedQuery.title}" imported`);
    } catch (error) {
      showImportMessage('error', error instanceof Error ? error.message : 'Import failed');
    }

    // Reset input
    input.value = '';
  }

  function showImportMessage(type: 'success' | 'error', text: string): void {
    importMessage = { type, text };
    setTimeout(() => {
      importMessage = null;
    }, 4000);
  }

  // Separator handlers
  function handleNewSeparator(): void {
    addSeparator();
  }

  function handleEditSeparator(separator: QuerySeparator): void {
    updateSeparator(separator.id, separator.title);
  }

  function handleDeleteSeparator(separator: QuerySeparator): void {
    deleteSeparator(separator.id);
  }
</script>

<aside class="h-full bg-background border-r flex flex-col" style="width: {width}px;">
  <!-- Sidebar Header -->
  <div class="h-14 flex items-center justify-between px-4 border-b flex-shrink-0">
    <span class="text-sm font-semibold text-foreground">Queries</span>
    <div class="flex items-center gap-1">
      <Tooltip text="Import Query">
        <Button variant="ghost" size="icon" class="h-8 w-8" onclick={handleImportClick}>
          <AtlaskitIcon name="upload" size={16} />
        </Button>
      </Tooltip>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          class="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3"
        >
          <AtlaskitIcon name="add" size={14} />
          New
          <AtlaskitIcon name="chevron-down" size={12} />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="w-36">
          <DropdownMenu.Item onclick={handleNewQuery}>
            <AtlaskitIcon name="search" size={14} class="mr-2" />
            Query
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={handleNewSeparator}>
            <AtlaskitIcon name="priority-medium" size={14} class="mr-2" />
            Separator
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </div>

  <!-- Hidden File Input for Import -->
  <input
    bind:this={importFileInput}
    type="file"
    accept=".json,application/json"
    class="hidden"
    onchange={handleImportFile}
  />

  <!-- Query List -->
  <div class="flex-1 overflow-y-auto p-2">
    {#if jqlState.items.length === 0}
      <div class="text-center py-12 px-4">
        <div
          class="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center"
        >
          <AtlaskitIcon name="search" size={24} class="text-primary" />
        </div>
        <p class="text-sm font-medium text-foreground mb-1">No saved queries</p>
        <p class="text-xs text-muted-foreground mb-4">Create your first query to get started</p>
        <Button variant="outline" size="sm" onclick={handleNewQuery}>
          <AtlaskitIcon name="add" size={14} />
          Create query
        </Button>
      </div>
    {:else}
      <div class="space-y-1">
        {#each jqlState.items as item, index (item.id)}
          {#if isSeparator(item)}
            <SeparatorListItem
              separator={item}
              {index}
              isDragging={queryDrag.isDragging(index)}
              isDragOver={queryDrag.isDragOver(index)}
              onEdit={handleEditSeparator}
              onDelete={handleDeleteSeparator}
              onDragStart={queryDrag.handleDragStart}
              onDragOver={queryDrag.handleDragOver}
              onDrop={queryDrag.handleDrop}
              onDragEnd={queryDrag.handleDragEnd}
            />
          {:else}
            <QueryListItem
              query={item}
              {index}
              isActive={routerState.activeQueryId === item.id}
              isDragging={queryDrag.isDragging(index)}
              isDragOver={queryDrag.isDragOver(index)}
              onSelect={handleSelectQuery}
              onEdit={handleEditQuery}
              onDelete={handleDeleteQuery}
              onDuplicate={handleDuplicateQuery}
              onDragStart={queryDrag.handleDragStart}
              onDragOver={queryDrag.handleDragOver}
              onDrop={queryDrag.handleDrop}
              onDragEnd={queryDrag.handleDragEnd}
            />
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  <!-- Query Form Modal -->
  {#if showQueryForm}
    <QueryForm query={editingQuery} onSave={handleSaveQuery} onCancel={handleCancelForm} />
  {/if}
</aside>

<!-- Large Result Warning Modal -->
{#if pendingLargeQuery}
  <LargeResultWarningModal
    totalCount={pendingLargeQuery.total}
    onLoadFirst={handleLoadFirstBatch}
    onLoadAll={handleLoadAll}
    onCancel={handleCancelLargeQuery}
  />
{/if}

<!-- Import Notification Toast -->
{#if importMessage}
  <div
    class="fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-bottom-2
      {importMessage.type === 'success'
      ? 'bg-chart-2 text-primary-foreground'
      : 'bg-destructive text-destructive-foreground'}"
  >
    {#if importMessage.type === 'success'}
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    {:else}
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    {/if}
    <span class="text-sm font-medium">{importMessage.text}</span>
  </div>
{/if}
