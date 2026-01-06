<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import type { TreeNode as TreeNodeType } from '../../types';
  import IssueCard from './IssueCard.svelte';
  import { toggleNode } from '../../stores/issues.svelte';
  import { keyboardNavState, setFocusedKey } from '../../stores/keyboardNavigation.svelte';

  interface Props {
    node: TreeNodeType;
  }

  let { node }: Props = $props();
  let nodeRef: HTMLDivElement | null = $state(null);

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

  function handleClick(): void {
    setFocusedKey(node.issue.key);
    handleToggle();
  }

  const hasChildren = $derived(node.children.length > 0);
  const indent = $derived(node.depth * 24);
  const isFocused = $derived(keyboardNavState.focusedKey === node.issue.key);

  // Scroll into view when focused via keyboard
  $effect(() => {
    if (isFocused && nodeRef && keyboardNavState.isNavigating) {
      nodeRef.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
</script>

<div class="tree-node">
  <!-- Node Row -->
  <div
    bind:this={nodeRef}
    class="flex items-center hover:bg-surface-hovered rounded px-2 group transition-colors {isFocused
      ? 'bg-brand-subtlest ring-2 ring-brand ring-inset'
      : ''}"
    style="padding-left: {indent + 8}px"
    onclick={handleClick}
    onkeydown={handleKeydown}
    role="treeitem"
    aria-expanded={hasChildren ? node.isExpanded : undefined}
    aria-selected={isFocused}
    tabindex={-1}
  >
    <!-- Expand/Collapse Toggle -->
    <div class="w-6 h-6 flex items-center justify-center flex-shrink-0">
      {#if hasChildren}
        <button
          onclick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          class="p-1 rounded hover:bg-surface-sunken text-text-subtle"
          aria-expanded={node.isExpanded}
          aria-label={node.isExpanded ? 'Collapse' : 'Expand'}
        >
          {#if node.isExpanded}
            <AtlaskitIcon name="chevron-down" size={20} />
          {:else}
            <AtlaskitIcon name="chevron-right" size={20} />
          {/if}
        </button>
      {/if}
    </div>

    <!-- Issue Card -->
    <IssueCard {node} />
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
