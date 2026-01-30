<script lang="ts">
  import { getAvatarColor } from '../../utils/avatar-colors';
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import AccordionChevron from '../common/AccordionChevron.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import type {
    IssueGroup,
    SprintGroupMetadata,
    AssigneeGroupMetadata,
    StatusGroupMetadata,
    ProjectGroupMetadata,
    RecencyGroupMetadata,
    ReleaseGroupMetadata
  } from '../../stores/grouping.svelte';
  import {
    calculateIssuesTimeProgress,
    calculateIssuesResolutionProgress,
    issuesHaveTimeTrackingData,
    formatHours
  } from '../../utils/aggregated-progress';
  import AuthImage from '../common/AuthImage.svelte';

  interface Props {
    group: IssueGroup;
    isExpanded: boolean;
    onToggle: () => void;
  }

  let { group, isExpanded, onToggle }: Props = $props();

  const isSprint = $derived(group.metadata?.type === 'sprint');
  const isAssignee = $derived(group.metadata?.type === 'assignee');
  const isStatus = $derived(group.metadata?.type === 'status');
  const isProject = $derived(group.metadata?.type === 'project');
  const isRecency = $derived(group.metadata?.type === 'recency');
  const isRelease = $derived(group.metadata?.type === 'release');

  const sprintMeta = $derived(isSprint ? (group.metadata as SprintGroupMetadata) : null);
  const assigneeMeta = $derived(isAssignee ? (group.metadata as AssigneeGroupMetadata) : null);
  const statusMeta = $derived(isStatus ? (group.metadata as StatusGroupMetadata) : null);
  const projectMeta = $derived(isProject ? (group.metadata as ProjectGroupMetadata) : null);
  const recencyMeta = $derived(isRecency ? (group.metadata as RecencyGroupMetadata) : null);
  const releaseMeta = $derived(isRelease ? (group.metadata as ReleaseGroupMetadata) : null);

  // Use same identifier fallback as Avatar.svelte for consistent colors
  const assigneeBorderColor = $derived(
    assigneeMeta
      ? getAvatarColor(
          assigneeMeta.accountId || assigneeMeta.emailAddress || assigneeMeta.displayName || ''
        )
      : '#6B778C'
  );

  // Aggregated stats for all group types
  const timeProgress = $derived(calculateIssuesTimeProgress(group.issues));
  const resolutionProgress = $derived(calculateIssuesResolutionProgress(group.issues));
  const hasTimeData = $derived(issuesHaveTimeTrackingData(group.issues));

  // Get initials from name for fallback avatar
  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // Get status color based on category
  function getStatusColor(categoryKey: string): string {
    switch (categoryKey) {
      case 'done':
        return 'bg-success text-text-inverse';
      case 'indeterminate':
        return 'bg-information text-text-inverse';
      case 'new':
      default:
        return 'bg-neutral text-text';
    }
  }

  // Sprint state styling
  const sprintStateStyles = $derived(() => {
    if (!sprintMeta) return {};
    switch (sprintMeta.state) {
      case 'active':
        return { bg: 'bg-success-subtle', text: 'text-success', label: 'Active' };
      case 'future':
        return { bg: 'bg-information-subtle', text: 'text-information', label: 'Future' };
      case 'closed':
        return { bg: 'bg-neutral-subtle', text: 'text-text-subtlest', label: 'Closed' };
      default:
        return { bg: 'bg-surface-sunken', text: 'text-text-subtle', label: '' };
    }
  });

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  }
</script>

<div
  class="group-header flex items-center gap-3 px-3 py-2.5 bg-surface-sunken hover:bg-surface-hovered rounded-lg cursor-pointer select-none transition-colors"
  onclick={onToggle}
  onkeydown={handleKeydown}
  role="button"
  tabindex="0"
  aria-expanded={isExpanded}
>
  <!-- Expand/Collapse icon -->
  <AccordionChevron {isExpanded} />

  <!-- Group icon based on type -->
  {#if isSprint}
    <AtlaskitIcon name="sprint" size={18} class="text-brand" />
  {:else if isAssignee && assigneeMeta}
    <div
      class="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 box-content flex items-center justify-center bg-neutral"
      style="border: 2px solid {assigneeBorderColor}"
    >
      <AuthImage src={assigneeMeta.avatarUrl} alt="" class="w-full h-full object-cover">
        {#snippet fallback()}
          <span class="text-xs font-medium text-text-subtle">
            {getInitials(group.label || '?')}
          </span>
        {/snippet}
      </AuthImage>
    </div>
  {:else if isStatus && statusMeta}
    <span
      class="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded {getStatusColor(
        statusMeta.categoryKey
      )}"
    >
      {group.label}
    </span>
  {:else if isProject && projectMeta}
    <div class="w-5 h-5 flex items-center justify-center flex-shrink-0">
      <AuthImage src={projectMeta.avatarUrl} alt="" class="w-5 h-5 rounded">
        {#snippet fallback()}
          <AtlaskitIcon name="folder" size={18} class="text-brand" />
        {/snippet}
      </AuthImage>
    </div>
  {:else if isRecency && recencyMeta}
    <AtlaskitIcon name={recencyMeta.icon} size={18} class={recencyMeta.colorClass} />
  {:else if isRelease}
    <AtlaskitIcon
      name="release"
      size={18}
      class={releaseMeta?.version ? 'text-brand' : 'text-text-subtle'}
    />
  {:else}
    <AtlaskitIcon name="layers" size={18} class="text-text-subtle" />
  {/if}

  <!-- Group label -->
  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-2">
      <span class="font-medium text-text truncate">{group.label}</span>

      {#if isSprint && sprintMeta && sprintMeta.state !== 'none'}
        <span
          class="px-1.5 py-0.5 text-xs font-medium rounded {sprintStateStyles()
            .bg} {sprintStateStyles().text}"
        >
          {sprintStateStyles().label}
        </span>
      {/if}
    </div>

    {#if group.subtitle}
      <span class="text-xs text-text-subtlest">{group.subtitle}</span>
    {/if}
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
    {#if group.issues.length > 0}
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
      {group.issues.length} Issues
    </span>
  </div>
</div>
