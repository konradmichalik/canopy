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
  <div class="border-b border-border bg-surface-raised">
    <!-- Actions row -->
    <div class="flex items-center justify-between gap-4 px-3 py-2">
      <div class="flex items-center gap-2">
        {#if !isEmpty}
          <span class="text-sm font-medium text-text">
            {stats.totalIssues} Issues
          </span>
        {/if}
      </div>

      <div class="flex items-center gap-1">
        <button
          onclick={expandAll}
          disabled={isEmpty || issuesState.isLoading}
          class="p-1.5 rounded hover:bg-surface-hovered text-text-subtle disabled:opacity-50"
          title="Expand all"
        >
          <ChevronDown class="w-4 h-4" />
        </button>

        <button
          onclick={collapseAll}
          disabled={isEmpty || issuesState.isLoading}
          class="p-1.5 rounded hover:bg-surface-hovered text-text-subtle disabled:opacity-50"
          title="Collapse all"
        >
          <ChevronUp class="w-4 h-4" />
        </button>

        <button
          onclick={handleRefresh}
          disabled={issuesState.isLoading || isRefreshing}
          class="p-1.5 rounded hover:bg-surface-hovered text-text-subtle disabled:opacity-50"
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

    <!-- Filters row -->
    <div class="px-3 py-2 border-t border-border">
      <QuickFilters />
    </div>
  </div>

  <!-- Tree Content -->
  <div class="flex-1 overflow-auto p-2">
    {#if issuesState.isLoading && issuesState.treeNodes.length === 0}
      <div class="flex items-center justify-center h-full">
        <div class="flex flex-col items-center gap-3 text-text-subtle">
          <Loader2 class="w-8 h-8 animate-spin" />
          <p>Loading issues...</p>
        </div>
      </div>
    {:else if issuesState.error}
      <div class="flex items-center justify-center h-full">
        <div class="flex flex-col items-center gap-3 text-center max-w-md">
          <AlertCircle class="w-8 h-8 text-text-danger" />
          <p class="text-text-danger">{issuesState.error}</p>
          <button
            onclick={handleRefresh}
            class="px-4 py-2 text-sm font-medium text-text-brand hover:bg-brand-subtlest rounded-lg"
          >
            Try again
          </button>
        </div>
      </div>
    {:else if isEmpty}
      <div class="flex items-center justify-center h-full">
        <div class="text-center text-text-subtle">
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
