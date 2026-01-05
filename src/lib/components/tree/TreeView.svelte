<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import TreeNode from './TreeNode.svelte';
  import IssueCardSkeleton from './IssueCardSkeleton.svelte';
  import QuickFilters from '../filters/QuickFilters.svelte';
  import FieldSelector from './FieldSelector.svelte';
  import { issuesState, expandAll, collapseAll, refreshIssues } from '../../stores/issues.svelte';
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
        <FieldSelector />

        <div class="w-px h-4 bg-border mx-1"></div>

        <button
          onclick={expandAll}
          disabled={isEmpty || issuesState.isLoading}
          class="p-1.5 rounded hover:bg-surface-hovered text-text-subtle disabled:opacity-50"
          title="Expand all"
        >
          <AtlaskitIcon name="chevron-down" size={16} />
        </button>

        <button
          onclick={collapseAll}
          disabled={isEmpty || issuesState.isLoading}
          class="p-1.5 rounded hover:bg-surface-hovered text-text-subtle disabled:opacity-50"
          title="Collapse all"
        >
          <AtlaskitIcon name="chevron-up" size={16} />
        </button>

        <button
          onclick={handleRefresh}
          disabled={issuesState.isLoading || isRefreshing}
          class="p-1.5 rounded hover:bg-surface-hovered text-text-subtle disabled:opacity-50"
          title="Refresh"
        >
          <AtlaskitIcon name="refresh" size={16} class={isRefreshing || issuesState.isLoading ? 'animate-spin' : ''} />
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
    {#if issuesState.isLoading}
      <div class="tree-container">
        {#each Array(8) as _, i}
          <IssueCardSkeleton depth={i < 2 ? 0 : i < 5 ? 1 : 2} />
        {/each}
      </div>
    {:else if issuesState.error}
      <div class="flex items-center justify-center h-full">
        <div class="flex flex-col items-center gap-3 text-center max-w-md">
          <AtlaskitIcon name="warning" size={32} color="var(--color-text-danger)" />
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
          <div
            class="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-hovered flex items-center justify-center"
          >
            <AtlaskitIcon name="search" size={32} color="var(--color-text-subtlest)" />
          </div>
          <p class="text-lg mb-2">No issues found <span class="opacity-70">:(</span></p>
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
