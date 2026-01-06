<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import type { SavedQuery, QueryColor } from '../../types';
  import QueryListItem from '../jql/QueryListItem.svelte';
  import QueryForm from '../jql/QueryForm.svelte';
  import {
    jqlState,
    initializeQueries,
    addQuery,
    updateQuery,
    deleteQuery,
    reorderQueries,
    updateQueryDisplayFields,
    updateQueryActiveFilters,
    updateQuerySearchText,
    updateQuerySortConfig
  } from '../../stores/jql.svelte';
  import { routerState, setActiveQuery } from '../../stores/router.svelte';
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
  import type { SortConfig } from '../../types/tree';

  interface Props {
    width: number;
    onClose: () => void;
  }

  let { width, onClose }: Props = $props();

  let showQueryForm = $state(false);
  let editingQuery = $state<SavedQuery | null>(null);
  let initialized = false;

  // Drag & Drop state
  let draggedIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);

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
  });

  function handleNewQuery(): void {
    editingQuery = null;
    showQueryForm = true;
  }

  function handleEditQuery(query: SavedQuery): void {
    editingQuery = query;
    showQueryForm = true;
  }

  function handleSaveQuery(title: string, jql: string, color?: QueryColor, showEntryNode?: boolean): void {
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
    setActiveQuery(query.id);
    loadFieldConfig(query.id, query.displayFields);
    loadActiveFilters(query.activeFilterIds, query.searchText);
    loadSortConfig(query.id, query.sortConfig);
    await loadIssues(query.jql);
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
</script>

<aside class="h-full bg-surface-sunken flex flex-col" style="width: {width}px;">
  <!-- Query List Header -->
  <div
    class="h-14 flex items-center justify-between px-4 border-b border-border-bold bg-gradient-to-b from-surface-raised to-surface"
  >
    <span class="text-sm font-semibold text-text tracking-wide">Queries</span>
    <button
      onclick={handleNewQuery}
      class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-brand text-text-inverse hover:bg-brand-hovered rounded-md transition-all duration-200 shadow-sm hover:shadow"
      title="New Query"
    >
      <AtlaskitIcon name="add" size={16} />
      <span>New</span>
    </button>
  </div>

  <!-- Query List -->
  <div class="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
    {#if jqlState.queries.length === 0}
      <div class="text-center py-12 px-4">
        <div
          class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-subtlest flex items-center justify-center"
        >
          <AtlaskitIcon name="search" size={28} color="var(--ds-text-brand)" />
        </div>
        <p class="text-base font-medium text-text mb-1">No saved queries</p>
        <p class="text-sm text-text-subtlest mb-4">Create your first query to get started</p>
        <button
          onclick={handleNewQuery}
          class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-text-brand hover:bg-brand-subtlest rounded-md transition-colors"
        >
          <AtlaskitIcon name="add" size={16} />
          Create query
        </button>
      </div>
    {:else}
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
    {/if}
  </div>

  <!-- Query Form Modal -->
  {#if showQueryForm}
    <QueryForm query={editingQuery} onSave={handleSaveQuery} onCancel={handleCancelForm} />
  {/if}
</aside>
