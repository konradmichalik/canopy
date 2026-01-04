<script lang="ts">
  import { ChevronDown, ChevronUp, RefreshCw, Loader2, AlertCircle } from 'lucide-svelte';
  import TreeNode from './TreeNode.svelte';
  import QuickFilters from '../filters/QuickFilters.svelte';
  import {
    issuesState,
    expandAll,
    collapseAll,
    refreshIssues
  } from '../../stores/issues.svelte';
  import { getTreeStats } from '../../utils/hierarchy-builder';

  let isRefreshing = $state(false);

  async function handleRefresh(): Promise<void> {
    isRefreshing = true;
    await refreshIssues();
    isRefreshing = false;
  }

  const stats = $derived(getTreeStats(issuesState.treeNodes));
  const isEmpty = $derived(issuesState.treeNodes.length === 0 && !issuesState.isLoading);
</script>

<div class="tree-view flex flex-col h-full">
  <!-- Toolbar -->
  <div class="flex items-center justify-between gap-4 p-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
    <QuickFilters />

    <div class="flex items-center gap-2">
      {#if !isEmpty}
        <span class="text-xs text-[var(--color-text-secondary)]">
          {stats.totalIssues} issues
        </span>
      {/if}

      <button
        onclick={expandAll}
        disabled={isEmpty || issuesState.isLoading}
        class="p-1.5 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] disabled:opacity-50"
        title="Expand all"
      >
        <ChevronDown class="w-4 h-4" />
      </button>

      <button
        onclick={collapseAll}
        disabled={isEmpty || issuesState.isLoading}
        class="p-1.5 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] disabled:opacity-50"
        title="Collapse all"
      >
        <ChevronUp class="w-4 h-4" />
      </button>

      <button
        onclick={handleRefresh}
        disabled={issuesState.isLoading || isRefreshing}
        class="p-1.5 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] disabled:opacity-50"
        title="Refresh"
      >
        {#if isRefreshing || issuesState.isLoading}
          <Loader2 class="w-4 h-4 animate-spin" />
        {:else}
          <RefreshCw class="w-4 h-4" />
        {/if}
      </button>
    </div>
  </div>

  <!-- Tree Content -->
  <div class="flex-1 overflow-auto p-2">
    {#if issuesState.isLoading && issuesState.treeNodes.length === 0}
      <div class="flex items-center justify-center h-full">
        <div class="flex flex-col items-center gap-3 text-[var(--color-text-secondary)]">
          <Loader2 class="w-8 h-8 animate-spin" />
          <p>Loading issues...</p>
        </div>
      </div>
    {:else if issuesState.error}
      <div class="flex items-center justify-center h-full">
        <div class="flex flex-col items-center gap-3 text-center max-w-md">
          <AlertCircle class="w-8 h-8 text-red-500" />
          <p class="text-red-600 dark:text-red-400">{issuesState.error}</p>
          <button
            onclick={handleRefresh}
            class="px-4 py-2 text-sm font-medium text-jira-blue hover:bg-jira-blue/10 rounded-lg"
          >
            Try again
          </button>
        </div>
      </div>
    {:else if isEmpty}
      <div class="flex items-center justify-center h-full">
        <div class="text-center text-[var(--color-text-secondary)]">
          <p class="mb-2">No issues found</p>
          <p class="text-sm">Try adjusting your JQL query or filters</p>
        </div>
      </div>
    {:else}
      <div class="tree-container">
        {#each issuesState.treeNodes as node (node.issue.key)}
          <TreeNode {node} />
        {/each}
      </div>
    {/if}
  </div>
</div>
