<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import ConnectionForm from '../connection/ConnectionForm.svelte';
  import ThemeToggle from '../common/ThemeToggle.svelte';
  import Logo from '../common/Logo.svelte';
  import { initializeConnection } from '../../stores/connection.svelte';
  import { initializeQueries } from '../../stores/jql.svelte';
  import { downloadConfig, readConfigFile, importConfig } from '../../utils/storage';

  let fileInput: HTMLInputElement;
  let importMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
  let initialized = false;

  // Initialize on mount (run only once)
  $effect(() => {
    if (initialized) return;
    initialized = true;
    initializeConnection();
    initializeQueries();
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
</script>

<div class="min-h-screen bg-surface">
  <!-- Header -->
  <header class="border-b border-border bg-surface-raised">
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
      <Logo size="md" />

      <div class="flex items-center gap-3">
        <!-- Import/Export Buttons -->
        <button
          onclick={handleImportClick}
          class="p-2 rounded-lg hover:bg-surface-hovered text-text-subtle"
          title="Import Configuration"
        >
          <AtlaskitIcon name="upload" size={20} />
        </button>
        <button
          onclick={handleExport}
          class="p-2 rounded-lg hover:bg-surface-hovered text-text-subtle"
          title="Export Configuration"
        >
          <AtlaskitIcon name="download" size={20} />
        </button>

        <ThemeToggle />
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-5xl mx-auto px-4 py-8">
    <!-- Connection Form -->
    <div class="max-w-md mx-auto">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-text mb-2">Connect to JIRA</h2>
        <p class="text-text-subtle">Enter your JIRA credentials to get started</p>
      </div>

      <div class="bg-surface-raised border border-border rounded-xl p-6">
        <ConnectionForm />
      </div>
    </div>
  </main>

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
</div>
