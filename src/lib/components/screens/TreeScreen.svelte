<script lang="ts">
  import { ArrowLeft } from 'lucide-svelte';
  import TreeView from '../tree/TreeView.svelte';
  import ThemeToggle from '../common/ThemeToggle.svelte';
  import { navigateToDashboard, routerState } from '../../stores/router.svelte';
  import { getQueryById } from '../../stores/jql.svelte';
  import { clearIssues } from '../../stores/issues.svelte';

  function handleBack(): void {
    clearIssues();
    navigateToDashboard();
  }

  const query = $derived(
    routerState.activeQueryId ? getQueryById(routerState.activeQueryId) : null
  );
  const title = $derived(query?.title || 'Query Results');
</script>

<div class="min-h-screen bg-surface flex flex-col">
  <!-- Header -->
  <header class="border-b border-border bg-surface-raised">
    <div class="px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          onclick={handleBack}
          class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-subtle hover:text-text hover:bg-surface-hovered rounded-lg transition-colors"
        >
          <ArrowLeft class="w-4 h-4" />
          Back
        </button>

        <div class="h-6 w-px bg-border"></div>

        <h1 class="text-lg font-semibold text-text">
          {title}
        </h1>
      </div>

      <ThemeToggle />
    </div>
  </header>

  <!-- Tree View -->
  <main class="flex-1 flex flex-col overflow-hidden">
    <TreeView />
  </main>
</div>
