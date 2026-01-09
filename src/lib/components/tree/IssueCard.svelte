<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import ActivityBadge from '../common/ActivityBadge.svelte';
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
  import {
    toggleDynamicFilter,
    makeFilterId,
    makeAssigneeFilterId
  } from '../../stores/filters.svelte';
  import { formatDate, formatDateTime, getDueDateStatus } from '../../utils/formatDate';
  import {
    changeTrackingState,
    getIssueChangeType,
    isRecentlyUpdated
  } from '../../stores/changeTracking.svelte';
  import { openExternalUrl } from '../../utils/external-link';

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
      openExternalUrl(url);
    }
  }

  const hasProgress = $derived(
    issue.fields.aggregateprogress && issue.fields.aggregateprogress.total > 0
  );

  const progressPercent = $derived(
    hasProgress && issue.fields.aggregateprogress
      ? Math.round(
          (issue.fields.aggregateprogress.progress / issue.fields.aggregateprogress.total) * 100
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
  const showDueDate = $derived(isFieldEnabled('dueDate'));
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

  // Handle filter click on issue fields
  function handleFilterClick(event: MouseEvent, filterId: string): void {
    event.stopPropagation(); // Prevent TreeNode expand/collapse
    toggleDynamicFilter(filterId);
  }

  // Get comment count from fields (if available)
  const commentCount = $derived(
    (issue.fields as Record<string, unknown>).comment
      ? (((issue.fields as Record<string, unknown>).comment as { total?: number })?.total ?? 0)
      : 0
  );

  // Get fix versions
  const fixVersions = $derived(
    ((issue.fields as Record<string, unknown>).fixVersions as { name: string }[] | undefined) || []
  );

  // Display density
  const isCompact = $derived(displayDensityState.density === 'compact');

  // Change tracking
  const changeType = $derived(getIssueChangeType(issue.key));
  const recentlyUpdated = $derived(isRecentlyUpdated(issue));
  const showActivityBadge = $derived(
    changeTrackingState.isEnabled && (changeType !== null || recentlyUpdated)
  );
</script>

<div class="flex items-center min-w-0 flex-1 {isCompact ? 'gap-3 py-1' : 'gap-4 py-2.5'}">
  <!-- Issue Type Icon -->
  <button
    type="button"
    class="cursor-pointer hover:bg-surface-hovered rounded p-0.5 -m-0.5 transition-colors flex-shrink-0"
    onclick={(e) => handleFilterClick(e, makeFilterId('type', issue.fields.issuetype.name))}
    title={issue.fields.issuetype.name}
  >
    <IssueTypeIcon issueType={issue.fields.issuetype} size={isCompact ? 16 : 20} />
  </button>

  <!-- Issue Key (link) -->
  <div class="flex items-center gap-1.5 flex-shrink-0">
    {#if showActivityBadge}
      <ActivityBadge {changeType} isRecentlyActive={recentlyUpdated && changeType === null} />
    {/if}
    <Tooltip text="Open in Jira">
      <button
        onclick={openIssue}
        class="font-medium text-text-brand hover:underline flex items-center gap-1 {isCompact
          ? 'text-sm'
          : 'text-base gap-1.5'}"
      >
        {issue.key}
        <AtlaskitIcon name="link-external" size={isCompact ? 12 : 14} class="opacity-50" />
      </button>
    </Tooltip>
  </div>

  <!-- Summary -->
  <span class="text-text truncate min-w-0 flex-1 {isCompact ? 'text-sm' : 'text-base'}">
    {issue.fields.summary}
  </span>

  <!-- Priority -->
  {#if showPriority && issue.fields.priority}
    <button
      type="button"
      class="cursor-pointer hover:bg-surface-hovered rounded p-0.5 -m-0.5 transition-colors flex items-center gap-1 flex-shrink-0"
      onclick={(e) =>
        issue.fields.priority &&
        handleFilterClick(e, makeFilterId('priority', issue.fields.priority.name))}
      title={`Priority: ${issue.fields.priority.name}`}
    >
      <img src={issue.fields.priority.iconUrl} alt={issue.fields.priority.name} class="w-4 h-4" />
    </button>
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

  <!-- Due Date -->
  {#if showDueDate && issue.fields.duedate}
    {@const dueDateStatus = getDueDateStatus(issue.fields.duedate)}
    <Tooltip text={`${dueDateStatus.label}: ${formatDate(issue.fields.duedate)}`}>
      <div class="flex items-center gap-1 text-xs {dueDateStatus.colorClass} flex-shrink-0">
        <AtlaskitIcon name="calendar" size={14} color={dueDateStatus.iconColor} />
        <span>{formatDate(issue.fields.duedate)}</span>
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
    <div class="flex items-center gap-1 flex-shrink-0">
      <AtlaskitIcon name="component" size={14} color="var(--color-text-subtle)" />
      {#each issue.fields.components as component, i (component.id)}
        <button
          type="button"
          class="cursor-pointer hover:bg-surface-hovered rounded px-0.5 -mx-0.5 transition-colors text-xs text-text-subtle"
          onclick={(e) => handleFilterClick(e, makeFilterId('component', component.name))}
          title={component.name}
        >
          {component.name}{i < issue.fields.components.length - 1 ? ',' : ''}
        </button>
      {/each}
    </div>
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
          <div
            class="h-full bg-success transition-all"
            style="width: {aggregatedTimeProgress.percent}%"
          ></div>
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
          <div
            class="h-full bg-brand-bold transition-all"
            style="width: {aggregatedResolutionProgress.percent}%"
          ></div>
        </div>
        <span class="text-xs text-text-subtle w-8 text-right">
          {done}/{total}
        </span>
      </div>
    </Tooltip>
  {/if}

  <!-- Progress Bar (JIRA native aggregateprogress) -->
  {#if showProgress && hasProgress && issue.fields.aggregateprogress}
    {@const progress = issue.fields.aggregateprogress.progress}
    {@const total = issue.fields.aggregateprogress.total}
    {@const remaining = total - progress}
    {@const progressHours = Math.round(progress / 3600)}
    {@const totalHours = Math.round(total / 3600)}
    {@const remainingHours = Math.round(remaining / 3600)}
    <Tooltip
      text={`Progress: ${progressPercent}%\nLogged: ${progressHours}h / ${totalHours}h\nRemaining: ${remainingHours}h`}
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
    <button
      type="button"
      class="cursor-pointer hover:bg-surface-hovered rounded px-0.5 -mx-0.5 transition-colors"
      onclick={(e) => handleFilterClick(e, makeFilterId('status', issue.fields.status.name))}
      title={issue.fields.status.name}
    >
      <StatusBadge status={issue.fields.status} />
    </button>
  {/if}

  <!-- Assignee Avatar -->
  {#if showAssignee}
    <button
      type="button"
      class="cursor-pointer hover:bg-surface-hovered rounded-full p-0.5 -m-0.5 transition-colors"
      onclick={(e) =>
        handleFilterClick(
          e,
          issue.fields.assignee
            ? makeAssigneeFilterId(issue.fields.assignee)
            : 'assignee-unassigned'
        )}
      title={issue.fields.assignee ? issue.fields.assignee.displayName : 'Unassigned'}
    >
      <Avatar user={issue.fields.assignee} size={isCompact ? 'sm' : 'md'} />
    </button>
  {/if}
</div>
