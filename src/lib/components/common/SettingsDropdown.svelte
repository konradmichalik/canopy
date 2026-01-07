<script lang="ts">
  import AtlaskitIcon from './AtlaskitIcon.svelte';
  import Tooltip from './Tooltip.svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { downloadConfig, readConfigFile, importConfig } from '../../utils/storage';
  import { initializeQueries } from '../../stores/jql.svelte';
  import { initializeConnection, disconnect } from '../../stores/connection.svelte';
  import { themeState, setTheme, type Theme } from '../../stores/theme.svelte';
  import {
    colorThemeState,
    setColorTheme,
    COLOR_THEMES,
    type ColorTheme
  } from '../../stores/colorTheme.svelte';
  import {
    displayDensityState,
    setDisplayDensity,
    type DisplayDensity
  } from '../../stores/displayDensity.svelte';
  import { debugModeState, setDebugMode } from '../../stores/debugMode.svelte';

  interface Props {
    minimal?: boolean;
  }

  let { minimal = false }: Props = $props();

  let open = $state(false);
  let fileInput: HTMLInputElement;
  let importMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

  function handleThemeChange(theme: Theme): void {
    setTheme(theme);
  }

  function handleColorThemeChange(colorTheme: ColorTheme): void {
    setColorTheme(colorTheme);
  }

  function handleDensityChange(density: DisplayDensity): void {
    setDisplayDensity(density);
  }

  function handleExport(): void {
    downloadConfig();
    showMessage('success', 'Configuration exported successfully');
    open = false;
  }

  function handleImportClick(): void {
    fileInput?.click();
    open = false;
  }

  function handleDisconnect(): void {
    if (confirm('Disconnect from Jira?')) {
      disconnect();
      open = false;
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
</script>

<DropdownMenu.Root bind:open>
  <Tooltip text="Settings">
    <DropdownMenu.Trigger
      class="inline-flex items-center justify-center size-9 rounded-md hover:bg-accent text-muted-foreground"
    >
      <AtlaskitIcon name="settings" size={20} />
    </DropdownMenu.Trigger>
  </Tooltip>

  <DropdownMenu.Content align="end" class="w-56">
    <!-- Theme Section -->
    <DropdownMenu.Label>Theme</DropdownMenu.Label>
    <div class="flex gap-1 px-2 pb-2">
      <button
        onclick={() => handleThemeChange('light')}
        class="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded transition-colors
          {themeState.theme === 'light'
          ? 'bg-accent text-primary font-medium'
          : 'text-muted-foreground hover:bg-accent'}"
      >
        <AtlaskitIcon name="sun" size={14} />
        Light
      </button>
      <button
        onclick={() => handleThemeChange('dark')}
        class="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded transition-colors
          {themeState.theme === 'dark'
          ? 'bg-accent text-primary font-medium'
          : 'text-muted-foreground hover:bg-accent'}"
      >
        <AtlaskitIcon name="moon" size={14} />
        Dark
      </button>
      <button
        onclick={() => handleThemeChange('system')}
        class="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded transition-colors
          {themeState.theme === 'system'
          ? 'bg-accent text-primary font-medium'
          : 'text-muted-foreground hover:bg-accent'}"
      >
        <AtlaskitIcon name="theme" size={14} />
        Auto
      </button>
    </div>

    <!-- Color Theme Section -->
    <DropdownMenu.Label>Color</DropdownMenu.Label>
    <div class="flex gap-1.5 px-2 pb-2">
      {#each COLOR_THEMES as theme (theme.id)}
        <Tooltip text={theme.label}>
          <button
            onclick={() => handleColorThemeChange(theme.id)}
            class="w-6 h-6 rounded-full transition-all flex items-center justify-center
              {colorThemeState.colorTheme === theme.id
              ? 'ring-2 ring-offset-2 ring-offset-popover ring-foreground/50'
              : 'hover:scale-110'}"
            style="background-color: {theme.color}"
            aria-label={theme.label}
          >
            {#if colorThemeState.colorTheme === theme.id}
              <svg
                class="w-3.5 h-3.5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            {/if}
          </button>
        </Tooltip>
      {/each}
    </div>

    {#if !minimal}
      <DropdownMenu.Separator />

      <!-- Display Density Section -->
      <DropdownMenu.Label>Display Density</DropdownMenu.Label>
      <div class="flex gap-1 px-2 pb-2">
        <button
          onclick={() => handleDensityChange('comfortable')}
          class="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded transition-colors
            {displayDensityState.density === 'comfortable'
            ? 'bg-accent text-primary font-medium'
            : 'text-muted-foreground hover:bg-accent'}"
        >
          Comfortable
        </button>
        <button
          onclick={() => handleDensityChange('compact')}
          class="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs rounded transition-colors
            {displayDensityState.density === 'compact'
            ? 'bg-accent text-primary font-medium'
            : 'text-muted-foreground hover:bg-accent'}"
        >
          Compact
        </button>
      </div>

      <DropdownMenu.Separator />

      <!-- Debug Mode Toggle -->
      <DropdownMenu.Item
        onclick={() => setDebugMode(!debugModeState.enabled)}
        class="justify-between"
      >
        <span class="flex items-center gap-2">
          <AtlaskitIcon name="flask" size={16} />
          Debug Mode
        </span>
        <span
          class="w-8 h-5 rounded-full transition-colors relative flex-shrink-0 {debugModeState.enabled
            ? 'bg-primary'
            : 'bg-muted'}"
        >
          <span
            class="absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform {debugModeState.enabled
              ? 'translate-x-3.5'
              : 'translate-x-0.5'}"
          ></span>
        </span>
      </DropdownMenu.Item>
    {/if}

    <DropdownMenu.Separator />

    <!-- Data Section -->
    <DropdownMenu.Item onclick={handleImportClick}>
      <AtlaskitIcon name="upload" size={16} />
      Import Configuration
    </DropdownMenu.Item>
    {#if !minimal}
      <DropdownMenu.Item onclick={handleExport}>
        <AtlaskitIcon name="download" size={16} />
        Export Configuration
      </DropdownMenu.Item>

      <DropdownMenu.Separator />

      <!-- Logout -->
      <DropdownMenu.Item onclick={handleDisconnect} variant="destructive">
        <AtlaskitIcon name="log-out" size={16} />
        Disconnect
      </DropdownMenu.Item>
    {/if}
  </DropdownMenu.Content>
</DropdownMenu.Root>

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
      ? 'bg-chart-2 text-primary-foreground'
      : 'bg-destructive text-primary-foreground'}"
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
    <span>{importMessage.text}</span>
  </div>
{/if}
