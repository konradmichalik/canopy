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
    updateQueryDisplayFields,
    updateQueryActiveFilters,
    updateQuerySearchText
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

  interface Props {
    width: number;
    onClose: () => void;
  }

  let { width, onClose }: Props = $props();

  let showQueryForm = $state(false);
  let editingQuery = $state<SavedQuery | null>(null);
  let initialized = false;

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
  });

  function handleNewQuery(): void {
    editingQuery = null;
    showQueryForm = true;
  }

  function handleEditQuery(query: SavedQuery): void {
    editingQuery = query;
    showQueryForm = true;
  }

  function handleSaveQuery(title: string, jql: string, color?: QueryColor): void {
    if (editingQuery) {
      updateQuery(editingQuery.id, { title, jql, color });
    } else {
      addQuery(title, jql, color);
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
    await loadIssues(query.jql);
  }

  function handleCancelForm(): void {
    showQueryForm = false;
    editingQuery = null;
  }
</script>

<aside
  class="h-full bg-surface-sunken border-r border-border-bold flex flex-col shadow-sm"
  style="width: {width}px;"
>
  <!-- Query List Header -->
  <div class="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-raised">
    <span class="text-sm font-semibold text-text-subtle uppercase tracking-wide">Queries</span>
    <button
      onclick={handleNewQuery}
      class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-brand hover:bg-brand-subtlest rounded-lg transition-colors"
      title="New Query"
    >
      <AtlaskitIcon name="add" size={16} />
      New
    </button>
  </div>

  <!-- Query List -->
  <div class="flex-1 overflow-y-auto p-2 space-y-1">
    {#if jqlState.queries.length === 0}
      <div class="text-center py-8">
        <p class="text-sm text-text-subtle mb-2">No saved queries</p>
        <button onclick={handleNewQuery} class="text-sm text-text-brand hover:underline">
          Create your first query
        </button>
      </div>
    {:else}
      {#each jqlState.queries as query (query.id)}
        <QueryListItem
          {query}
          isActive={routerState.activeQueryId === query.id}
          onSelect={handleSelectQuery}
          onEdit={handleEditQuery}
          onDelete={handleDeleteQuery}
        />
      {/each}
    {/if}
  </div>

  <!-- Query Form Modal -->
  {#if showQueryForm}
    <QueryForm query={editingQuery} onSave={handleSaveQuery} onCancel={handleCancelForm} />
  {/if}
</aside>
