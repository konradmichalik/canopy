<script lang="ts">
  import AccordionChevron from '../common/AccordionChevron.svelte';
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
    {#if hasChildren}
      <AccordionChevron
        isExpanded={node.isExpanded}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
      />
    {:else}
      <div class="w-6 h-6 flex-shrink-0"></div>
    {/if}

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
