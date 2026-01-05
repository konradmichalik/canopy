<script lang="ts">
  import AtlaskitIcon from './AtlaskitIcon.svelte';
  import { downloadConfig, readConfigFile, importConfig } from '../../utils/storage';
  import { initializeQueries } from '../../stores/jql.svelte';
  import { initializeConnection, disconnect } from '../../stores/connection.svelte';
  import { themeState, setTheme, type Theme } from '../../stores/theme.svelte';
  import {
    displayDensityState,
    setDisplayDensity,
    type DisplayDensity
  } from '../../stores/displayDensity.svelte';
  import { debugModeState, setDebugMode } from '../../stores/debugMode.svelte';

  let isOpen = $state(false);
  let fileInput: HTMLInputElement;
  let importMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

  function toggleDropdown(): void {
    isOpen = !isOpen;
  }

  function closeDropdown(): void {
    isOpen = false;
  }

  function handleThemeChange(theme: Theme): void {
    setTheme(theme);
  }

  function handleDensityChange(density: DisplayDensity): void {
    setDisplayDensity(density);
  }

  function handleExport(): void {
    downloadConfig();
    showMessage('success', 'Configuration exported successfully');
    closeDropdown();
  }

  function handleImportClick(): void {
    fileInput?.click();
    closeDropdown();
  }

  function handleDisconnect(): void {
    if (confirm('Disconnect from JIRA?')) {
      disconnect();
      closeDropdown();
    }
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
        showMessage('success', messages.join(', '));
      } else {
        showMessage('success', 'No new data to import');
      }
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Import failed');
    }

    // Reset input
    input.value = '';
  }

  function showMessage(type: 'success' | 'error', text: string): void {
    importMessage = { type, text };
    setTimeout(() => {
      importMessage = null;
    }, 4000);
  }

  function handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.settings-dropdown')) {
      closeDropdown();
    }
  }

  $effect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  });
</script>

<div class="settings-dropdown relative">
  <button
    onclick={toggleDropdown}
    class="p-2 rounded-lg hover:bg-surface-hovered text-text-subtle transition-colors"
    title="Settings"
  >
    <AtlaskitIcon name="settings" size={20} />
  </button>

  {#if isOpen}
    <div
      class="absolute right-0 top-full mt-1 w-56 bg-surface-overlay border border-border rounded-lg shadow-lg z-50 py-1"
    >
      <!-- Theme Section -->
      <div class="px-3 py-2">
        <span class="text-xs font-medium text-text-subtle uppercase tracking-wide">Theme</span>
        <div class="flex gap-1 mt-2">
          <button
            onclick={() => handleThemeChange('light')}
            class="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded transition-colors
              {themeState.theme === 'light'
              ? 'bg-brand-subtlest text-text-brand font-medium'
              : 'text-text-subtle hover:bg-surface-hovered'}"
          >
            <AtlaskitIcon name="sun" size={14} />
            Light
          </button>
          <button
            onclick={() => handleThemeChange('dark')}
            class="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded transition-colors
              {themeState.theme === 'dark'
              ? 'bg-brand-subtlest text-text-brand font-medium'
              : 'text-text-subtle hover:bg-surface-hovered'}"
          >
            <AtlaskitIcon name="moon" size={14} />
            Dark
          </button>
          <button
            onclick={() => handleThemeChange('system')}
            class="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded transition-colors
              {themeState.theme === 'system'
              ? 'bg-brand-subtlest text-text-brand font-medium'
              : 'text-text-subtle hover:bg-surface-hovered'}"
          >
            <AtlaskitIcon name="theme" size={14} />
            Auto
          </button>
        </div>
      </div>

      <div class="h-px bg-border my-1"></div>

      <!-- Display Density Section -->
      <div class="px-3 py-2">
        <span class="text-xs font-medium text-text-subtle uppercase tracking-wide"
          >Display Density</span
        >
        <div class="flex gap-1 mt-2">
          <button
            onclick={() => handleDensityChange('comfortable')}
            class="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded transition-colors
              {displayDensityState.density === 'comfortable'
              ? 'bg-brand-subtlest text-text-brand font-medium'
              : 'text-text-subtle hover:bg-surface-hovered'}"
          >
            Comfortable
          </button>
          <button
            onclick={() => handleDensityChange('compact')}
            class="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded transition-colors
              {displayDensityState.density === 'compact'
              ? 'bg-brand-subtlest text-text-brand font-medium'
              : 'text-text-subtle hover:bg-surface-hovered'}"
          >
            Compact
          </button>
        </div>
      </div>

      <div class="h-px bg-border my-1"></div>

      <!-- Debug Mode Toggle -->
      <div class="px-3 py-2">
        <button
          onclick={() => setDebugMode(!debugModeState.enabled)}
          class="w-full flex items-center justify-between text-sm text-text hover:bg-surface-hovered rounded px-2 py-1.5 -mx-2 transition-colors"
        >
          <span class="flex items-center gap-2">
            <AtlaskitIcon name="flask" size={16} />
            Debug Mode
          </span>
          <span
            class="w-8 h-5 rounded-full transition-colors relative {debugModeState.enabled
              ? 'bg-brand'
              : 'bg-neutral-bold'}"
          >
            <span
              class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform {debugModeState.enabled
                ? 'translate-x-3.5'
                : 'translate-x-0.5'}"
            ></span>
          </span>
        </button>
      </div>

      <div class="h-px bg-border my-1"></div>

      <!-- Data Section -->
      <button
        onclick={handleImportClick}
        class="w-full flex items-center gap-3 px-3 py-2 text-sm text-text hover:bg-surface-hovered transition-colors text-left"
      >
        <AtlaskitIcon name="upload" size={16} />
        Import Configuration
      </button>
      <button
        onclick={handleExport}
        class="w-full flex items-center gap-3 px-3 py-2 text-sm text-text hover:bg-surface-hovered transition-colors text-left"
      >
        <AtlaskitIcon name="download" size={16} />
        Export Configuration
      </button>

      <div class="h-px bg-border my-1"></div>

      <!-- Logout -->
      <button
        onclick={handleDisconnect}
        class="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-danger hover:bg-danger-subtlest transition-colors text-left"
      >
        <AtlaskitIcon name="log-out" size={16} />
        Disconnect
      </button>
    </div>
  {/if}

  <!-- Hidden File Input for Import -->
  <input
    bind:this={fileInput}
    type="file"
    accept=".json,application/json"
    class="hidden"
    onchange={handleFileSelect}
  />
</div>

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
