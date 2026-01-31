<script lang="ts">
  import AccordionChevron from '../common/AccordionChevron.svelte';
  import type { TreeNode as TreeNodeType } from '../../types';
  import IssueCard from './IssueCard.svelte';
  import IssueContextMenu from './IssueContextMenu.svelte';
  import { toggleNode } from '../../stores/issues.svelte';
  import {
    keyboardNavState,
    setFocusedKey,
    getVisibleNodes
  } from '../../stores/keyboardNavigation.svelte';
  import { flagsState, getFlagHexColor } from '../../stores/flags.svelte';
  import {
    selectionState,
    toggleSelection,
    selectRange,
    isSelected
  } from '../../stores/selection.svelte';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import TreeNode from './TreeNode.svelte';

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

  function handleClick(e: MouseEvent): void {
    setFocusedKey(node.issue.key);

    if (e.ctrlKey || e.metaKey) {
      toggleSelection(node.issue.key);
      return;
    }

    if (e.shiftKey) {
      e.preventDefault();
      selectRange(node.issue.key, getVisibleNodes());
      return;
    }

    handleToggle();
  }

  function handleCheckboxClick(e: MouseEvent): void {
    e.stopPropagation();
    if (e.shiftKey) {
      selectRange(node.issue.key, getVisibleNodes());
    } else {
      toggleSelection(node.issue.key);
    }
  }

  const hasChildren = $derived(node.children.length > 0);
  const indent = $derived(node.depth * 24);
  const isFocused = $derived(keyboardNavState.focusedKey === node.issue.key);
  const selected = $derived(isSelected(node.issue.key));
  const inSelectionMode = $derived(selectionState.selectionMode);
  const flagColor = $derived(flagsState.flags[node.issue.key] ?? null);
  const flagBorderStyle = $derived(
    flagColor ? `border-left: 3px solid ${getFlagHexColor(flagColor)}` : ''
  );

  // Scroll into view when focused via keyboard
  $effect(() => {
    if (isFocused && nodeRef && keyboardNavState.isNavigating) {
      nodeRef.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
</script>

<div class="tree-node">
  <!-- Node Row -->
  <IssueContextMenu {node}>
    <div
      bind:this={nodeRef}
      class="flex items-center gap-1 hover:bg-surface-hovered rounded px-2 group transition-colors
        {isFocused ? 'ring-2 ring-brand ring-inset' : ''}
        {selected ? 'bg-brand-subtlest/50' : ''}
        {isFocused && !selected ? 'bg-brand-subtlest' : ''}"
      style="padding-left: {indent + 8}px; {flagBorderStyle}"
      onclick={handleClick}
      onkeydown={handleKeydown}
      role="treeitem"
      aria-expanded={hasChildren ? node.isExpanded : undefined}
      aria-selected={selected || isFocused}
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
        <div class="w-6 flex-shrink-0"></div>
      {/if}

      <!-- Selection Checkbox (only visible in selection mode) -->
      {#if inSelectionMode}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="w-6 mr-1 flex-shrink-0 flex items-center justify-center"
          onclick={handleCheckboxClick}
        >
          <Checkbox checked={selected} class="size-4 rounded-[4px] [&_svg]:size-3" />
        </div>
      {/if}

      <!-- Issue Card -->
      <IssueCard {node} />
    </div>
  </IssueContextMenu>

  <!-- Children -->
  {#if node.isExpanded && hasChildren}
    <div class="children">
      {#each node.children as child (child.issue.key)}
        <TreeNode node={child} />
      {/each}
    </div>
  {/if}
</div>
