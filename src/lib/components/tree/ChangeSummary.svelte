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

  interface Props {
    changes: ChangeDetection;
    onAcknowledge: () => void;
  }

  let { changes, onAcknowledge }: Props = $props();

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
    const items: { text: string; colorClass: string }[] = [];
    if (changes.newIssues.length > 0)
      items.push({
        text: `${changes.newIssues.length} new`,
        colorClass: 'text-change-new-text'
      });
    if (changes.removedIssues.length > 0)
      items.push({
        text: `${changes.removedIssues.length} removed`,
        colorClass: 'text-change-removed-text'
      });
    if (changes.statusChanges.length > 0)
      items.push({
        text: `${changes.statusChanges.length} status changed`,
        colorClass: 'text-change-status-text'
      });
    if (changes.commentChanges.length > 0)
      items.push({
        text: `${changes.commentChanges.length} with new comments`,
        colorClass: 'text-change-comments-text'
      });
    if (changes.assigneeChanges.length > 0)
      items.push({
        text: `${changes.assigneeChanges.length} reassigned`,
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
        class="flex items-center gap-2 text-sm hover:bg-primary/20 rounded px-1 -ml-1 transition-colors"
      >
        <AtlaskitIcon name="status" size={16} class="text-primary" />
        <span class="text-foreground">
          {#each summaryItems as item, i (item.text)}
            {#if i > 0}<span class="mx-1">&middot;</span>{/if}
            <span class="font-medium {item.colorClass}">{item.text}</span>
          {/each}
          {#if checkpointTime}
            <Tooltip content={checkpointTimeAbsolute ?? ''} placement="bottom">
              <span
                class="inline-flex items-center justify-center h-5 px-2 text-[10px] font-medium rounded-full bg-muted text-muted-foreground whitespace-nowrap cursor-default ml-2"
              >
                since {checkpointTime}
              </span>
            </Tooltip>
          {/if}
        </span>
      </button>

      <div class="flex items-center gap-1">
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
        <Tooltip content="Acknowledge changes and save new checkpoint" placement="bottom">
          <button
            type="button"
            onclick={onAcknowledge}
            class="px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded-full transition-colors flex items-center gap-1"
          >
            <AtlaskitIcon name="check-circle" size={14} />
            Check
          </button>
        </Tooltip>
      </div>
    </div>

    <!-- Expanded Details -->
    {#if isExpanded}
      <div class="border-t border-primary/30 px-3 py-2 text-xs space-y-3">
        <!-- View Toggle -->
        <div class="flex justify-end">
          <button
            type="button"
            onclick={() => (groupByIssue = !groupByIssue)}
            class="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-primary/10"
            title={groupByIssue ? 'Group by change type' : 'Group by issue'}
          >
            <AtlaskitIcon name={groupByIssue ? 'layers' : 'list'} size={12} />
            <span class="text-[10px]">{groupByIssue ? 'By Issue' : 'By Type'}</span>
          </button>
        </div>

        {#if groupByIssue}
          <!-- Grouped by Issue View -->
          <ul class="space-y-1.5">
            {#each issueGroups as issue (issue.key)}
              <li class="flex items-baseline gap-2">
                <button
                  type="button"
                  onclick={(e) => openIssue(issue.key, e)}
                  class="font-mono text-text-brand hover:underline shrink-0"
                >
                  {issue.key}
                </button>
                <span class="text-foreground/80 truncate">{issue.summary}</span>
                <span class="flex items-center gap-1.5 shrink-0">
                  {#if issue.isNew}
                    <span class="text-change-new-text">New</span>
                  {/if}
                  {#if issue.isRemoved}
                    <span class="text-change-removed-text">Removed</span>
                  {/if}
                  {#if issue.statusChange}
                    <span class="text-primary"
                      >{issue.statusChange.previousStatus} → {issue.statusChange
                        .currentStatus}</span
                    >
                  {/if}
                  {#if issue.commentChange}
                    <span class="text-change-comments-text"
                      >+{issue.commentChange.newCommentCount} comment{issue.commentChange
                        .newCommentCount !== 1
                        ? 's'
                        : ''}</span
                    >
                  {/if}
                  {#if issue.assigneeChange}
                    <span class="text-change-assignee-text"
                      >{issue.assigneeChange.previousAssignee ?? 'Unassigned'} → {issue
                        .assigneeChange.currentAssignee ?? 'Unassigned'}</span
                    >
                  {/if}
                </span>
              </li>
            {/each}
          </ul>
        {:else}
          <!-- Grouped by Type View -->
          {#if changes.newIssues.length > 0}
            <div>
              <div class="font-medium text-change-new-text mb-1.5">New Issues:</div>
              <ul class="space-y-1">
                {#each changes.newIssues as issue (issue.key)}
                  <li class="flex items-baseline gap-2">
                    <button
                      type="button"
                      onclick={(e) => openIssue(issue.key, e)}
                      class="font-mono text-change-new-text hover:underline shrink-0"
                    >
                      {issue.key}
                    </button>
                    <span class="text-foreground/80 truncate">{issue.summary}</span>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if changes.removedIssues.length > 0}
            <div>
              <div class="font-medium text-change-removed-text mb-1.5">Removed Issues:</div>
              <ul class="space-y-1">
                {#each changes.removedIssues as issue (issue.key)}
                  <li class="flex items-baseline gap-2">
                    <button
                      type="button"
                      onclick={(e) => openIssue(issue.key, e)}
                      class="font-mono text-change-removed-text hover:underline shrink-0"
                    >
                      {issue.key}
                    </button>
                    <span class="text-foreground/80 truncate">{issue.summary}</span>
                    <span class="text-foreground/50 shrink-0">(was: {issue.lastStatus})</span>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if changes.statusChanges.length > 0}
            <div>
              <div class="font-medium text-primary mb-1.5">Status Changes:</div>
              <ul class="space-y-1">
                {#each changes.statusChanges as change (change.key)}
                  <li class="flex items-baseline gap-2">
                    <button
                      type="button"
                      onclick={(e) => openIssue(change.key, e)}
                      class="font-mono text-primary hover:underline shrink-0"
                    >
                      {change.key}
                    </button>
                    <span class="text-foreground/80 truncate">{change.summary}</span>
                    <span class="text-foreground/50 shrink-0"
                      >{change.previousStatus} → {change.currentStatus}</span
                    >
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if changes.commentChanges.length > 0}
            <div>
              <div class="font-medium text-change-comments-text mb-1.5">
                New Comments:
              </div>
              <ul class="space-y-1">
                {#each changes.commentChanges as change (change.key)}
                  <li class="flex items-baseline gap-2">
                    <button
                      type="button"
                      onclick={(e) => openIssue(change.key, e)}
                      class="font-mono text-change-comments-text hover:underline shrink-0"
                    >
                      {change.key}
                    </button>
                    <span class="text-foreground/80 truncate">{change.summary}</span>
                    <span class="text-foreground/50 shrink-0">
                      +{change.newCommentCount}{change.newCommentCount === 1 && change.latestAuthor
                        ? ` by ${change.latestAuthor}`
                        : ''}
                    </span>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if changes.assigneeChanges.length > 0}
            <div>
              <div class="font-medium text-change-assignee-text mb-1.5">Reassigned:</div>
              <ul class="space-y-1">
                {#each changes.assigneeChanges as change (change.key)}
                  <li class="flex items-baseline gap-2">
                    <button
                      type="button"
                      onclick={(e) => openIssue(change.key, e)}
                      class="font-mono text-change-assignee-text hover:underline shrink-0"
                    >
                      {change.key}
                    </button>
                    <span class="text-foreground/80 truncate">{change.summary}</span>
                    <span class="text-foreground/50 shrink-0">
                      {change.previousAssignee ?? 'Unassigned'} → {change.currentAssignee ??
                        'Unassigned'}
                    </span>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        {/if}
      </div>
    {/if}
  </div>
{/if}
