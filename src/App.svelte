<script lang="ts">
  import './app.css';
  import ConnectionScreen from './lib/components/screens/ConnectionScreen.svelte';
  import MainLayout from './lib/components/layout/MainLayout.svelte';
  import { connectionState } from './lib/stores/connection.svelte';
  import { initializeRouter } from './lib/stores/router.svelte';
  import { initializeTheme, cleanupTheme } from './lib/stores/theme.svelte';
  import { onMount } from 'svelte';

  onMount(() => {
    initializeTheme();
    initializeRouter();

    return () => {
      cleanupTheme();
    };
  });
</script>

{#if connectionState.isConnected}
  <MainLayout />
{:else}
  <ConnectionScreen />
{/if}
