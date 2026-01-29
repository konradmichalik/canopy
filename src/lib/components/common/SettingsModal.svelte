<script lang="ts">
  import AtlaskitIcon from './AtlaskitIcon.svelte';
  import Tooltip from './Tooltip.svelte';
  import AboutModal from './AboutModal.svelte';
  import FlashMessage from './FlashMessage.svelte';
  import ConfirmModal from './ConfirmModal.svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Tabs } from 'bits-ui';
  import { Switch } from '$lib/components/ui/switch';
  import { Button } from '$lib/components/ui/button';
  import { downloadConfig, readConfigFile, importConfig } from '../../utils/storage';
  import { initializeQueries, getQueries } from '../../stores/jql.svelte';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { initializeConnection, disconnect, connectionState } from '../../stores/connection.svelte';
  import Avatar from './Avatar.svelte';
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
  import { dateFormatState, setDateFormat, type DateFormat } from '../../stores/dateFormat.svelte';
  import { debugModeState, setDebugMode } from '../../stores/debugMode.svelte';
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
    ACTIVITY_PERIOD_OPTIONS
  } from '../../stores/changeTracking.svelte';
  import type { ActivityPeriod } from '../../types/changeTracking';
  import { openHelpModal } from '../../stores/helpModal.svelte';
  import { formatDateTimeWithSetting, formatDateTime } from '../../utils/formatDate';

  interface Props {
    minimal?: boolean;
  }

  let { minimal = false }: Props = $props();

  let open = $state(false);
  let activeTab = $state('appearance');
  let showAboutModal = $state(false);
  let showDisconnectModal = $state(false);
  let fileInput: HTMLInputElement;
  let importMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
  let includeCredentials = $state(true);

  const queryCount = $derived(getQueries().length);

  function handleThemeChange(theme: Theme): void {
    setTheme(theme);
  }

  function handleColorThemeChange(colorTheme: ColorTheme): void {
    setColorTheme(colorTheme);
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

  function handleActivityPeriodChange(period: ActivityPeriod): void {
    setActivityPeriod(period);
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

  function handleDisconnectClick(): void {
    open = false;
    showDisconnectModal = true;
  }

  async function handleDisconnectConfirm(): Promise<void> {
    await disconnect();
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
      await initializeConnection();

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

  function handleAboutClick(): void {
    showAboutModal = true;
    open = false;
  }

  function handleHelpClick(): void {
    open = false;
    openHelpModal();
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
        class="flex w-full h-auto px-4 py-2 rounded-none border-b bg-transparent justify-start gap-1"
      >
        <Tabs.Trigger
          value="appearance"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md data-[state=active]:bg-accent data-[state=active]:shadow-none"
        >
          <AtlaskitIcon name="theme" size={14} />
          Appearance
        </Tabs.Trigger>
        {#if !minimal}
          <Tabs.Trigger
            value="behavior"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md data-[state=active]:bg-accent data-[state=active]:shadow-none"
          >
            <AtlaskitIcon name="settings" size={14} />
            Behavior
          </Tabs.Trigger>
          <Tabs.Trigger
            value="tracking"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md data-[state=active]:bg-accent data-[state=active]:shadow-none"
          >
            <AtlaskitIcon name="clock" size={14} />
            Tracking
          </Tabs.Trigger>
        {/if}
        <Tabs.Trigger
          value="data"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md data-[state=active]:bg-accent data-[state=active]:shadow-none"
        >
          <AtlaskitIcon name="folder" size={14} />
          Data
        </Tabs.Trigger>
        <Tabs.Trigger
          value="help"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md data-[state=active]:bg-accent data-[state=active]:shadow-none"
        >
          <AtlaskitIcon name="question-circle" size={14} />
          Help
        </Tabs.Trigger>
        {#if !minimal}
          <Tabs.Trigger
            value="account"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md data-[state=active]:bg-accent data-[state=active]:shadow-none"
          >
            <AtlaskitIcon name="person" size={14} />
            Account
          </Tabs.Trigger>
        {/if}
      </Tabs.List>

      <!-- Appearance Tab -->
      <Tabs.Content value="appearance" class="mt-0 px-6 py-4 space-y-5">
        <!-- Theme -->
        <div class="space-y-2">
          <span class="text-sm font-medium">Theme</span>
          <div class="flex gap-1">
            <button
              onclick={() => handleThemeChange('light')}
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md transition-colors
                {themeState.theme === 'light'
                ? 'bg-accent text-primary font-medium'
                : 'text-muted-foreground hover:bg-accent'}"
            >
              <AtlaskitIcon name="sun" size={14} />
              Light
            </button>
            <button
              onclick={() => handleThemeChange('dark')}
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md transition-colors
                {themeState.theme === 'dark'
                ? 'bg-accent text-primary font-medium'
                : 'text-muted-foreground hover:bg-accent'}"
            >
              <AtlaskitIcon name="moon" size={14} />
              Dark
            </button>
            <button
              onclick={() => handleThemeChange('system')}
              class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md transition-colors
                {themeState.theme === 'system'
                ? 'bg-accent text-primary font-medium'
                : 'text-muted-foreground hover:bg-accent'}"
            >
              <AtlaskitIcon name="theme" size={14} />
              Auto
            </button>
          </div>
        </div>

        <!-- Color Theme -->
        <div class="space-y-2">
          <span class="text-sm font-medium">Accent Color</span>
          <div class="flex gap-2">
            {#each COLOR_THEMES as theme (theme.id)}
              <Tooltip text={theme.label}>
                <button
                  onclick={() => handleColorThemeChange(theme.id)}
                  class="w-8 h-8 rounded-full transition-all flex items-center justify-center
                    {colorThemeState.colorTheme === theme.id
                    ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground/50'
                    : 'hover:scale-110'}"
                  style="background-color: {theme.color}"
                  aria-label={theme.label}
                >
                  {#if colorThemeState.colorTheme === theme.id}
                    <svg
                      class="w-4 h-4 text-white"
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
        </div>

        {#if !minimal}
          <div class="grid grid-cols-2 gap-4">
            <!-- Display Density -->
            <div class="space-y-2">
              <span class="text-sm font-medium">Display Density</span>
              <div class="flex gap-1">
                <button
                  onclick={() => handleDensityChange('comfortable')}
                  class="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs rounded-md transition-colors
                    {displayDensityState.density === 'comfortable'
                    ? 'bg-accent text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent'}"
                >
                  Comfortable
                </button>
                <button
                  onclick={() => handleDensityChange('compact')}
                  class="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs rounded-md transition-colors
                    {displayDensityState.density === 'compact'
                    ? 'bg-accent text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent'}"
                >
                  Compact
                </button>
              </div>
            </div>

            <!-- Date Format -->
            <div class="space-y-2">
              <span class="text-sm font-medium">Date Format</span>
              <div class="flex gap-1">
                <button
                  onclick={() => handleDateFormatChange('absolute')}
                  class="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs rounded-md transition-colors
                    {dateFormatState.format === 'absolute'
                    ? 'bg-accent text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent'}"
                >
                  Absolute
                </button>
                <button
                  onclick={() => handleDateFormatChange('relative')}
                  class="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs rounded-md transition-colors
                    {dateFormatState.format === 'relative'
                    ? 'bg-accent text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent'}"
                >
                  Relative
                </button>
              </div>
            </div>
          </div>
        {/if}
      </Tabs.Content>

      {#if !minimal}
        <!-- Behavior Tab -->
        <Tabs.Content value="behavior" class="mt-0 px-6 py-4">
          <div class="grid grid-cols-2 gap-4">
            <!-- Auto-Refresh -->
            <div class="space-y-2">
              <span class="text-sm font-medium">Auto-Refresh</span>
              <div class="flex gap-1">
                {#each AUTO_REFRESH_OPTIONS as option (option.value)}
                  <button
                    onclick={() => handleAutoRefreshChange(option.value)}
                    class="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs rounded-md transition-colors
                      {autoRefreshState.interval === option.value
                      ? 'bg-accent text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent'}"
                  >
                    {option.label}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Debug Mode -->
            <div class="space-y-2">
              <span class="text-sm font-medium">Debug Mode</span>
              <div class="flex items-center justify-between h-[34px] px-3 rounded-md bg-muted/50">
                <div class="flex items-center gap-2">
                  <AtlaskitIcon name="flask" size={14} class="text-muted-foreground" />
                  <span class="text-xs text-muted-foreground">Enable</span>
                </div>
                <Switch
                  checked={debugModeState.enabled}
                  onCheckedChange={(checked) => setDebugMode(checked)}
                />
              </div>
            </div>
          </div>
        </Tabs.Content>

        <!-- Tracking Tab -->
        <Tabs.Content value="tracking" class="mt-0 px-6 py-4 space-y-5">
          <!-- Feature Description -->
          <div class="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <p>
              <strong class="text-foreground">Change Tracking</strong> allows you to track changes to
              issues. Create checkpoints to save the current state and easily see which issues have
              changed later.
            </p>
          </div>

          <!-- Enable Toggle -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium">Enable Change Tracking</span>
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
            <div class="space-y-2">
              <span class="text-sm font-medium">Activity Period</span>
              <p class="text-xs text-muted-foreground">
                Issues older than this period are considered inactive
              </p>
              <div class="flex gap-1">
                {#each ACTIVITY_PERIOD_OPTIONS as option (option.value)}
                  <button
                    onclick={() => handleActivityPeriodChange(option.value)}
                    class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md transition-colors
                      {changeTrackingState.activityPeriod === option.value
                      ? 'bg-accent text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent'}"
                  >
                    {option.label}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Indicator Visibility -->
            <div class="flex items-center justify-between pt-3 border-t">
              <span class="text-sm font-medium">Show Change Indicators</span>
              <Switch
                checked={changeTrackingState.showIndicators}
                onCheckedChange={(checked) => setShowIndicators(checked)}
              />
            </div>
          {/if}
        </Tabs.Content>
      {/if}

      <!-- Data Tab -->
      <Tabs.Content value="data" class="mt-0 px-6 py-4 space-y-4">
        <!-- Current Data Info -->
        <div class="grid grid-cols-2 gap-3">
          <div class="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <AtlaskitIcon name="search" size={18} class="text-muted-foreground" />
            <div>
              <p class="text-lg font-semibold">{queryCount}</p>
              <p class="text-xs text-muted-foreground">Saved Queries</p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <AtlaskitIcon name="person" size={18} class="text-muted-foreground" />
            <div>
              <p class="text-lg font-semibold">{connectionState.isConnected ? 1 : 0}</p>
              <p class="text-xs text-muted-foreground">Connection</p>
            </div>
          </div>
        </div>

        <!-- Import/Export -->
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <Button variant="outline" class="justify-start gap-2" onclick={handleImportClick}>
              <AtlaskitIcon name="upload" size={16} />
              Import
            </Button>

            {#if !minimal}
              <Button variant="outline" class="justify-start gap-2" onclick={handleExport}>
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
      </Tabs.Content>

      <!-- Help Tab -->
      <Tabs.Content value="help" class="mt-0 px-6 py-4 space-y-4">
        <!-- Keyboard Shortcuts -->
        <div class="space-y-3">
          <span class="text-sm font-medium">Keyboard Shortcuts</span>
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

        <div class="pt-2 border-t">
          <div class="grid grid-cols-2 gap-3">
            <Button variant="outline" class="justify-start gap-2" onclick={handleHelpClick}>
              <AtlaskitIcon name="video-play" size={16} />
              Feature Guide
            </Button>

            <Button variant="outline" class="justify-start gap-2" onclick={handleAboutClick}>
              <AtlaskitIcon name="status-information" size={16} />
              About Canopy
            </Button>
          </div>
        </div>
      </Tabs.Content>

      <!-- Account Tab -->
      {#if !minimal}
        <Tabs.Content value="account" class="mt-0 px-6 py-4 space-y-4">
          {#if connectionState.isConnected && connectionState.currentUser}
            <!-- User Info -->
            <div class="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar user={connectionState.currentUser} size="md" />
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate">{connectionState.currentUser.displayName}</p>
                <p class="text-sm text-muted-foreground truncate">
                  {connectionState.currentUser.emailAddress || (connectionState.config?.credentials.type === 'cloud' ? connectionState.config.credentials.email : '')}
                </p>
              </div>
            </div>

            <!-- Connection Details -->
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <p class="text-xs text-muted-foreground">Jira URL</p>
                <p class="text-sm truncate">{connectionState.config?.baseUrl}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-muted-foreground">Instance Type</p>
                <p class="text-sm">{connectionState.config?.instanceType === 'cloud' ? 'Cloud' : 'Server / DC'}</p>
              </div>
            </div>

            {#if connectionState.lastConnected}
              <Tooltip text={`Connected: ${formatDateTime(connectionState.lastConnected)}`}>
                <span class="inline-flex px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                  Connected {formatDateTimeWithSetting(connectionState.lastConnected)}
                </span>
              </Tooltip>
            {/if}

            <!-- Disconnect -->
            <div class="pt-2 border-t">
              <Button
                variant="destructive"
                class="w-full justify-start gap-2"
                onclick={handleDisconnectClick}
              >
                <AtlaskitIcon name="log-out" size={16} />
                Disconnect
              </Button>
            </div>
          {:else}
            <div class="text-center py-4 text-muted-foreground">
              <AtlaskitIcon name="person-offboard" size={32} class="mx-auto mb-2 opacity-50" />
              <p>Not connected</p>
            </div>
          {/if}
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

<!-- About Modal -->
<AboutModal bind:open={showAboutModal} onClose={() => (showAboutModal = false)} />

<!-- Disconnect Confirmation Modal -->
<ConfirmModal
  bind:open={showDisconnectModal}
  title="Disconnect from Jira?"
  description="You will need to enter your credentials again to reconnect."
  confirmLabel="Disconnect"
  variant="destructive"
  icon="log-out"
  onConfirm={handleDisconnectConfirm}
/>
