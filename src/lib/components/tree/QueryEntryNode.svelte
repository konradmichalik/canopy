<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import AccordionChevron from '../common/AccordionChevron.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import type { JiraIssue, TreeNode, SavedQuery } from '../../types';
  import { QUERY_COLORS } from '../../types/tree';
  import {
    calculateIssuesTimeProgress,
    calculateIssuesResolutionProgress,
    issuesHaveTimeTrackingData,
    formatHours
  } from '../../utils/aggregated-progress';

  interface Props {
    query: SavedQuery;
    issues: JiraIssue[];
    treeNodes: TreeNode[];
    isExpanded?: boolean;
    onToggle?: () => void;
    children?: import('svelte').Snippet;
  }

  let { query, issues, treeNodes: _treeNodes, isExpanded = true, onToggle, children }: Props = $props();

  // Aggregated stats
  const timeProgress = $derived(calculateIssuesTimeProgress(issues));
  const resolutionProgress = $derived(calculateIssuesResolutionProgress(issues));
  const hasTimeData = $derived(issuesHaveTimeTrackingData(issues));

  // Query color
  const colorClass = $derived(
    query.color ? QUERY_COLORS.find((c) => c.id === query.color)?.bg : null
  );

  function handleToggle(): void {
    onToggle?.();
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  }
</script>

<div class="query-entry-node">
  <!-- Header -->
  <div
    class="flex items-center gap-3 pr-3 py-2.5 bg-surface-sunken hover:bg-surface-hovered rounded-lg cursor-pointer select-none transition-colors relative overflow-hidden"
    onclick={handleToggle}
    onkeydown={handleKeydown}
    role="button"
    tabindex="0"
    aria-expanded={isExpanded}
  >
    <!-- Color bar on left edge -->
    <div
      class="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg {colorClass || 'bg-muted-foreground/30'}"
    ></div>

    <!-- Expand/Collapse icon with left padding -->
    <div class="pl-4">
      <AccordionChevron {isExpanded} />
    </div>

    <!-- Query icon -->
    <AtlaskitIcon name="search" size={18} class="text-brand" />

    <!-- Query title -->
    <div class="flex-1 min-w-0">
      <span class="font-medium text-text truncate">{query.title}</span>
    </div>

    <!-- Stats -->
    <div class="flex items-center gap-4">
      <!-- Time Progress -->
      {#if hasTimeData}
        {@const logged = timeProgress.logged}
        {@const total = timeProgress.total}
        {@const remaining = total - logged}
        {@const loggedHours = formatHours(logged)}
        {@const totalHours = formatHours(total)}
        {@const remainingHours = formatHours(remaining)}
        <Tooltip
          text={`Time: ${timeProgress.percent}%\nLogged: ${loggedHours} / ${totalHours}\nRemaining: ${remainingHours}`}
        >
          <div class="flex items-center gap-2">
            <AtlaskitIcon name="clock" size={14} color="var(--color-text-subtle)" />
            <div class="w-16 h-1.5 bg-progress-track rounded-full overflow-hidden">
              <div
                class="h-full bg-success transition-all"
                style="width: {timeProgress.percent}%"
              ></div>
            </div>
            <span class="text-xs text-text-subtle w-8 text-right">
              {timeProgress.percent}%
            </span>
          </div>
        </Tooltip>
      {/if}

      <!-- Resolution Progress -->
      {#if issues.length > 0}
        {@const done = resolutionProgress.done}
        {@const total = resolutionProgress.total}
        <Tooltip text={`Done: ${done} / ${total} (${resolutionProgress.percent}%)`}>
          <div class="flex items-center gap-2">
            <AtlaskitIcon name="subtasks" size={14} color="var(--color-text-subtle)" />
            <div class="w-16 h-1.5 bg-progress-track rounded-full overflow-hidden">
              <div
                class="h-full bg-brand-bold transition-all"
                style="width: {resolutionProgress.percent}%"
              ></div>
            </div>
            <span class="text-xs text-text-subtle whitespace-nowrap">
              {done}/{total}
            </span>
          </div>
        </Tooltip>
      {/if}

      <!-- Issue count -->
      <span class="text-xs text-text-subtle px-2 py-0.5 bg-neutral rounded-full">
        {issues.length} Issues
      </span>
    </div>
  </div>

  <!-- Children (tree nodes) -->
  {#if isExpanded}
    <div class="mt-2 ml-2 pl-4 border-l-2 border-border">
      {@render children?.()}
    </div>
  {/if}
</div>
