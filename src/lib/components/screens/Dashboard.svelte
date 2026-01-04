<script lang="ts">
  import { Plus, Settings, LogOut, Download, Upload } from 'lucide-svelte';
  import type { SavedQuery } from '../../types';
  import QueryCard from '../jql/QueryCard.svelte';
  import QueryForm from '../jql/QueryForm.svelte';
  import ThemeToggle from '../common/ThemeToggle.svelte';
  import Avatar from '../common/Avatar.svelte';
  import ConnectionForm from '../connection/ConnectionForm.svelte';
  import {
    jqlState,
    initializeQueries,
    addQuery,
    updateQuery,
    deleteQuery
  } from '../../stores/jql.svelte';
  import {
    connectionState,
    disconnect,
    initializeConnection
  } from '../../stores/connection.svelte';
  import { navigateToTree } from '../../stores/router.svelte';
  import { loadIssues } from '../../stores/issues.svelte';
  import { downloadConfig, readConfigFile, importConfig } from '../../utils/storage';

  let showQueryForm = $state(false);
  let editingQuery = $state<SavedQuery | null>(null);
  let showSettings = $state(false);
  let fileInput: HTMLInputElement;
  let importMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
  let initialized = false;

  // Initialize on mount (run only once)
  $effect(() => {
    if (initialized) return;
    initialized = true;
    initializeQueries();
    initializeConnection();
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

  function handleSaveQuery(title: string, jql: string): void {
    if (editingQuery) {
      updateQuery(editingQuery.id, { title, jql });
    } else {
      addQuery(title, jql);
    }
    showQueryForm = false;
    editingQuery = null;
  }

  function handleDeleteQuery(query: SavedQuery): void {
    deleteQuery(query.id);
  }

  async function handleOpenQuery(query: SavedQuery): Promise<void> {
    navigateToTree(query.id);
    await loadIssues(query.jql);
  }

  function handleCancelForm(): void {
    showQueryForm = false;
    editingQuery = null;
  }

  function handleDisconnect(): void {
    if (confirm('Disconnect from JIRA?')) {
      disconnect();
    }
  }

  const isConnected = $derived(connectionState.isConnected);
</script>

<div class="min-h-screen bg-[var(--color-bg-primary)]">
  <!-- Header -->
  <header class="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
      <h1 class="text-xl font-bold text-[var(--color-text-primary)]">
        JIRA Tree
      </h1>

      <div class="flex items-center gap-3">
        <!-- Import/Export Buttons -->
        <button
          onclick={handleImportClick}
          class="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
          title="Import Configuration"
        >
          <Upload class="w-5 h-5" />
        </button>
        <button
          onclick={handleExport}
          class="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
          title="Export Configuration"
        >
          <Download class="w-5 h-5" />
        </button>

        {#if isConnected}
          <button
            onclick={() => (showSettings = !showSettings)}
            class="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
            title="Settings"
          >
            <Settings class="w-5 h-5" />
          </button>
        {/if}

        <ThemeToggle />

        {#if isConnected && connectionState.currentUser}
          <div class="flex items-center gap-2">
            <Avatar user={connectionState.currentUser} size="md" />
            <span class="text-sm text-[var(--color-text-secondary)] hidden sm:block">
              {connectionState.currentUser.displayName}
            </span>
            <button
              onclick={handleDisconnect}
              class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--color-text-secondary)] hover:text-red-600"
              title="Disconnect"
            >
              <LogOut class="w-4 h-4" />
            </button>
          </div>
        {/if}
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-5xl mx-auto px-4 py-8">
    {#if !isConnected}
      <!-- Connection Form -->
      <div class="max-w-md mx-auto">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            Connect to JIRA
          </h2>
          <p class="text-[var(--color-text-secondary)]">
            Enter your JIRA credentials to get started
          </p>
        </div>

        <div class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
          <ConnectionForm />
        </div>
      </div>
    {:else}
      <!-- Queries Dashboard -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-[var(--color-text-primary)]">
          Saved Queries
        </h2>
        <button
          onclick={handleNewQuery}
          class="flex items-center gap-2 px-4 py-2 bg-jira-blue text-white rounded-lg font-medium hover:bg-jira-blue/90 transition-colors"
        >
          <Plus class="w-4 h-4" />
          New Query
        </button>
      </div>

      {#if jqlState.queries.length === 0}
        <div class="text-center py-12">
          <p class="text-[var(--color-text-secondary)] mb-4">
            No saved queries yet
          </p>
          <button
            onclick={handleNewQuery}
            class="text-jira-blue hover:underline"
          >
            Create your first query
          </button>
        </div>
      {:else}
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {#each jqlState.queries as query (query.id)}
            <QueryCard
              {query}
              onOpen={handleOpenQuery}
              onEdit={handleEditQuery}
              onDelete={handleDeleteQuery}
            />
          {/each}
        </div>
      {/if}
    {/if}
  </main>

  <!-- Query Form Modal -->
  {#if showQueryForm}
    <QueryForm
      query={editingQuery}
      onSave={handleSaveQuery}
      onCancel={handleCancelForm}
    />
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
          ? 'bg-green-600 text-white'
          : 'bg-red-600 text-white'}"
    >
      {#if importMessage.type === 'success'}
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      {:else}
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      {/if}
      <span>{importMessage.text}</span>
    </div>
  {/if}
</div>
