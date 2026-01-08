<script lang="ts">
  import './app.css';
  import ConnectionScreen from './lib/components/screens/ConnectionScreen.svelte';
  import MainLayout from './lib/components/layout/MainLayout.svelte';
  import AppLoader from './lib/components/common/AppLoader.svelte';
  import { connectionState, initializeConnection } from './lib/stores/connection.svelte';
  import { initializeRouter, cleanupRouter } from './lib/stores/router.svelte';
  import { initializeTheme, cleanupTheme } from './lib/stores/theme.svelte';
  import { initializeColorTheme } from './lib/stores/colorTheme.svelte';
  import { initializeFieldConfig } from './lib/stores/fieldConfig.svelte';
  import { initializeDisplayDensity } from './lib/stores/displayDensity.svelte';
  import { initializeDateFormat } from './lib/stores/dateFormat.svelte';
  import { initializeDebugMode } from './lib/stores/debugMode.svelte';
  import { initializeQueries } from './lib/stores/jql.svelte';
  import { initializeHelpModal } from './lib/stores/helpModal.svelte';
  import { initializeAutoRefresh, cleanupAutoRefresh } from './lib/stores/autoRefresh.svelte';
  import {
    initializeKeyboardNavigation,
    cleanupKeyboardNavigation
  } from './lib/stores/keyboardNavigation.svelte';
  import { onMount } from 'svelte';

  let isInitializing = $state(true);

  onMount(() => {
    // Initialize theme first (sync, affects appearance immediately)
    initializeTheme();
    initializeColorTheme();

    // Initialize all stores and connection
    async function initialize() {
      try {
        initializeRouter();
        initializeFieldConfig();
        initializeDisplayDensity();
        initializeDateFormat();
        initializeDebugMode();
        initializeQueries();
        initializeHelpModal();
        initializeAutoRefresh();
        initializeKeyboardNavigation();

        // Try to restore connection from storage
        await initializeConnection();
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
{:else if connectionState.isConnected}
  <div class="animate-fade-in">
    <MainLayout />
  </div>
{:else}
  <div class="animate-fade-in">
    <ConnectionScreen />
  </div>
{/if}
