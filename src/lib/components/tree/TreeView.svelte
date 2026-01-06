<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import TreeNode from './TreeNode.svelte';
  import IssueCardSkeleton from './IssueCardSkeleton.svelte';
  import QuickFilters from '../filters/QuickFilters.svelte';
  import FieldSelector from './FieldSelector.svelte';
  import SortDropdown from './SortDropdown.svelte';
  import GroupByDropdown from './GroupByDropdown.svelte';
  import GroupHeader from './GroupHeader.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import { issuesState, expandAll, collapseAll, refreshIssues } from '../../stores/issues.svelte';
  import { getEpicLinkFieldId } from '../../stores/connection.svelte';
  import { getTreeStats } from '../../utils/hierarchy-builder';
  import { getActiveFilterConditions } from '../../stores/filters.svelte';
  import { applyQuickFilters } from '../../utils/jql-helpers';
  import { debugModeState } from '../../stores/debugMode.svelte';
  import {
    keyboardNavState,
    handleTreeKeydown,
    clearFocus
  } from '../../stores/keyboardNavigation.svelte';
  import { groupingState, groupIssues, type IssueGroup } from '../../stores/grouping.svelte';

  let isRefreshing = $state(false);
  let showJqlDebug = $state(false);
  let treeContainerRef: HTMLDivElement | null = $state(null);
  let expandedGroups = $state<Set<string>>(new Set());

  async function handleRefresh(): Promise<void> {
    isRefreshing = true;
    await refreshIssues();
    isRefreshing = false;
  }

  const stats = $derived(getTreeStats(issuesState.treeNodes));
  const isEmpty = $derived(issuesState.treeNodes.length === 0 && !issuesState.isLoading);

  // Compute grouped issues when grouping is active
  const isGrouped = $derived(groupingState.groupBy !== 'none');
  const issueGroups = $derived<IssueGroup[]>(
    isGrouped
      ? groupIssues(issuesState.rawIssues, groupingState.groupBy, getEpicLinkFieldId() ?? undefined)
      : []
  );

  // Initialize expanded groups (expand active sprints by default)
  $effect(() => {
    if (isGrouped && issueGroups.length > 0 && expandedGroups.size === 0) {
      const initialExpanded = new Set<string>();
      for (const group of issueGroups) {
        // Auto-expand active sprints and first few groups
        if (
          group.metadata?.type === 'sprint' &&
          (group.metadata as { state: string }).state === 'active'
        ) {
          initialExpanded.add(group.id);
        }
      }
      // If no active sprints, expand first group
      if (initialExpanded.size === 0 && issueGroups.length > 0) {
        initialExpanded.add(issueGroups[0].id);
      }
      expandedGroups = initialExpanded;
    }
  });

  function toggleGroup(groupId: string): void {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    expandedGroups = newExpanded;
  }

  function expandAllGroups(): void {
    expandedGroups = new Set(issueGroups.map((g) => g.id));
  }

  function collapseAllGroups(): void {
    expandedGroups = new Set();
  }

  // Debug: Compute effective JQL with filters
  const filterConditions = $derived(getActiveFilterConditions());
  const effectiveJql = $derived(
    issuesState.currentJql ? applyQuickFilters(issuesState.currentJql, filterConditions) : ''
  );

  // Handle keyboard navigation
  function onKeyDown(event: KeyboardEvent): void {
    handleTreeKeydown(event);
  }

  // Clear focus when clicking outside tree nodes
  function onTreeClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Only clear if clicking the container itself, not a tree node
    if (target === treeContainerRef || target.classList.contains('tree-container')) {
      clearFocus();
    }
  }

  // Focus the container when entering for keyboard nav
  function onTreeFocus(): void {
    // Auto-select first node if nothing selected
    if (!keyboardNavState.focusedKey && issuesState.treeNodes.length > 0) {
      // Don't auto-select, let user press arrow key first
    }
  }
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
        {#if keyboardNavState.isNavigating}
          <span
            class="text-xs text-text-subtlest bg-surface-sunken px-1.5 py-0.5 rounded font-mono"
          >
            {keyboardNavState.focusedKey}
          </span>
        {/if}
      </div>

      <div class="flex items-center gap-1">
        <GroupByDropdown />
        <FieldSelector />
        <SortDropdown />

        <div class="w-px h-4 bg-border mx-1"></div>

        <button
          onclick={isGrouped ? expandAllGroups : expandAll}
          disabled={isEmpty || issuesState.isLoading}
          class="p-1.5 rounded hover:bg-surface-hovered text-text-subtle disabled:opacity-50"
          title="Expand all"
        >
          <AtlaskitIcon name="chevron-down" size={16} />
        </button>

        <button
          onclick={isGrouped ? collapseAllGroups : collapseAll}
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
          <AtlaskitIcon
            name="refresh"
            size={16}
            class={isRefreshing || issuesState.isLoading ? 'animate-spin' : ''}
          />
        </button>

        <div class="w-px h-4 bg-border mx-1"></div>

        <Tooltip
          content="<div class='text-left space-y-1'>
            <div class='font-semibold mb-2'>Keyboard Shortcuts</div>
            <div><kbd class='kbd'>↑</kbd> <kbd class='kbd'>↓</kbd> Navigate</div>
            <div><kbd class='kbd'>←</kbd> Collapse / Parent</div>
            <div><kbd class='kbd'>→</kbd> Expand / Child</div>
            <div><kbd class='kbd'>Space</kbd> Toggle expand</div>
            <div><kbd class='kbd'>Enter</kbd> Open in JIRA</div>
            <div><kbd class='kbd'>Home</kbd> <kbd class='kbd'>End</kbd> First / Last</div>
            <div><kbd class='kbd'>Esc</kbd> Clear selection</div>
            <div class='text-text-subtlest mt-2 text-xs'>Also: j/k/h/l (vim)</div>
          </div>"
          placement="bottom-end"
          html
        >
          <button
            class="p-1.5 rounded hover:bg-surface-hovered text-text-subtle disabled:opacity-50"
            disabled={isEmpty || issuesState.isLoading}
          >
            <AtlaskitIcon name="keyboard" size={16} />
          </button>
        </Tooltip>
      </div>
    </div>

    <!-- Filters row -->
    <div class="px-3 py-2 border-t border-border">
      <QuickFilters />
    </div>

    <!-- JQL Debug (only visible when debug mode is enabled) -->
    {#if debugModeState.enabled}
      <div class="px-3 py-1.5 border-t border-border bg-surface-sunken">
        <button
          onclick={() => (showJqlDebug = !showJqlDebug)}
          class="flex items-center gap-1.5 text-xs text-text-subtlest hover:text-text-subtle transition-colors"
        >
          <AtlaskitIcon
            name="chevron-right"
            size={12}
            class="transition-transform {showJqlDebug ? 'rotate-90' : ''}"
          />
          <span>JQL Debug</span>
          {#if filterConditions.length > 0}
            <span class="text-text-brand"
              >({filterConditions.length} filter{filterConditions.length > 1 ? 's' : ''})</span
            >
          {/if}
        </button>
        {#if showJqlDebug}
          <div class="mt-2 space-y-2 text-xs">
            <div>
              <span class="text-text-subtlest">Base JQL:</span>
              <code
                class="block mt-1 p-2 bg-surface rounded border border-border text-text-subtle break-all font-mono"
              >
                {issuesState.currentJql || '(none)'}
              </code>
            </div>
            {#if filterConditions.length > 0}
              <div>
                <span class="text-text-subtlest">Filter conditions:</span>
                <ul class="mt-1 space-y-1">
                  {#each filterConditions as condition (condition)}
                    <li
                      class="p-1.5 bg-brand-subtlest rounded border border-brand-subtle text-text-brand font-mono"
                    >
                      {condition}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
            <div>
              <span class="text-text-subtlest">Effective JQL:</span>
              <code
                class="block mt-1 p-2 bg-surface rounded border border-border text-text break-all font-mono font-medium"
              >
                {effectiveJql || '(none)'}
              </code>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Tree Content -->
  <div
    bind:this={treeContainerRef}
    class="flex-1 overflow-auto p-2 outline-none"
    tabindex="0"
    role="tree"
    aria-label="Issue hierarchy tree"
    onkeydown={onKeyDown}
    onclick={onTreeClick}
    onfocus={onTreeFocus}
  >
    {#if issuesState.isLoading}
      <div class="tree-container">
        {#each Array(8) as _, i (i)}
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
    {:else if isGrouped}
      <!-- Grouped View -->
      <div class="grouped-container space-y-3">
        {#each issueGroups as group (group.id)}
          <div class="group-section">
            <GroupHeader
              {group}
              isExpanded={expandedGroups.has(group.id)}
              onToggle={() => toggleGroup(group.id)}
            />

            {#if expandedGroups.has(group.id)}
              <div class="tree-container mt-2 ml-2 pl-4 border-l-2 border-border">
                {#each group.treeNodes as node (node.issue.key)}
                  <TreeNode {node} />
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <!-- Default Hierarchy View -->
      <div class="tree-container">
        {#each issuesState.treeNodes as node (node.issue.key)}
          <TreeNode {node} />
        {/each}
      </div>
    {/if}
  </div>
</div>
