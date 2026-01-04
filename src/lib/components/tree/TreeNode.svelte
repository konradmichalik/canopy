<script lang="ts">
  import { ChevronRight, ChevronDown } from 'lucide-svelte';
  import type { TreeNode as TreeNodeType } from '../../types';
  import IssueCard from './IssueCard.svelte';
  import { toggleNode } from '../../stores/issues.svelte';

  interface Props {
    node: TreeNodeType;
  }

  let { node }: Props = $props();

  function handleToggle(): void {
    if (node.children.length > 0) {
      toggleNode(node.issue.key);
    }
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  }

  const hasChildren = $derived(node.children.length > 0);
  const indent = $derived(node.depth * 24);
</script>

<div class="tree-node">
  <!-- Node Row -->
  <div
    class="flex items-center hover:bg-[var(--color-bg-secondary)] rounded px-2 group"
    style="padding-left: {indent + 8}px"
    onclick={handleToggle}
    onkeydown={handleKeydown}
    role={hasChildren ? 'button' : undefined}
    tabindex={hasChildren ? 0 : -1}
  >
    <!-- Expand/Collapse Toggle -->
    <div class="w-5 h-5 flex items-center justify-center flex-shrink-0">
      {#if hasChildren}
        <button
          onclick={handleToggle}
          class="p-0.5 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
          aria-expanded={node.isExpanded}
          aria-label={node.isExpanded ? 'Collapse' : 'Expand'}
        >
          {#if node.isExpanded}
            <ChevronDown class="w-4 h-4" />
          {:else}
            <ChevronRight class="w-4 h-4" />
          {/if}
        </button>
      {/if}
    </div>

    <!-- Issue Card -->
    <IssueCard issue={node.issue} />
  </div>

  <!-- Children -->
  {#if node.isExpanded && hasChildren}
    <div class="children">
      {#each node.children as child (child.issue.key)}
        <svelte:self node={child} />
      {/each}
    </div>
  {/if}
</div>
