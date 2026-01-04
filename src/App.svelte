<script lang="ts">
  import './app.css';
  import Dashboard from './lib/components/screens/Dashboard.svelte';
  import TreeScreen from './lib/components/screens/TreeScreen.svelte';
  import { routerState, initializeRouter } from './lib/stores/router.svelte';
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

{#if routerState.currentScreen === 'dashboard'}
  <Dashboard />
{:else if routerState.currentScreen === 'tree'}
  <TreeScreen />
{/if}
