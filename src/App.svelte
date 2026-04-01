<script lang="ts">
  import './app.css';
  import MainLayout from './lib/components/layout/MainLayout.svelte';
  import AppLoader from './lib/components/common/AppLoader.svelte';
  import UpdateNotification from './lib/components/common/UpdateNotification.svelte';
  import ConnectionModal from './lib/components/connection/ConnectionModal.svelte';
  import { connectionRegistry, initializeConnections } from './lib/stores/connection.svelte';
  import { initializeRouter, cleanupRouter } from './lib/stores/router.svelte';
  import { initializeTheme, cleanupTheme } from './lib/stores/theme.svelte';
  import { initializeColorIntensity } from './lib/stores/colorIntensity.svelte';
  import { initializeFieldConfig } from './lib/stores/fieldConfig.svelte';
  import { initializeDisplayDensity } from './lib/stores/displayDensity.svelte';
  import { initializeDateFormat } from './lib/stores/dateFormat.svelte';
  import { initializeDebugMode } from './lib/stores/debugMode.svelte';
  import { initializeDefaultFields } from './lib/stores/defaultFields.svelte';
  import { initializeDefaultSort } from './lib/stores/defaultSort.svelte';
  import { initializeAutoExpandDepth } from './lib/stores/autoExpandDepth.svelte';
  import { initializeQueries, getQueries } from './lib/stores/jql.svelte';
  import { initializeHelpModal } from './lib/stores/helpModal.svelte';
  import { initializeAutoRefresh, cleanupAutoRefresh } from './lib/stores/autoRefresh.svelte';
  import {
    initializeKeyboardNavigation,
    cleanupKeyboardNavigation
  } from './lib/stores/keyboardNavigation.svelte';
  import {
    initializeChangeTracking,
    runCheckpointCleanup
  } from './lib/stores/changeTracking.svelte';
  import { initializeFlags } from './lib/stores/flags.svelte';
  import { checkForUpdate, type UpdateInfo } from './lib/utils/version-check';
  import { onMount } from 'svelte';

  let isInitializing = $state(true);
  let availableUpdate = $state<UpdateInfo | null>(null);
  let showConnectionModal = $state(false);

  const hasConnection = $derived(
    connectionRegistry.connections.some((c) => c.status === 'connected')
  );

  // Auto-open connection modal when no connections exist
  const needsConnection = $derived(!isInitializing && !hasConnection);
  $effect(() => {
    if (needsConnection) showConnectionModal = true;
  });

  onMount(() => {
    // Initialize all stores and connection
    async function initialize() {
      try {
        // Initialize theme first (affects appearance immediately)
        await Promise.all([initializeTheme(), initializeColorIntensity()]);

        // Initialize all other stores in parallel
        await Promise.all([
          initializeRouter(),
          initializeDisplayDensity(),
          initializeDateFormat(),
          initializeDebugMode(),
          initializeDefaultFields(),
          initializeDefaultSort(),
          initializeAutoExpandDepth(),
          initializeQueries(),
          initializeHelpModal(),
          initializeAutoRefresh(),
          initializeChangeTracking(),
          initializeFlags()
        ]);

        // These are still sync
        initializeFieldConfig();
        initializeKeyboardNavigation();

        // Clean up orphaned/stale checkpoints after stores are initialized
        const validQueryIds = new Set(getQueries().map((q) => q.id));
        runCheckpointCleanup(validQueryIds);

        // Initialize connection registry (with migration from single-connection format)
        await initializeConnections();

        // Check for app updates (non-blocking)
        checkForUpdate().then((update) => {
          availableUpdate = update;
        });
      } finally {
        // Small delay to ensure smooth transition
        setTimeout(() => {
          isInitializing = false;
        }, 300);
      }
    }

    initialize();

    return () => {
      cleanupTheme();
      cleanupRouter();
      cleanupAutoRefresh();
      cleanupKeyboardNavigation();
    };
  });
</script>

{#if isInitializing}
  <AppLoader />
{:else}
  <div class="animate-fade-in">
    <MainLayout onManageConnections={() => (showConnectionModal = true)} />
  </div>
{/if}

<ConnectionModal bind:open={showConnectionModal} required={needsConnection} />
<UpdateNotification update={availableUpdate} />
