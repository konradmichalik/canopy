<script lang="ts">
  import type {
    ChangeDetection,
    IssueChangeInfo,
    StatusChange,
    CommentChange,
    AssigneeChange
  } from '../../types/changeTracking';
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import { formatDateTime, formatDateTimeWithSetting } from '../../utils/formatDate';
  import { getIssueUrl } from '../../stores/issues.svelte';
  import { openExternalUrl } from '../../utils/external-link';
  import { changeTrackingState, isCheckpointStale } from '../../stores/changeTracking.svelte';
  import { debugModeState } from '../../stores/debugMode.svelte';
  import { routerState } from '../../stores/router.svelte';

  interface Props {
    changes: ChangeDetection;
    onAcknowledge: () => void;
  }

  let { changes, onAcknowledge }: Props = $props();

  // Check if checkpoint is stale (older than configured threshold)
  const isStale = $derived(
    routerState.activeQueryId ? isCheckpointStale(routerState.activeQueryId) : false
  );

  let isExpanded = $state(false);
  let groupByIssue = $state(false);

  const checkpointTime = $derived(
    changes.checkpointTimestamp ? formatDateTimeWithSetting(changes.checkpointTimestamp) : null
  );

  const checkpointTimeAbsolute = $derived(
    changes.checkpointTimestamp ? formatDateTime(changes.checkpointTimestamp) : null
  );

  // Sort comparator: extracts numeric part from issue key for proper sorting (PROJ-9 < PROJ-10)
  function compareByKey(a: { key: string }, b: { key: string }): number {
    const [projA, numA] = a.key.split('-');
    const [projB, numB] = b.key.split('-');
    if (projA !== projB) return projA.localeCompare(projB);
    return Number(numA) - Number(numB);
  }

  // Grouped by issue view: collect all changes per issue
  interface IssueChangeSummary {
    key: string;
    summary: string;
    isNew: boolean;
    isRemoved: boolean;
    removedStatus?: string;
    statusChange?: StatusChange;
    commentChange?: CommentChange;
    assigneeChange?: AssigneeChange;
  }

  const issueGroups = $derived.by(() => {
    const record: Record<string, IssueChangeSummary> = {};

    const getOrCreate = (info: IssueChangeInfo): IssueChangeSummary => {
      if (!record[info.key]) {
        record[info.key] = { key: info.key, summary: info.summary, isNew: false, isRemoved: false };
      }
      return record[info.key];
    };

    for (const issue of changes.newIssues) {
      getOrCreate(issue).isNew = true;
    }
    for (const issue of changes.removedIssues) {
      const entry = getOrCreate(issue);
      entry.isRemoved = true;
      entry.removedStatus = issue.lastStatus;
    }
    for (const change of changes.statusChanges) {
      getOrCreate(change).statusChange = change;
    }
    for (const change of changes.commentChanges) {
      getOrCreate(change).commentChange = change;
    }
    for (const change of changes.assigneeChanges) {
      getOrCreate(change).assigneeChange = change;
    }

    return Object.values(record).sort(compareByKey);
  });

  // Build summary items array for cleaner rendering
  const summaryItems = $derived.by(() => {
    const items: { count: number; label: string; colorClass: string }[] = [];
    if (changes.newIssues.length > 0)
      items.push({
        count: changes.newIssues.length,
        label: 'new',
        colorClass: 'text-change-new-text'
      });
    if (changes.removedIssues.length > 0)
      items.push({
        count: changes.removedIssues.length,
        label: 'removed',
        colorClass: 'text-change-removed-text'
      });
    if (changes.statusChanges.length > 0)
      items.push({
        count: changes.statusChanges.length,
        label: 'status changed',
        colorClass: 'text-change-status-text'
      });
    if (changes.commentChanges.length > 0)
      items.push({
        count: changes.commentChanges.length,
        label: 'with new comments',
        colorClass: 'text-change-comments-text'
      });
    if (changes.assigneeChanges.length > 0)
      items.push({
        count: changes.assigneeChanges.length,
        label: 'reassigned',
        colorClass: 'text-change-assignee-text'
      });
    return items;
  });

  function openIssue(issueKey: string, e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    const url = getIssueUrl(issueKey);
    if (url) {
      openExternalUrl(url);
    }
  }
</script>

{#if changes.hasChanges}
  <div class="bg-primary/10 border-b border-primary/30">
    <!-- Summary Header -->
    <div class="flex items-center justify-between px-3 py-2">
      <button
        type="button"
        onclick={() => (isExpanded = !isExpanded)}
        class="flex items-center gap-2 text-sm hover:bg-primary/20 rounded px-1.5 py-0.5 -ml-1 transition-colors"
      >
        <AtlaskitIcon name="status" size={16} class="text-primary" />
        <span class="text-foreground flex items-center flex-wrap gap-x-1 gap-y-0.5">
          {#each summaryItems as item, i (item.label)}
            {#if i > 0}<span class="text-muted-foreground">&middot;</span>{/if}
            <span class={item.colorClass}>
              <span class="font-data font-bold">{item.count}</span>
              <span class="font-medium">{item.label}</span>
            </span>
          {/each}
          {#if checkpointTime}
            <Tooltip content={checkpointTimeAbsolute ?? ''} placement="bottom">
              <span
                class="inline-flex items-center justify-center h-5 px-2 text-[10px] font-medium font-data rounded-md bg-background/50 text-muted-foreground border border-border/50 whitespace-nowrap cursor-default ml-1"
              >
                since {checkpointTime}
              </span>
            </Tooltip>
          {/if}
        </span>
      </button>

      <div class="flex items-center gap-1.5">
        <button
          type="button"
          onclick={() => (isExpanded = !isExpanded)}
          class="p-1 hover:bg-primary/20 rounded transition-colors"
          title={isExpanded ? 'Collapse details' : 'Show details'}
        >
          <AtlaskitIcon
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            class="text-primary"
          />
        </button>
        <Tooltip
          content={isStale
            ? 'Checkpoint is overdue - click to acknowledge changes'
            : 'Acknowledge changes and save new checkpoint'}
          placement="bottom"
        >
          <button
            type="button"
            onclick={onAcknowledge}
            class="px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1.5 font-semibold shadow-sm
              {isStale
              ? 'text-amber-50 bg-amber-600 hover:bg-amber-700 animate-pulse-subtle'
              : 'text-primary-foreground bg-primary hover:bg-brand-hovered'}"
          >
            <AtlaskitIcon name="check-circle" size={14} />
            Check
            {#if isStale}
              <span class="ml-0.5 size-1.5 rounded-full bg-amber-300 animate-pulse"></span>
            {/if}
          </button>
        </Tooltip>
      </div>
    </div>

    <!-- Expanded Details -->
    {#if isExpanded}
      <div class="border-t border-primary/30 px-3 py-3 text-xs">
        <!-- View Toggle -->
        <div class="flex justify-end mb-3">
          <button
            type="button"
            onclick={() => (groupByIssue = !groupByIssue)}
            class="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-background/50 border border-border/50 px-2 py-1 rounded-md shadow-sm transition-colors hover:bg-surface-hovered"
            title={groupByIssue ? 'Group by change type' : 'Group by issue'}
          >
            <AtlaskitIcon name={groupByIssue ? 'layers' : 'list'} size={12} />
            <span>{groupByIssue ? 'By Issue' : 'By Type'}</span>
          </button>
        </div>

        {#if groupByIssue}
          <!-- Grouped by Issue View -->
          <ul class="space-y-1">
            {#each issueGroups as issue (issue.key)}
              <li class="flex items-start gap-3 py-1.5 hover:bg-background/30 rounded px-2 -mx-2">
                <button
                  type="button"
                  onclick={(e) => openIssue(issue.key, e)}
                  class="w-24 shrink-0 font-data text-xs font-semibold text-text-subtlest hover:text-text-brand hover:underline text-left"
                >
                  {issue.key}
                </button>
                <div class="min-w-0 flex-1">
                  <span class="text-sm font-medium text-foreground/80">{issue.summary}</span>
                  <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                    {#if issue.isNew}
                      <span
                        class="text-[10px] font-data font-bold text-change-new-text bg-change-new/15 px-1.5 py-0.5 rounded"
                        >New</span
                      >
                    {/if}
                    {#if issue.isRemoved}
                      <span
                        class="text-[10px] font-data font-bold text-change-removed-text bg-change-removed/15 px-1.5 py-0.5 rounded"
                        >Removed</span
                      >
                    {/if}
                    {#if issue.statusChange}
                      <span class="flex items-center gap-1 text-[10px] font-data">
                        <span class="text-muted-foreground line-through"
                          >{issue.statusChange.previousStatus}</span
                        >
                        <AtlaskitIcon
                          name="chevron-right"
                          size={10}
                          class="text-muted-foreground/50"
                        />
                        <span
                          class="font-bold text-change-status-text bg-change-status/15 px-1.5 py-0.5 rounded"
                          >{issue.statusChange.currentStatus}</span
                        >
                      </span>
                    {/if}
                    {#if issue.commentChange}
                      <span
                        class="text-[10px] font-data text-change-comments-text bg-change-comments/15 px-1.5 py-0.5 rounded"
                        >+{issue.commentChange.newCommentCount} comment{issue.commentChange
                          .newCommentCount !== 1
                          ? 's'
                          : ''}</span
                      >
                    {/if}
                    {#if issue.assigneeChange}
                      <span class="flex items-center gap-1 text-[10px] font-data">
                        <span class="text-muted-foreground"
                          >{issue.assigneeChange.previousAssignee ?? 'Unassigned'}</span
                        >
                        <AtlaskitIcon
                          name="chevron-right"
                          size={10}
                          class="text-muted-foreground/50"
                        />
                        <span class="text-change-assignee-text font-bold"
                          >{issue.assigneeChange.currentAssignee ?? 'Unassigned'}</span
                        >
                      </span>
                    {/if}
                  </div>
                </div>
              </li>
            {/each}
          </ul>
        {:else}
          <!-- Grouped by Type View -->
          <div class="space-y-4">
            {#if changes.newIssues.length > 0}
              <div>
                <div
                  class="flex items-center gap-2 text-change-new-text bg-change-new/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2"
                >
                  <AtlaskitIcon name="add" size={12} />
                  New Issues
                  <span class="font-data">({changes.newIssues.length})</span>
                </div>
                <ul class="space-y-0.5">
                  {#each changes.newIssues as issue (issue.key)}
                    <li
                      class="flex items-start gap-3 py-1.5 hover:bg-background/30 rounded px-2 -mx-2"
                    >
                      <button
                        type="button"
                        onclick={(e) => openIssue(issue.key, e)}
                        class="w-24 shrink-0 font-data text-xs font-semibold text-text-subtlest hover:text-change-new-text hover:underline text-left"
                      >
                        {issue.key}
                      </button>
                      <span class="text-sm font-medium text-foreground/80 truncate"
                        >{issue.summary}</span
                      >
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if changes.removedIssues.length > 0}
              <div>
                <div
                  class="flex items-center gap-2 text-change-removed-text bg-change-removed/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2"
                >
                  <AtlaskitIcon name="cross" size={12} />
                  Removed Issues
                  <span class="font-data">({changes.removedIssues.length})</span>
                </div>
                <ul class="space-y-0.5">
                  {#each changes.removedIssues as issue (issue.key)}
                    <li
                      class="flex items-start gap-3 py-1.5 hover:bg-background/30 rounded px-2 -mx-2"
                    >
                      <button
                        type="button"
                        onclick={(e) => openIssue(issue.key, e)}
                        class="w-24 shrink-0 font-data text-xs font-semibold text-text-subtlest hover:text-change-removed-text hover:underline text-left"
                      >
                        {issue.key}
                      </button>
                      <div class="min-w-0 flex-1">
                        <span class="text-sm font-medium text-foreground/80 line-through"
                          >{issue.summary}</span
                        >
                        <span class="text-[10px] font-data text-muted-foreground ml-2"
                          >(was: {issue.lastStatus})</span
                        >
                      </div>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if changes.statusChanges.length > 0}
              <div>
                <div
                  class="flex items-center gap-2 text-change-status-text bg-change-status/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2"
                >
                  <AtlaskitIcon name="status" size={12} />
                  Status Changed
                  <span class="font-data">({changes.statusChanges.length})</span>
                </div>
                <ul class="space-y-0.5">
                  {#each changes.statusChanges as change (change.key)}
                    <li
                      class="flex items-start gap-3 py-1.5 hover:bg-background/30 rounded px-2 -mx-2"
                    >
                      <button
                        type="button"
                        onclick={(e) => openIssue(change.key, e)}
                        class="w-24 shrink-0 font-data text-xs font-semibold text-text-subtlest hover:text-change-status-text hover:underline text-left"
                      >
                        {change.key}
                      </button>
                      <div class="min-w-0 flex-1">
                        <span class="text-sm font-medium text-foreground/80 truncate"
                          >{change.summary}</span
                        >
                        <div class="flex items-center gap-1.5 mt-0.5">
                          <span class="text-[10px] font-data text-muted-foreground line-through"
                            >{change.previousStatus}</span
                          >
                          <AtlaskitIcon
                            name="chevron-right"
                            size={10}
                            class="text-muted-foreground/50"
                          />
                          <span
                            class="text-[10px] font-data font-bold text-change-status-text bg-change-status/15 px-1.5 py-0.5 rounded"
                            >{change.currentStatus}</span
                          >
                        </div>
                      </div>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if changes.commentChanges.length > 0}
              <div>
                <div
                  class="flex items-center gap-2 text-change-comments-text bg-change-comments/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2"
                >
                  <AtlaskitIcon name="comment" size={12} />
                  New Comments
                  <span class="font-data">({changes.commentChanges.length})</span>
                </div>
                <ul class="space-y-0.5">
                  {#each changes.commentChanges as change (change.key)}
                    <li
                      class="flex items-start gap-3 py-1.5 hover:bg-background/30 rounded px-2 -mx-2"
                    >
                      <button
                        type="button"
                        onclick={(e) => openIssue(change.key, e)}
                        class="w-24 shrink-0 font-data text-xs font-semibold text-text-subtlest hover:text-change-comments-text hover:underline text-left"
                      >
                        {change.key}
                      </button>
                      <div class="min-w-0 flex-1">
                        <span class="text-sm font-medium text-foreground/80 truncate"
                          >{change.summary}</span
                        >
                        <div class="mt-0.5">
                          <span
                            class="text-[10px] font-data text-change-comments-text bg-change-comments/15 px-1.5 py-0.5 rounded"
                          >
                            +{change.newCommentCount}{change.newCommentCount === 1 &&
                            change.latestAuthor
                              ? ` by ${change.latestAuthor}`
                              : ''}
                          </span>
                        </div>
                      </div>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if changes.assigneeChanges.length > 0}
              <div>
                <div
                  class="flex items-center gap-2 text-change-assignee-text bg-change-assignee/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2"
                >
                  <AtlaskitIcon name="person" size={12} />
                  Reassigned
                  <span class="font-data">({changes.assigneeChanges.length})</span>
                </div>
                <ul class="space-y-0.5">
                  {#each changes.assigneeChanges as change (change.key)}
                    <li
                      class="flex items-start gap-3 py-1.5 hover:bg-background/30 rounded px-2 -mx-2"
                    >
                      <button
                        type="button"
                        onclick={(e) => openIssue(change.key, e)}
                        class="w-24 shrink-0 font-data text-xs font-semibold text-text-subtlest hover:text-change-assignee-text hover:underline text-left"
                      >
                        {change.key}
                      </button>
                      <div class="min-w-0 flex-1">
                        <span class="text-sm font-medium text-foreground/80 truncate"
                          >{change.summary}</span
                        >
                        <div class="flex items-center gap-1.5 mt-0.5">
                          <span class="text-[10px] font-data text-muted-foreground"
                            >{change.previousAssignee ?? 'Unassigned'}</span
                          >
                          <AtlaskitIcon
                            name="chevron-right"
                            size={10}
                            class="text-muted-foreground/50"
                          />
                          <span class="text-[10px] font-data font-bold text-change-assignee-text"
                            >{change.currentAssignee ?? 'Unassigned'}</span
                          >
                        </div>
                      </div>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Debug: Filtered Own Changes -->
        {#if debugModeState.enabled && changeTrackingState.filteredOwnChangesDebug}
          {@const debug = changeTrackingState.filteredOwnChangesDebug}
          <div class="mt-3 pt-3 border-t border-amber-500/30">
            <div class="flex items-center gap-2 mb-2">
              <span
                class="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-medium"
              >
                DEBUG
              </span>
              <span class="text-amber-600 dark:text-amber-400 font-medium">
                {debug.totalFiltered} own change{debug.totalFiltered !== 1 ? 's' : ''} hidden
              </span>
            </div>

            {#if debug.filteredNewIssues.length > 0}
              <div class="mb-2">
                <div class="text-muted-foreground mb-1">Own new issues:</div>
                <ul class="space-y-0.5 text-amber-600/70 dark:text-amber-400/70">
                  {#each debug.filteredNewIssues as issue (issue.key)}
                    <li class="flex items-baseline gap-2">
                      <span class="font-mono">{issue.key}</span>
                      <span class="truncate opacity-70">{issue.summary}</span>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if debug.filteredStatusChanges.length > 0}
              <div class="mb-2">
                <div class="text-muted-foreground mb-1">Own status changes:</div>
                <ul class="space-y-0.5 text-amber-600/70 dark:text-amber-400/70">
                  {#each debug.filteredStatusChanges as change (change.key)}
                    <li class="flex items-baseline gap-2">
                      <span class="font-mono">{change.key}</span>
                      <span class="opacity-70"
                        >{change.previousStatus} → {change.currentStatus}</span
                      >
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if debug.filteredCommentChanges.length > 0}
              <div class="mb-2">
                <div class="text-muted-foreground mb-1">Own comments:</div>
                <ul class="space-y-0.5 text-amber-600/70 dark:text-amber-400/70">
                  {#each debug.filteredCommentChanges as change (change.key)}
                    <li class="flex items-baseline gap-2">
                      <span class="font-mono">{change.key}</span>
                      <span class="opacity-70"
                        >+{change.newCommentCount} comment{change.newCommentCount !== 1
                          ? 's'
                          : ''}</span
                      >
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if debug.filteredAssigneeChanges.length > 0}
              <div>
                <div class="text-muted-foreground mb-1">Own reassignments:</div>
                <ul class="space-y-0.5 text-amber-600/70 dark:text-amber-400/70">
                  {#each debug.filteredAssigneeChanges as change (change.key)}
                    <li class="flex items-baseline gap-2">
                      <span class="font-mono">{change.key}</span>
                      <span class="opacity-70"
                        >{change.previousAssignee ?? 'Unassigned'} → {change.currentAssignee ??
                          'Unassigned'}</span
                      >
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}
