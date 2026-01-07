<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import { Button } from '$lib/components/ui/button';
  import type { SavedQuery, QueryColor } from '../../types';
  import QueryListItem from '../jql/QueryListItem.svelte';
  import QueryForm from '../jql/QueryForm.svelte';
  import {
    jqlState,
    initializeQueries,
    addQuery,
    addImportedQuery,
    updateQuery,
    deleteQuery,
    reorderQueries,
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
  import { loadIssues, clearIssues } from '../../stores/issues.svelte';
  import {
    loadFieldConfig,
    setFieldConfigChangeCallback,
    type DisplayFieldId
  } from '../../stores/fieldConfig.svelte';
  import {
    loadActiveFilters,
    setActiveFiltersChangeCallback,
    setSearchTextChangeCallback
  } from '../../stores/filters.svelte';
  import { loadSortConfig, setSortConfigChangeCallback } from '../../stores/sortConfig.svelte';
  import { loadGroupConfig, setGroupingChangeCallback } from '../../stores/grouping.svelte';
  import type { SortConfig, GroupByOption } from '../../types/tree';
  import { updateQueryGroupBy } from '../../stores/jql.svelte';
  import { readSingleQueryFile, importSingleQuery } from '../../utils/storage';

  interface Props {
    width: number;
    onClose?: () => void;
  }

  let { width, onClose: _onClose }: Props = $props();

  let showQueryForm = $state(false);
  let editingQuery = $state<SavedQuery | null>(null);
  let initialized = false;

  // Drag & Drop state
  let draggedIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);

  // Import state
  let importFileInput: HTMLInputElement;
  let importMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load a query and its associated config
  async function loadQuery(query: SavedQuery, updateUrl: boolean = true): Promise<void> {
    const slug = getQuerySlug(query);
    setActiveQuery(query.id, slug, updateUrl);
    loadFieldConfig(query.id, query.displayFields);
    loadActiveFilters(query.activeFilterIds, query.searchText);
    loadSortConfig(query.id, query.sortConfig);
    loadGroupConfig(query.id, query.groupBy);
    await loadIssues(query.jql);
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
    initializeQueries();

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

    return () => {
      unsubscribe();
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

  function handleSaveQuery(
    title: string,
    jql: string,
    color?: QueryColor,
    showEntryNode?: boolean
  ): void {
    if (editingQuery) {
      updateQuery(editingQuery.id, { title, jql, color, showEntryNode });
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

  async function handleSelectQuery(query: SavedQuery): Promise<void> {
    await loadQuery(query);
  }

  function handleCancelForm(): void {
    showQueryForm = false;
    editingQuery = null;
  }

  // Drag & Drop handlers
  function handleDragStart(index: number): void {
    draggedIndex = index;
  }

  function handleDragOver(e: DragEvent, index: number): void {
    e.preventDefault();
    dragOverIndex = index;
  }

  function handleDrop(index: number): void {
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderQueries(draggedIndex, index);
    }
    draggedIndex = null;
    dragOverIndex = null;
  }

  function handleDragEnd(): void {
    draggedIndex = null;
    dragOverIndex = null;
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
      <Button size="sm" onclick={handleNewQuery} class="h-8">
        <AtlaskitIcon name="add" size={14} />
        New
      </Button>
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
    {#if jqlState.queries.length === 0}
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
        {#each jqlState.queries as query, index (query.id)}
          <QueryListItem
            {query}
            {index}
            isActive={routerState.activeQueryId === query.id}
            isDragging={draggedIndex === index}
            isDragOver={dragOverIndex === index && draggedIndex !== index}
            onSelect={handleSelectQuery}
            onEdit={handleEditQuery}
            onDelete={handleDeleteQuery}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        {/each}
      </div>
    {/if}
  </div>

  <!-- Query Form Modal -->
  {#if showQueryForm}
    <QueryForm query={editingQuery} onSave={handleSaveQuery} onCancel={handleCancelForm} />
  {/if}
</aside>

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
