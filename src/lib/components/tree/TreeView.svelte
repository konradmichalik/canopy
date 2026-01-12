<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import TreeNode from './TreeNode.svelte';
  import IssueCardSkeleton from './IssueCardSkeleton.svelte';
  import QuickFilters from '../filters/QuickFilters.svelte';
  import GroupHeader from './GroupHeader.svelte';
  import QueryEntryNode from './QueryEntryNode.svelte';
  import ChangeSummary from './ChangeSummary.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import { Button } from '$lib/components/ui/button';
  import { issuesState, expandAll, collapseAll, refreshIssues } from '../../stores/issues.svelte';
  import { filtersState, getActiveFilters } from '../../stores/filters.svelte';
  import { routerState } from '../../stores/router.svelte';
  import { getQueryById, updateQueryOptionsExpanded } from '../../stores/jql.svelte';
  import { getTreeStats } from '../../utils/hierarchy-builder';
  import { getActiveFilterConditions } from '../../stores/filters.svelte';
  import { applyQuickFilters, setOrderBy, hasOrderByClause } from '../../utils/jql-helpers';
  import { debugModeState } from '../../stores/debugMode.svelte';
  import { keyboardNavState, clearFocus } from '../../stores/keyboardNavigation.svelte';
  import { groupingState, groupIssues, type IssueGroup } from '../../stores/grouping.svelte';
  import { sortConfigState } from '../../stores/sortConfig.svelte';
  import { connectionState } from '../../stores/connection.svelte';
  import { changeTrackingState, saveCheckpoint } from '../../stores/changeTracking.svelte';
  import { formatRelativeTime, formatDateTime } from '../../utils/formatDate';
  import { autoRefreshState } from '../../stores/autoRefresh.svelte';
  import { openExternalUrl } from '../../utils/external-link';

  let isRefreshing = $state(false);
  let showJqlDebug = $state(false);
  let treeContainerRef: HTMLDivElement | null = $state(null);
  // Tick counter to force re-render of relative time every 30 seconds
  let timeTick = $state(0);
  // eslint-disable-next-line svelte/no-unnecessary-state-wrap -- variable is reassigned, not just mutated
  let expandedGroups: SvelteSet<string> = $state(new SvelteSet<string>());
  let entryNodeExpanded = $state(true);
  let hasInitializedGroups = $state(false);

  // Get the current query
  const currentQuery = $derived(
    routerState.activeQueryId ? getQueryById(routerState.activeQueryId) : undefined
  );
  const showEntryNode = $derived(currentQuery?.showEntryNode ?? false);

  // Options panel (filters, grouping, sorting) - persisted per query
  const optionsExpanded = $derived(currentQuery?.optionsExpanded ?? true);

  function toggleOptionsExpanded() {
    if (routerState.activeQueryId) {
      updateQueryOptionsExpanded(routerState.activeQueryId, !optionsExpanded);
    }
  }

  // Active filter count for badge
  const activeFilterCount = $derived(
    getActiveFilters().length +
      (filtersState.searchText ? 1 : 0) +
      (filtersState.recencyFilter ? 1 : 0)
  );

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
      ? groupIssues(issuesState.rawIssues, groupingState.groupBy, sortConfigState.config)
      : []
  );

  // Reset initialization flag when grouping mode changes
  $effect(() => {
    // Track groupingState.groupBy to reset when it changes
    const _groupBy = groupingState.groupBy;
    hasInitializedGroups = false;
  });

  // Initialize expanded groups (expand active sprints by default)
  $effect(() => {
    if (isGrouped && issueGroups.length > 0 && !hasInitializedGroups) {
      hasInitializedGroups = true;
      const initialExpanded = new SvelteSet<string>();
      for (const group of issueGroups) {
        // Auto-expand active sprints
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
    const newExpanded = new SvelteSet(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    expandedGroups = newExpanded;
  }

  function expandAllGroups(): void {
    expandedGroups = new SvelteSet(issueGroups.map((g) => g.id));
  }

  function collapseAllGroups(): void {
    expandedGroups = new SvelteSet();
  }

  // Compute effective JQL with filters and sort
  const filterConditions = $derived(getActiveFilterConditions());
  const effectiveJql = $derived.by(() => {
    if (!issuesState.currentJql) return '';
    let jql = applyQuickFilters(issuesState.currentJql, filterConditions);
    // Add ORDER BY if base JQL doesn't have one
    if (!hasOrderByClause(issuesState.currentJql)) {
      const { field, direction } = sortConfigState.config;
      jql = setOrderBy(jql, field, direction);
    }
    return jql;
  });

  // Build JIRA URL for opening in browser
  const jiraSearchUrl = $derived.by(() => {
    if (!connectionState.config?.baseUrl || !effectiveJql) return '';
    const encodedJql = encodeURIComponent(effectiveJql);
    return `${connectionState.config.baseUrl}/issues/?jql=${encodedJql}`;
  });

  function openInJira(): void {
    if (jiraSearchUrl) {
      openExternalUrl(jiraSearchUrl);
    }
  }

  // Clear focus when clicking outside tree nodes
  function onTreeClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Only clear if clicking the container itself, not a tree node
    if (target === treeContainerRef || target.classList.contains('tree-container')) {
      clearFocus();
    }
  }

  // Change tracking handlers
  function handleSaveCheckpoint(): void {
    if (routerState.activeQueryId) {
      saveCheckpoint(routerState.activeQueryId, issuesState.rawIssues);
    }
  }

  // Timer to update relative time display every 30 seconds
  $effect(() => {
    const interval = setInterval(() => {
      timeTick++;
    }, 30000);

    return () => clearInterval(interval);
  });
</script>

<div class="tree-view flex flex-col h-full">
  <!-- Toolbar Section -->
  <div class="flex-shrink-0 border-b bg-muted/30">
    <!-- Actions row -->
    <div class="flex items-center justify-between gap-4 px-4 py-3">
      <div class="flex items-center gap-3">
        {#if !isEmpty}
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-foreground">
              {stats.totalIssues}
            </span>
            <span class="text-sm text-muted-foreground">Issues</span>
          </div>
        {/if}
        {#if keyboardNavState.isNavigating}
          <span class="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">
            {keyboardNavState.focusedKey}
          </span>
        {/if}
      </div>

      <div class="flex items-center gap-1.5">
        <!-- Last updated time + Refresh button -->
        <div class="flex items-center gap-1.5">
          {#if issuesState.lastUpdated}
            {#key `${issuesState.lastUpdated.getTime()}-${timeTick}`}
              <Tooltip
                content={formatDateTime(issuesState.lastUpdated.toISOString())}
                placement="bottom"
              >
                <span
                  class="inline-flex items-center justify-center h-5 px-2 text-[10px] font-medium rounded-full bg-muted text-muted-foreground whitespace-nowrap cursor-default"
                >
                  {formatRelativeTime(issuesState.lastUpdated)}
                </span>
              </Tooltip>
            {/key}
          {/if}
          <Tooltip
            content={autoRefreshState.interval !== 'off'
              ? `Refresh (Auto: ${autoRefreshState.interval})`
              : 'Refresh'}
            placement="bottom"
          >
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              onclick={handleRefresh}
              disabled={issuesState.isLoading || isRefreshing}
            >
              <AtlaskitIcon
                name="refresh"
                size={16}
                class={isRefreshing || issuesState.isLoading ? 'animate-spin' : ''}
              />
            </Button>
          </Tooltip>
        </div>

        <div class="w-px h-5 bg-border mx-1"></div>

        <Tooltip content="Expand all" placement="bottom">
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            onclick={isGrouped ? expandAllGroups : expandAll}
            disabled={isEmpty || issuesState.isLoading}
          >
            <AtlaskitIcon name="chevron-down" size={16} />
          </Button>
        </Tooltip>

        <Tooltip content="Collapse all" placement="bottom">
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            onclick={isGrouped ? collapseAllGroups : collapseAll}
            disabled={isEmpty || issuesState.isLoading}
          >
            <AtlaskitIcon name="chevron-up" size={16} />
          </Button>
        </Tooltip>

        <Tooltip content="Open in Jira" placement="bottom">
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8"
            onclick={openInJira}
            disabled={!jiraSearchUrl || issuesState.isLoading}
          >
            <AtlaskitIcon name="link-external" size={16} />
          </Button>
        </Tooltip>

        <div class="w-px h-5 bg-border mx-1"></div>

        <!-- Options Toggle (Filters, Grouping, Sorting) -->
        <button
          onclick={toggleOptionsExpanded}
          class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1.5 rounded-md hover:bg-accent"
        >
          <span class="font-medium">Options</span>
          {#if activeFilterCount > 0}
            <span
              class="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary"
            >
              {activeFilterCount}
            </span>
          {/if}
          <AtlaskitIcon
            name="chevron-right"
            size={14}
            class="transition-transform duration-200 {optionsExpanded ? 'rotate-90' : ''}"
          />
        </button>
      </div>
    </div>

    <!-- Saved Filters (always visible) + Options panel (Filters, Grouping, Sorting) -->
    <div class="px-4 pb-3">
      <QuickFilters expanded={optionsExpanded} />
    </div>

    <!-- JQL Debug (only visible when debug mode is enabled) -->
    {#if debugModeState.enabled}
      <div class="px-4 py-2 border-t bg-muted/50">
        <button
          onclick={() => (showJqlDebug = !showJqlDebug)}
          class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <AtlaskitIcon
            name="chevron-right"
            size={12}
            class="transition-transform {showJqlDebug ? 'rotate-90' : ''}"
          />
          <span>JQL Debug</span>
          {#if filterConditions.length > 0}
            <span class="text-primary"
              >({filterConditions.length} filter{filterConditions.length > 1 ? 's' : ''})</span
            >
          {/if}
        </button>
        {#if showJqlDebug}
          <div class="mt-3 space-y-3 text-xs">
            <div>
              <span class="text-muted-foreground">Base JQL:</span>
              <code
                class="block mt-1.5 p-2.5 bg-background rounded-lg border text-muted-foreground break-all font-mono"
              >
                {issuesState.currentJql || '(none)'}
              </code>
            </div>
            {#if filterConditions.length > 0}
              <div>
                <span class="text-muted-foreground">Filter conditions:</span>
                <ul class="mt-1.5 space-y-1">
                  {#each filterConditions as condition (condition)}
                    <li
                      class="p-2 bg-primary/10 rounded-lg border border-primary/20 text-primary font-mono"
                    >
                      {condition}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
            <div>
              <span class="text-muted-foreground">Effective JQL:</span>
              <code
                class="block mt-1.5 p-2.5 bg-background rounded-lg border text-foreground break-all font-mono font-medium"
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
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    bind:this={treeContainerRef}
    class="flex-1 overflow-auto p-3 outline-none"
    tabindex="0"
    role="tree"
    aria-label="Issue hierarchy tree"
    onclick={onTreeClick}
  >
    <!-- Change Summary Banner -->
    {#if changeTrackingState.isEnabled && changeTrackingState.currentChanges?.hasChanges}
      <ChangeSummary
        changes={changeTrackingState.currentChanges}
        onAcknowledge={handleSaveCheckpoint}
      />
    {/if}

    {#if issuesState.isLoading}
      <div class="tree-container space-y-1">
        {#each Array(8) as _, i (i)}
          <IssueCardSkeleton depth={i < 2 ? 0 : i < 5 ? 1 : 2} />
        {/each}
      </div>
    {:else if issuesState.error}
      <div class="flex items-center justify-center h-full">
        <div class="flex flex-col items-center gap-4 text-center max-w-md">
          <div class="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AtlaskitIcon name="warning" size={24} class="text-destructive" />
          </div>
          <p class="text-destructive text-sm">{issuesState.error}</p>
          <Button variant="outline" size="sm" onclick={handleRefresh}>Try again</Button>
        </div>
      </div>
    {:else if isEmpty}
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <div
            class="w-14 h-14 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center"
          >
            <AtlaskitIcon name="search" size={28} class="text-muted-foreground" />
          </div>
          <p class="text-base font-medium text-foreground mb-1">No issues found</p>
          <p class="text-sm text-muted-foreground">Try adjusting your JQL query or filters</p>
        </div>
      </div>
    {:else if showEntryNode && currentQuery}
      <!-- Query Entry Node Wrapper -->
      <QueryEntryNode
        query={currentQuery}
        issues={issuesState.rawIssues}
        treeNodes={issuesState.treeNodes}
        isExpanded={entryNodeExpanded}
        onToggle={() => (entryNodeExpanded = !entryNodeExpanded)}
      >
        {#if isGrouped}
          <!-- Grouped View inside Entry Node -->
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
          <!-- Default Hierarchy View inside Entry Node -->
          <div class="tree-container">
            {#each issuesState.treeNodes as node (node.issue.key)}
              <TreeNode {node} />
            {/each}
          </div>
        {/if}
      </QueryEntryNode>
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
