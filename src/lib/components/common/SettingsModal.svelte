<script lang="ts">
  import AtlaskitIcon from './AtlaskitIcon.svelte';
  import Tooltip from './Tooltip.svelte';
  import FlashMessage from './FlashMessage.svelte';
  import ConfirmModal from './ConfirmModal.svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Tabs } from 'bits-ui';
  import { Switch } from '$lib/components/ui/switch';
  import { Button } from '$lib/components/ui/button';
  import {
    downloadConfig,
    readConfigFile,
    importConfig,
    clearTemporaryData,
    getCacheSize
  } from '../../utils/storage';
  import { initializeQueries, getQueries } from '../../stores/jql.svelte';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { initializeConnections, connectionRegistry } from '../../stores/connection.svelte';
  import { QUERY_COLORS } from '../../types/tree';
  import ConnectionModal from '../connection/ConnectionModal.svelte';
  import Avatar from './Avatar.svelte';
  import { themeState, setTheme, type Theme } from '../../stores/theme.svelte';
  import {
    colorIntensityState,
    setColorIntensity,
    COLOR_INTENSITY_OPTIONS,
    type ColorIntensity
  } from '../../stores/colorIntensity.svelte';
  import {
    displayDensityState,
    setDisplayDensity,
    type DisplayDensity
  } from '../../stores/displayDensity.svelte';
  import { dateFormatState, setDateFormat, type DateFormat } from '../../stores/dateFormat.svelte';
  import { debugModeState, setDebugMode } from '../../stores/debugMode.svelte';
  import { toggleDefaultField, isDefaultField } from '../../stores/defaultFields.svelte';
  import {
    defaultSortState,
    setDefaultSortField,
    setDefaultSortDirection
  } from '../../stores/defaultSort.svelte';
  import {
    autoExpandDepthState,
    setAutoExpandDepth,
    AUTO_EXPAND_OPTIONS,
    type AutoExpandDepthValue
  } from '../../stores/autoExpandDepth.svelte';
  import { ALL_FIELDS, type DisplayFieldId } from '../../stores/fieldConfig.svelte';
  import { SORT_FIELDS } from '../../types/tree';
  import type { SortField } from '../../types/tree';
  import {
    autoRefreshState,
    setAutoRefreshInterval,
    AUTO_REFRESH_OPTIONS,
    type AutoRefreshInterval
  } from '../../stores/autoRefresh.svelte';
  import {
    changeTrackingState,
    setChangeTrackingEnabled,
    setActivityPeriod,
    setShowIndicators,
    setExcludeOwnChanges,
    setStaleCheckpointDays,
    ACTIVITY_PERIOD_OPTIONS,
    STALE_CHECKPOINT_OPTIONS,
    type StaleCheckpointDays
  } from '../../stores/changeTracking.svelte';
  import type { ActivityPeriod } from '../../types/changeTracking';
  import { openHelpModal } from '../../stores/helpModal.svelte';

  interface Props {
    minimal?: boolean;
  }

  let { minimal = false }: Props = $props();

  let open = $state(false);
  let activeTab = $state('appearance');
  let showClearCacheModal = $state(false);
  let keepFlagsOnClear = $state(true);
  let fileInput: HTMLInputElement;
  let importMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
  let includeCredentials = $state(true);
  let cacheSize = $state<string>('...');

  let showConnectionModal = $state(false);

  const queryCount = $derived(getQueries().length);

  // Load cache size when modal opens
  $effect(() => {
    if (open && activeTab === 'data') {
      getCacheSize().then(({ formatted }) => {
        cacheSize = formatted;
      });
    }
  });

  function handleThemeChange(theme: Theme): void {
    setTheme(theme);
  }

  function handleColorIntensityChange(intensity: ColorIntensity): void {
    setColorIntensity(intensity);
  }

  function handleDensityChange(density: DisplayDensity): void {
    setDisplayDensity(density);
  }

  function handleDateFormatChange(format: DateFormat): void {
    setDateFormat(format);
  }

  function handleAutoRefreshChange(interval: AutoRefreshInterval): void {
    setAutoRefreshInterval(interval);
  }

  function handleDefaultSortFieldChange(field: SortField): void {
    setDefaultSortField(field);
  }

  function handleDefaultSortDirectionToggle(): void {
    setDefaultSortDirection(defaultSortState.config.direction === 'asc' ? 'desc' : 'asc');
  }

  function handleAutoExpandChange(depth: AutoExpandDepthValue): void {
    setAutoExpandDepth(depth);
  }

  function handleDefaultFieldToggle(fieldId: DisplayFieldId): void {
    toggleDefaultField(fieldId);
  }

  function handleActivityPeriodChange(period: ActivityPeriod): void {
    setActivityPeriod(period);
  }

  function handleStaleCheckpointDaysChange(days: StaleCheckpointDays): void {
    setStaleCheckpointDays(days);
  }

  function handleExport(): void {
    downloadConfig({ includeCredentials });
    const message = includeCredentials
      ? 'Configuration exported (with credentials)'
      : 'Queries exported (without credentials)';
    showMessage('success', message);
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

      await initializeQueries();
      await initializeConnections();

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

    input.value = '';
  }

  function showMessage(type: 'success' | 'error', text: string): void {
    importMessage = { type, text };
    setTimeout(() => {
      importMessage = null;
    }, 4000);
  }

  function handleHelpClick(): void {
    open = false;
    openHelpModal();
  }

  function handleClearCacheClick(): void {
    showClearCacheModal = true;
  }

  async function handleClearCacheConfirm(): Promise<void> {
    const cleared = await clearTemporaryData({ keepFlags: keepFlagsOnClear });
    showMessage('success', `Cache cleared (${cleared} items removed)`);
    showClearCacheModal = false;
    // Update cache size display
    const { formatted } = await getCacheSize();
    cacheSize = formatted;
  }
</script>

<!-- Trigger Button -->
<Tooltip text="Settings">
  <button
    onclick={() => (open = true)}
    class="inline-flex items-center justify-center size-9 rounded-md hover:bg-accent text-muted-foreground"
  >
    <AtlaskitIcon name="settings" size={20} />
  </button>
</Tooltip>

<!-- Settings Modal -->
<Dialog.Root bind:open>
  <Dialog.Content class="max-w-xl p-0 gap-0">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b">
      <h2 class="text-lg font-semibold">Settings</h2>
      <Dialog.Close />
    </div>

    <!-- Tabs -->
    <Tabs.Root bind:value={activeTab} class="gap-0">
      <Tabs.List
        class="flex w-full h-auto px-4 pt-2 pb-0 rounded-none border-b border-border bg-transparent justify-start gap-0"
      >
        <Tabs.Trigger
          value="appearance"
          class="flex items-center gap-1.5 px-3 py-2 text-xs transition-colors border-b-2 -mb-px data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
        >
          <AtlaskitIcon name="theme" size={14} />
          Appearance
        </Tabs.Trigger>
        {#if !minimal}
          <Tabs.Trigger
            value="behavior"
            class="flex items-center gap-1.5 px-3 py-2 text-xs transition-colors border-b-2 -mb-px data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
          >
            <AtlaskitIcon name="settings" size={14} />
            Behavior
          </Tabs.Trigger>
          <Tabs.Trigger
            value="tracking"
            class="flex items-center gap-1.5 px-3 py-2 text-xs transition-colors border-b-2 -mb-px data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
          >
            <AtlaskitIcon name="clock" size={14} />
            Tracking
          </Tabs.Trigger>
        {/if}
        <Tabs.Trigger
          value="data"
          class="flex items-center gap-1.5 px-3 py-2 text-xs transition-colors border-b-2 -mb-px data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
        >
          <AtlaskitIcon name="folder" size={14} />
          Data
        </Tabs.Trigger>
        <Tabs.Trigger
          value="help"
          class="flex items-center gap-1.5 px-3 py-2 text-xs transition-colors border-b-2 -mb-px data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
        >
          <AtlaskitIcon name="question-circle" size={14} />
          Help
        </Tabs.Trigger>
        {#if !minimal}
          <Tabs.Trigger
            value="account"
            class="flex items-center gap-1.5 px-3 py-2 text-xs transition-colors border-b-2 -mb-px data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
          >
            <AtlaskitIcon name="person" size={14} />
            Account
          </Tabs.Trigger>
        {/if}
      </Tabs.List>

      <!-- Appearance Tab -->
      <Tabs.Content value="appearance" class="mt-0 px-6 py-5 min-h-[280px] space-y-5">
        <!-- Theme -->
        <div class="space-y-2">
          <span class="settings-label">Theme</span>
          <p class="settings-desc">Light, dark, or follow your system preference</p>
          <div class="segmented-control" role="group" aria-label="Theme">
            <button
              onclick={() => handleThemeChange('light')}
              class={themeState.theme === 'light' ? 'seg-active' : ''}
              aria-pressed={themeState.theme === 'light'}
            >
              <AtlaskitIcon name="sun" size={14} />
              Light
            </button>
            <button
              onclick={() => handleThemeChange('dark')}
              class={themeState.theme === 'dark' ? 'seg-active' : ''}
              aria-pressed={themeState.theme === 'dark'}
            >
              <AtlaskitIcon name="moon" size={14} />
              Dark
            </button>
            <button
              onclick={() => handleThemeChange('system')}
              class={themeState.theme === 'system' ? 'seg-active' : ''}
              aria-pressed={themeState.theme === 'system'}
            >
              <AtlaskitIcon name="theme" size={14} />
              Auto
            </button>
          </div>
        </div>

        <div class="border-b border-border/50"></div>

        <!-- Color Intensity -->
        <div class="space-y-2">
          <span class="settings-label">Color Palette</span>
          <p class="settings-desc">Intensity of colors for status indicators and labels</p>
          <div class="segmented-control" role="group" aria-label="Color Palette">
            {#each COLOR_INTENSITY_OPTIONS as option (option.id)}
              <button
                onclick={() => handleColorIntensityChange(option.id)}
                class={colorIntensityState.intensity === option.id ? 'seg-active' : ''}
                aria-pressed={colorIntensityState.intensity === option.id}
                title={option.description}
              >
                {option.label}
              </button>
            {/each}
          </div>
        </div>

        {#if !minimal}
          <div class="border-b border-border/50"></div>

          <!-- Display Density -->
          <div class="space-y-2">
            <span class="settings-label">Display Density</span>
            <p class="settings-desc">Spacing between tree items</p>
            <div class="segmented-control" role="group" aria-label="Display Density">
              <button
                onclick={() => handleDensityChange('comfortable')}
                class={displayDensityState.density === 'comfortable' ? 'seg-active' : ''}
                aria-pressed={displayDensityState.density === 'comfortable'}
              >
                Comfortable
              </button>
              <button
                onclick={() => handleDensityChange('compact')}
                class={displayDensityState.density === 'compact' ? 'seg-active' : ''}
                aria-pressed={displayDensityState.density === 'compact'}
              >
                Compact
              </button>
            </div>
          </div>

          <div class="border-b border-border/50"></div>

          <!-- Date Format -->
          <div class="space-y-2">
            <span class="settings-label">Date Format</span>
            <p class="settings-desc">Exact timestamps or relative time</p>
            <div class="segmented-control" role="group" aria-label="Date Format">
              <button
                onclick={() => handleDateFormatChange('absolute')}
                class={dateFormatState.format === 'absolute' ? 'seg-active' : ''}
                aria-pressed={dateFormatState.format === 'absolute'}
              >
                Absolute
              </button>
              <button
                onclick={() => handleDateFormatChange('relative')}
                class={dateFormatState.format === 'relative' ? 'seg-active' : ''}
                aria-pressed={dateFormatState.format === 'relative'}
              >
                Relative
              </button>
            </div>
          </div>
        {/if}
      </Tabs.Content>

      {#if !minimal}
        <!-- Behavior Tab -->
        <Tabs.Content value="behavior" class="mt-0 px-6 py-5 min-h-[280px] space-y-5">
          <!-- Auto-Refresh -->
          <div class="space-y-2">
            <span class="settings-label">Auto-Refresh</span>
            <p class="settings-desc">Reload issues automatically</p>
            <div class="segmented-control" role="group" aria-label="Auto-Refresh">
              {#each AUTO_REFRESH_OPTIONS as option (option.value)}
                <button
                  onclick={() => handleAutoRefreshChange(option.value)}
                  class={autoRefreshState.interval === option.value ? 'seg-active' : ''}
                  aria-pressed={autoRefreshState.interval === option.value}
                >
                  {option.label}
                </button>
              {/each}
            </div>
          </div>

          <div class="border-b border-border/50"></div>

          <!-- Debug Mode -->
          <div class="flex items-center justify-between">
            <div>
              <span class="settings-label">Debug Mode</span>
              <p class="settings-desc">Log API calls and store changes to console</p>
            </div>
            <Switch
              checked={debugModeState.enabled}
              onCheckedChange={(checked) => setDebugMode(checked)}
            />
          </div>

          <div class="border-b border-border/50"></div>

          <!-- Default Sort Order -->
          <div class="space-y-2">
            <span class="settings-label">Default Sort Order</span>
            <p class="settings-desc">Applied to new queries without custom sort</p>
            <div class="flex items-center gap-2">
              <div class="segmented-control flex-1" role="group" aria-label="Default Sort">
                {#each SORT_FIELDS as field (field.id)}
                  <button
                    onclick={() => handleDefaultSortFieldChange(field.id)}
                    class={defaultSortState.config.field === field.id ? 'seg-active' : ''}
                    aria-pressed={defaultSortState.config.field === field.id}
                  >
                    {field.label}
                  </button>
                {/each}
              </div>
              <button
                onclick={handleDefaultSortDirectionToggle}
                class="flex items-center justify-center size-8 rounded-md transition-colors hover:bg-surface-hovered text-muted-foreground"
                title={defaultSortState.config.direction === 'asc' ? 'Ascending' : 'Descending'}
              >
                {#if defaultSortState.config.direction === 'asc'}
                  <AtlaskitIcon name="arrow-up" size={14} />
                {:else}
                  <AtlaskitIcon name="arrow-down" size={14} />
                {/if}
              </button>
            </div>
          </div>

          <div class="border-b border-border/50"></div>

          <!-- Auto-Expand Depth -->
          <div class="space-y-2">
            <span class="settings-label">Auto-Expand Depth</span>
            <p class="settings-desc">Automatically expand tree nodes on first load</p>
            <div class="segmented-control" role="group" aria-label="Auto-Expand Depth">
              {#each AUTO_EXPAND_OPTIONS as option (option.value)}
                <button
                  onclick={() => handleAutoExpandChange(option.value)}
                  class={autoExpandDepthState.depth === option.value ? 'seg-active' : ''}
                  aria-pressed={autoExpandDepthState.depth === option.value}
                >
                  {option.label}
                </button>
              {/each}
            </div>
          </div>

          <div class="border-b border-border/50"></div>

          <!-- Default Fields -->
          <div class="space-y-2">
            <span class="settings-label">Default Fields</span>
            <p class="settings-desc">Fields shown on issue cards for new queries</p>
            <div class="flex flex-wrap gap-1.5">
              {#each ALL_FIELDS as field (field.id)}
                <button
                  onclick={() => handleDefaultFieldToggle(field.id)}
                  class="px-2.5 py-1 text-xs rounded-md border transition-colors
                    {isDefaultField(field.id)
                    ? 'bg-information/15 border-information/30 text-information font-medium'
                    : 'bg-background border-border/50 text-muted-foreground hover:bg-surface-hovered hover:border-border'}"
                >
                  {field.label}
                </button>
              {/each}
            </div>
          </div>
        </Tabs.Content>

        <!-- Tracking Tab -->
        <Tabs.Content value="tracking" class="mt-0 px-6 py-5 min-h-[280px] space-y-5">
          <!-- Feature Description -->
          <div class="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <p>
              <strong class="text-foreground">Change Tracking</strong> allows you to track changes to
              issues. Create checkpoints to save the current state and easily see which issues have changed
              later.
            </p>
          </div>

          <!-- Enable Toggle -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="settings-label">Enable Change Tracking</span>
              <span
                class="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium"
              >
                Beta
              </span>
            </div>
            <Switch
              checked={changeTrackingState.isEnabled}
              onCheckedChange={(checked) => setChangeTrackingEnabled(checked)}
            />
          </div>

          <!-- Activity Period (only shown when enabled) -->
          {#if changeTrackingState.isEnabled}
            <div class="border-b border-border/50"></div>

            <div class="space-y-2">
              <span class="settings-label">Activity Period</span>
              <p class="settings-desc">Issues older than this period are considered inactive</p>
              <div class="segmented-control" role="group" aria-label="Activity Period">
                {#each ACTIVITY_PERIOD_OPTIONS as option (option.value)}
                  <button
                    onclick={() => handleActivityPeriodChange(option.value)}
                    class={changeTrackingState.activityPeriod === option.value ? 'seg-active' : ''}
                    aria-pressed={changeTrackingState.activityPeriod === option.value}
                  >
                    {option.label}
                  </button>
                {/each}
              </div>
            </div>

            <div class="border-b border-border/50"></div>

            <!-- Indicator Visibility -->
            <div class="flex items-center justify-between">
              <span class="settings-label">Show Change Indicators</span>
              <Switch
                checked={changeTrackingState.showIndicators}
                onCheckedChange={(checked) => setShowIndicators(checked)}
              />
            </div>

            <div class="border-b border-border/50"></div>

            <!-- Stale Checkpoint Alert -->
            <div class="space-y-2">
              <span class="settings-label">Stale Checkpoint Alert</span>
              <p class="settings-desc">
                Highlight the Check button when checkpoint is older than this
              </p>
              <div class="segmented-control" role="group" aria-label="Stale Checkpoint Alert">
                {#each STALE_CHECKPOINT_OPTIONS as option (option.value)}
                  <button
                    onclick={() => handleStaleCheckpointDaysChange(option.value)}
                    class={changeTrackingState.staleCheckpointDays === option.value
                      ? 'seg-active'
                      : ''}
                    aria-pressed={changeTrackingState.staleCheckpointDays === option.value}
                  >
                    {option.label}
                  </button>
                {/each}
              </div>
            </div>

            <div class="border-b border-border/50"></div>

            <!-- Exclude Own Changes (Experimental) -->
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <span class="settings-label">Exclude Own Changes</span>
                  <span
                    class="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-medium"
                  >
                    Experimental
                  </span>
                </div>
                <p class="settings-desc">Hide changes you made yourself</p>
              </div>
              <Switch
                checked={changeTrackingState.excludeOwnChanges}
                onCheckedChange={(checked) => setExcludeOwnChanges(checked)}
              />
            </div>
          {/if}
        </Tabs.Content>
      {/if}

      <!-- Data Tab -->
      <Tabs.Content value="data" class="mt-0 px-6 py-5 min-h-[280px] space-y-5">
        <!-- Current Data Info -->
        <div class="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <AtlaskitIcon name="search" size={18} class="text-muted-foreground" />
          <div>
            <p class="text-lg font-bold font-data">{queryCount}</p>
            <p class="settings-desc">Saved Queries</p>
          </div>
        </div>

        <!-- Import/Export -->
        <div class="pt-3 border-t space-y-3">
          <div class="flex gap-3">
            <Button
              variant="outline"
              class="flex-1 justify-start gap-2"
              onclick={handleImportClick}
            >
              <AtlaskitIcon name="upload" size={16} />
              Import
            </Button>

            {#if !minimal}
              <Button variant="outline" class="flex-1 justify-start gap-2" onclick={handleExport}>
                <AtlaskitIcon name="download" size={16} />
                Export
              </Button>
            {/if}
          </div>

          {#if !minimal}
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox bind:checked={includeCredentials} />
              <span class="text-muted-foreground">Include login credentials in export</span>
            </label>
          {/if}
        </div>

        <!-- Clear Cache -->
        {#if !minimal}
          <div class="pt-3 border-t space-y-3">
            <div class="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <AtlaskitIcon name="folder" size={18} class="text-muted-foreground" />
              <div>
                <p class="text-lg font-bold font-data">{cacheSize}</p>
                <p class="settings-desc">Cache Size</p>
              </div>
            </div>
            <div class="space-y-1">
              <span class="settings-label">Clear Cache</span>
              <p class="settings-desc">
                Remove temporary data like expanded nodes, change tracking checkpoints, and UI
                state. Your queries, connection, and settings will be preserved.
              </p>
            </div>
            <Button
              variant="outline"
              class="justify-start gap-2 text-destructive hover:text-destructive"
              onclick={handleClearCacheClick}
            >
              <AtlaskitIcon name="delete" size={16} />
              Clear Cache
            </Button>
          </div>
        {/if}
      </Tabs.Content>

      <!-- Help Tab -->
      <Tabs.Content value="help" class="mt-0 px-6 py-5 min-h-[280px] space-y-5">
        <!-- Keyboard Shortcuts -->
        <div class="space-y-3">
          <span class="settings-label">Keyboard Shortcuts</span>
          <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div class="flex items-center gap-2">
              <kbd class="px-1.5 py-0.5 text-xs bg-muted rounded border">↑</kbd>
              <kbd class="px-1.5 py-0.5 text-xs bg-muted rounded border">↓</kbd>
              <span class="text-muted-foreground">Navigate</span>
            </div>
            <div class="flex items-center gap-2">
              <kbd class="px-1.5 py-0.5 text-xs bg-muted rounded border">←</kbd>
              <span class="text-muted-foreground">Collapse / Parent</span>
            </div>
            <div class="flex items-center gap-2">
              <kbd class="px-1.5 py-0.5 text-xs bg-muted rounded border">→</kbd>
              <span class="text-muted-foreground">Expand / Child</span>
            </div>
            <div class="flex items-center gap-2">
              <kbd class="px-1.5 py-0.5 text-xs bg-muted rounded border">Space</kbd>
              <span class="text-muted-foreground">Toggle expand</span>
            </div>
            <div class="flex items-center gap-2">
              <kbd class="px-1.5 py-0.5 text-xs bg-muted rounded border">Enter</kbd>
              <span class="text-muted-foreground">Open in Jira</span>
            </div>
            <div class="flex items-center gap-2">
              <kbd class="px-1.5 py-0.5 text-xs bg-muted rounded border">Esc</kbd>
              <span class="text-muted-foreground">Clear selection</span>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">Also supports vim keys: j/k/h/l</p>
        </div>

        <div class="pt-3 border-t">
          <Button variant="outline" class="justify-start gap-2" onclick={handleHelpClick}>
            <AtlaskitIcon name="video-play" size={16} />
            Feature Guide
          </Button>
        </div>
      </Tabs.Content>

      <!-- Account Tab -->
      {#if !minimal}
        <Tabs.Content value="account" class="mt-0 px-6 py-4 min-h-[280px] space-y-4">
          {#if connectionRegistry.connections.length > 0}
            <!-- Connection List (read-only) -->
            {#each connectionRegistry.connections as conn (conn.id)}
              {@const colorEntry = conn.config.color
                ? QUERY_COLORS.find((c) => c.id === conn.config.color)
                : null}
              <div class="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                {#if conn.currentUser}
                  <Avatar user={conn.currentUser} size="md" />
                {:else}
                  <div class="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <AtlaskitIcon name="person-offboard" size={20} class="text-muted-foreground" />
                  </div>
                {/if}
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="font-medium truncate">
                      {conn.currentUser?.displayName ?? conn.config.label}
                    </p>
                    <span
                      class="text-[10px] font-semibold px-1.5 py-0.5 rounded truncate max-w-[5rem] {colorEntry
                        ? ''
                        : 'bg-muted text-text-subtlest'}"
                      style:color={colorEntry
                        ? `var(--color-query-${conn.config.color})`
                        : undefined}
                      style:background-color={colorEntry
                        ? `var(--query-${conn.config.color}-bg)`
                        : undefined}
                    >
                      {conn.config.label}
                    </span>
                  </div>
                  <p class="text-sm text-muted-foreground truncate">
                    {conn.config.baseUrl}
                    <span class="text-text-subtle">
                      ({conn.config.instanceType === 'cloud' ? 'Cloud' : 'Server'})
                    </span>
                  </p>
                </div>
                <span
                  class="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 {conn.status ===
                  'connected'
                    ? 'bg-success-subtlest text-text-success'
                    : conn.status === 'error'
                      ? 'bg-danger-subtlest text-text-danger'
                      : 'bg-muted text-muted-foreground'}"
                >
                  {conn.status === 'connected'
                    ? 'Connected'
                    : conn.status === 'error'
                      ? 'Error'
                      : 'Offline'}
                </span>
              </div>
            {/each}
          {:else}
            <div class="text-center py-4 text-muted-foreground">
              <AtlaskitIcon name="person-offboard" size={32} class="mx-auto mb-2 opacity-50" />
              <p>No connections configured</p>
            </div>
          {/if}

          <Button
            variant="outline"
            size="sm"
            class="w-full"
            onclick={() => {
              open = false;
              showConnectionModal = true;
            }}
          >
            <AtlaskitIcon name="settings" size={14} />
            Manage Connections
          </Button>
        </Tabs.Content>
      {/if}
    </Tabs.Root>
  </Dialog.Content>
</Dialog.Root>

<!-- Hidden File Input for Import -->
<input
  bind:this={fileInput}
  type="file"
  accept=".json,application/json"
  class="hidden"
  onchange={handleFileSelect}
/>

<FlashMessage message={importMessage} />

<!-- Clear Cache Confirmation Modal -->
<ConfirmModal
  bind:open={showClearCacheModal}
  title="Clear Cache?"
  confirmLabel="Clear Cache"
  variant="destructive"
  icon="delete"
  onConfirm={handleClearCacheConfirm}
>
  {#snippet description()}
    <div class="space-y-3">
      <p>This will remove:</p>
      <ul class="list-disc list-inside text-sm space-y-1 text-muted-foreground">
        <li>Change tracking checkpoints and pending changes</li>
        <li>Expanded/collapsed node states</li>
        <li>Sidebar and UI state</li>
        <li>Update check history</li>
      </ul>
      <p class="text-sm">Your queries, connection, and settings will be preserved.</p>
      <label class="flex items-center gap-2 pt-2 border-t cursor-pointer">
        <Checkbox bind:checked={keepFlagsOnClear} />
        <span>Keep issue flags (color markers)</span>
      </label>
    </div>
  {/snippet}
</ConfirmModal>

<ConnectionModal bind:open={showConnectionModal} />
