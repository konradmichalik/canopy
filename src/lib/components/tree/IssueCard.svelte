<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import type { TreeNode } from '../../types';
  import StatusBadge from '../common/StatusBadge.svelte';
  import IssueTypeIcon from '../common/IssueTypeIcon.svelte';
  import Avatar from '../common/Avatar.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import { getIssueUrl } from '../../stores/issues.svelte';
  import { isFieldEnabled } from '../../stores/fieldConfig.svelte';
  import { displayDensityState } from '../../stores/displayDensity.svelte';
  import {
    calculateAggregatedTimeProgress,
    calculateAggregatedResolutionProgress,
    formatHours,
    hasTimeTrackingData,
    hasDescendants
  } from '../../utils/aggregated-progress';

  interface Props {
    node: TreeNode;
  }

  let { node }: Props = $props();

  // Derive issue from node for convenience
  const issue = $derived(node.issue);

  function openIssue(e: Event): void {
    e.stopPropagation();
    const url = getIssueUrl(issue.key);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  const hasProgress = $derived(
    issue.fields.aggregateprogress && issue.fields.aggregateprogress.total > 0
  );

  const progressPercent = $derived(
    hasProgress
      ? Math.round(
          (issue.fields.aggregateprogress!.progress / issue.fields.aggregateprogress!.total) * 100
        )
      : 0
  );

  // Field visibility
  const showProgress = $derived(isFieldEnabled('progress'));
  const showStatus = $derived(isFieldEnabled('status'));
  const showAssignee = $derived(isFieldEnabled('assignee'));
  const showPriority = $derived(isFieldEnabled('priority'));
  const showCreated = $derived(isFieldEnabled('created'));
  const showUpdated = $derived(isFieldEnabled('updated'));
  const showComments = $derived(isFieldEnabled('comments'));
  const showComponents = $derived(isFieldEnabled('components'));
  const showLabels = $derived(isFieldEnabled('labels'));
  const showResolution = $derived(isFieldEnabled('resolution'));
  const showFixVersions = $derived(isFieldEnabled('fixVersions'));
  const showAggregatedTimeProgress = $derived(isFieldEnabled('aggregatedTimeProgress'));
  const showAggregatedResolutionProgress = $derived(isFieldEnabled('aggregatedResolutionProgress'));

  // Aggregated progress calculations
  const aggregatedTimeProgress = $derived(calculateAggregatedTimeProgress(node));
  const aggregatedResolutionProgress = $derived(calculateAggregatedResolutionProgress(node));

  // Check if aggregated progress should be displayed
  const hasAggregatedTimeData = $derived(hasTimeTrackingData(node));
  const hasChildIssues = $derived(hasDescendants(node));

  // Helper to format date
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Helper to format date with time for tooltip
  function formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get comment count from fields (if available)
  const commentCount = $derived(
    (issue.fields as Record<string, unknown>).comment
      ? ((issue.fields as Record<string, unknown>).comment as { total?: number })?.total ?? 0
      : 0
  );

  // Get fix versions
  const fixVersions = $derived(
    ((issue.fields as Record<string, unknown>).fixVersions as { name: string }[] | undefined) || []
  );

  // Display density
  const isCompact = $derived(displayDensityState.density === 'compact');
</script>

<div
  class="flex items-center min-w-0 flex-1 {isCompact ? 'gap-3 py-1' : 'gap-4 py-2.5'}"
>
  <!-- Issue Type Icon -->
  <IssueTypeIcon issueType={issue.fields.issuetype} size={isCompact ? 16 : 20} />

  <!-- Issue Key (link) -->
  <button
    onclick={openIssue}
    class="font-medium text-text-brand hover:underline flex items-center gap-1 flex-shrink-0 {isCompact
      ? 'text-sm'
      : 'text-base gap-1.5'}"
    title="Open in JIRA"
  >
    {issue.key}
    <AtlaskitIcon name="link-external" size={isCompact ? 12 : 14} class="opacity-50" />
  </button>

  <!-- Summary -->
  <span class="text-text truncate min-w-0 flex-1 {isCompact ? 'text-sm' : 'text-base'}">
    {issue.fields.summary}
  </span>

  <!-- Priority -->
  {#if showPriority && issue.fields.priority}
    <Tooltip text={`Priority: ${issue.fields.priority.name}`}>
      <div class="flex items-center gap-1 flex-shrink-0">
        <img
          src={issue.fields.priority.iconUrl}
          alt={issue.fields.priority.name}
          class="w-4 h-4"
        />
      </div>
    </Tooltip>
  {/if}

  <!-- Created Date -->
  {#if showCreated && issue.fields.created}
    <Tooltip text={`Created: ${formatDateTime(issue.fields.created)}`}>
      <div class="flex items-center gap-1 text-xs text-text-subtle flex-shrink-0">
        <AtlaskitIcon name="calendar" size={14} />
        <span>{formatDate(issue.fields.created)}</span>
      </div>
    </Tooltip>
  {/if}

  <!-- Updated Date -->
  {#if showUpdated && issue.fields.updated}
    <Tooltip text={`Updated: ${formatDateTime(issue.fields.updated)}`}>
      <div class="flex items-center gap-1 text-xs text-text-subtle flex-shrink-0">
        <AtlaskitIcon name="clock" size={14} />
        <span>{formatDate(issue.fields.updated)}</span>
      </div>
    </Tooltip>
  {/if}

  <!-- Comments -->
  {#if showComments && commentCount > 0}
    <Tooltip text={`${commentCount} Comment${commentCount !== 1 ? 's' : ''}`}>
      <div class="flex items-center gap-1 text-xs text-text-subtle flex-shrink-0">
        <AtlaskitIcon name="comment" size={14} />
        <span>{commentCount}</span>
      </div>
    </Tooltip>
  {/if}

  <!-- Labels -->
  {#if showLabels && issue.fields.labels && issue.fields.labels.length > 0}
    <Tooltip text={`Labels: ${issue.fields.labels.join(', ')}`}>
      <div class="flex items-center gap-1 flex-shrink-0">
        <AtlaskitIcon name="tag" size={14} color="var(--color-text-subtle)" />
        <span class="text-xs text-text-subtle">{issue.fields.labels.length}</span>
      </div>
    </Tooltip>
  {/if}

  <!-- Components -->
  {#if showComponents && issue.fields.components && issue.fields.components.length > 0}
    <Tooltip text={`Components: ${issue.fields.components.map((c) => c.name).join(', ')}`}>
      <div class="flex items-center gap-1 flex-shrink-0">
        <AtlaskitIcon name="component" size={14} color="var(--color-text-subtle)" />
        <span class="text-xs text-text-subtle">{issue.fields.components.map((c) => c.name).join(', ')}</span>
      </div>
    </Tooltip>
  {/if}

  <!-- Resolution -->
  {#if showResolution && issue.fields.resolution}
    <Tooltip text={`Resolution: ${issue.fields.resolution.name}`}>
      <div class="flex items-center gap-1 flex-shrink-0">
        <AtlaskitIcon name="check-circle" size={14} color="var(--color-success)" />
        <span class="text-xs text-success">{issue.fields.resolution.name}</span>
      </div>
    </Tooltip>
  {/if}

  <!-- Fix Versions -->
  {#if showFixVersions && fixVersions.length > 0}
    <Tooltip text={`Fix Version: ${fixVersions.map((v) => v.name).join(', ')}`}>
      <div class="flex items-center gap-1 flex-shrink-0">
        <AtlaskitIcon name="release" size={14} color="var(--color-text-subtle)" />
        <span class="text-xs text-text-subtle max-w-[80px] truncate">{fixVersions[0].name}</span>
        {#if fixVersions.length > 1}
          <span class="text-xs text-text-subtlest">+{fixVersions.length - 1}</span>
        {/if}
      </div>
    </Tooltip>
  {/if}

  <!-- Aggregated Time Progress (Sum) -->
  {#if showAggregatedTimeProgress && hasAggregatedTimeData}
    {@const logged = aggregatedTimeProgress.logged}
    {@const total = aggregatedTimeProgress.total}
    {@const remaining = total - logged}
    {@const loggedHours = formatHours(logged)}
    {@const totalHours = formatHours(total)}
    {@const remainingHours = formatHours(remaining)}
    <Tooltip
      text={`Time Progress (Sum): ${aggregatedTimeProgress.percent}%\nLogged: ${loggedHours} / ${totalHours}\nRemaining: ${remainingHours}`}
    >
      <div class="flex items-center gap-2 flex-shrink-0">
        <AtlaskitIcon name="clock" size={12} color="var(--color-text-subtle)" />
        <div class="w-14 h-1.5 bg-progress-track rounded-full overflow-hidden">
          <div class="h-full bg-success transition-all" style="width: {aggregatedTimeProgress.percent}%"></div>
        </div>
        <span class="text-xs text-text-subtle w-8 text-right">
          {aggregatedTimeProgress.percent}%
        </span>
      </div>
    </Tooltip>
  {/if}

  <!-- Aggregated Resolution Progress (Sum) -->
  {#if showAggregatedResolutionProgress && hasChildIssues}
    {@const done = aggregatedResolutionProgress.done}
    {@const total = aggregatedResolutionProgress.total}
    <Tooltip
      text={`Resolution Progress (Sum): ${aggregatedResolutionProgress.percent}%\nDone: ${done} / ${total}`}
    >
      <div class="flex items-center gap-2 flex-shrink-0">
        <AtlaskitIcon name="subtasks" size={12} color="var(--color-text-subtle)" />
        <div class="w-14 h-1.5 bg-progress-track rounded-full overflow-hidden">
          <div class="h-full bg-brand-bold transition-all" style="width: {aggregatedResolutionProgress.percent}%"></div>
        </div>
        <span class="text-xs text-text-subtle w-8 text-right">
          {done}/{total}
        </span>
      </div>
    </Tooltip>
  {/if}

  <!-- Progress Bar (JIRA native aggregateprogress) -->
  {#if showProgress && hasProgress}
    {@const progress = issue.fields.aggregateprogress!.progress}
    {@const total = issue.fields.aggregateprogress!.total}
    {@const remaining = total - progress}
    {@const progressHours = Math.round(progress / 3600)}
    {@const totalHours = Math.round(total / 3600)}
    {@const remainingHours = Math.round(remaining / 3600)}
    <Tooltip
      text={`JIRA Progress: ${progressPercent}%\nLogged: ${progressHours}h / ${totalHours}h\nRemaining: ${remainingHours}h`}
    >
      <div class="flex items-center gap-2 flex-shrink-0">
        <AtlaskitIcon name="dashboard" size={12} color="var(--color-text-subtle)" />
        <div class="w-14 h-1.5 bg-progress-track rounded-full overflow-hidden">
          <div class="h-full bg-warning transition-all" style="width: {progressPercent}%"></div>
        </div>
        <span class="text-xs text-text-subtle w-8 text-right">
          {progressPercent}%
        </span>
      </div>
    </Tooltip>
  {/if}

  <!-- Status Badge -->
  {#if showStatus}
    <StatusBadge status={issue.fields.status} />
  {/if}

  <!-- Assignee Avatar -->
  {#if showAssignee}
    <Avatar user={issue.fields.assignee} size={isCompact ? 'sm' : 'md'} />
  {/if}
</div>
