<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import type { SavedQuery, QueryColor } from '../../types';
  import QueryListItem from '../jql/QueryListItem.svelte';
  import QueryForm from '../jql/QueryForm.svelte';
  import Logo from '../common/Logo.svelte';
  import {
    jqlState,
    initializeQueries,
    addQuery,
    updateQuery,
    deleteQuery,
    updateQueryDisplayFields,
    updateQueryActiveFilters
  } from '../../stores/jql.svelte';
  import { routerState, setActiveQuery } from '../../stores/router.svelte';
  import { loadIssues, clearIssues } from '../../stores/issues.svelte';
  import { downloadConfig, readConfigFile, importConfig } from '../../utils/storage';
  import { initializeConnection } from '../../stores/connection.svelte';
  import {
    loadFieldConfig,
    setFieldConfigChangeCallback,
    type DisplayFieldId
  } from '../../stores/fieldConfig.svelte';
  import {
    loadActiveFilters,
    setActiveFiltersChangeCallback
  } from '../../stores/filters.svelte';

  interface Props {
    width: number;
    onClose: () => void;
  }

  let { width, onClose }: Props = $props();

  let showQueryForm = $state(false);
  let editingQuery = $state<SavedQuery | null>(null);
  let fileInput: HTMLInputElement;
  let importMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
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
  });

  function handleExport(): void {
    downloadConfig();
    showImportMessage('success', 'Configuration exported successfully');
  }

  function handleImportClick(): void {
    fileInput?.click();
  }

  async function handleFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const config = await readConfigFile(file);
      const result = importConfig(config, {
        overwriteConnection: true,
        mergeQueries: true
      });

      // Reload stores to reflect changes
      initializeQueries();
      initializeConnection();

      const messages: string[] = [];
      if (result.imported.connection) {
        messages.push('Connection imported');
      }
      if (result.imported.queriesCount > 0) {
        messages.push(`${result.imported.queriesCount} queries imported`);
      }

      if (messages.length > 0) {
        showImportMessage('success', messages.join(', '));
      } else {
        showImportMessage('success', 'No new data to import');
      }
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
    loadActiveFilters(query.activeFilterIds);
    await loadIssues(query.jql);
  }

  function handleCancelForm(): void {
    showQueryForm = false;
    editingQuery = null;
  }
</script>

<aside
  class="h-full bg-surface-raised border-r border-border flex flex-col"
  style="width: {width}px;"
>
  <!-- Header -->
  <div class="flex items-center justify-between px-3 py-3 border-b border-border">
    <Logo size="sm" showText={false} />

    <div class="flex items-center gap-1">
      <button
        onclick={handleImportClick}
        class="p-1.5 rounded hover:bg-surface-hovered text-text-subtle"
        title="Import Configuration"
      >
        <AtlaskitIcon name="upload" size={16} />
      </button>
      <button
        onclick={handleExport}
        class="p-1.5 rounded hover:bg-surface-hovered text-text-subtle"
        title="Export Configuration"
      >
        <AtlaskitIcon name="download" size={16} />
      </button>
      <button
        onclick={onClose}
        class="p-1.5 rounded hover:bg-surface-hovered text-text-subtle"
        title="Close sidebar"
      >
        <AtlaskitIcon name="sidebar-collapse" size={16} />
      </button>
    </div>
  </div>

  <!-- Query List Header -->
  <div class="flex items-center justify-between px-3 py-2 border-b border-border">
    <span class="text-xs font-medium text-text-subtle uppercase tracking-wide">Queries</span>
    <button
      onclick={handleNewQuery}
      class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-text-brand hover:bg-brand-subtlest rounded transition-colors"
      title="New Query"
    >
      <AtlaskitIcon name="add" size={14} />
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

  <!-- Hidden File Input for Import -->
  <input
    bind:this={fileInput}
    type="file"
    accept=".json,application/json"
    class="hidden"
    onchange={handleFileSelect}
  />

  <!-- Import/Export Notification Toast -->
  {#if importMessage}
    <div
      class="fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-slide-up
        {importMessage.type === 'success'
        ? 'bg-success text-text-inverse'
        : 'bg-danger text-text-inverse'}"
    >
      {#if importMessage.type === 'success'}
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
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
      <span>{importMessage.text}</span>
    </div>
  {/if}
</aside>
