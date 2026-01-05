<script lang="ts">
  import { ExternalLink } from 'lucide-svelte';
  import type { JiraIssue } from '../../types';
  import StatusBadge from '../common/StatusBadge.svelte';
  import IssueTypeIcon from '../common/IssueTypeIcon.svelte';
  import Avatar from '../common/Avatar.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import { getIssueUrl } from '../../stores/issues.svelte';

  interface Props {
    issue: JiraIssue;
  }

  let { issue }: Props = $props();

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
</script>

<div class="flex items-center gap-4 min-w-0 flex-1 py-2.5">
  <!-- Issue Type Icon -->
  <IssueTypeIcon issueType={issue.fields.issuetype} size={20} />

  <!-- Issue Key (link) -->
  <button
    onclick={openIssue}
    class="text-base font-medium text-text-brand hover:underline flex items-center gap-1.5 flex-shrink-0"
    title="Open in JIRA"
  >
    {issue.key}
    <ExternalLink class="w-3.5 h-3.5 opacity-50" />
  </button>

  <!-- Summary -->
  <span class="text-base text-text truncate min-w-0 flex-1">
    {issue.fields.summary}
  </span>

  <!-- Progress Bar (if available) -->
  {#if hasProgress}
    {@const progress = issue.fields.aggregateprogress!.progress}
    {@const total = issue.fields.aggregateprogress!.total}
    {@const remaining = total - progress}
    {@const progressHours = Math.round(progress / 3600)}
    {@const totalHours = Math.round(total / 3600)}
    {@const remainingHours = Math.round(remaining / 3600)}
    <Tooltip text={`Progress: ${progressPercent}%\nLogged: ${progressHours}h / ${totalHours}h\nRemaining: ${remainingHours}h`}>
      <div class="flex items-center gap-2 flex-shrink-0">
        <div class="w-16 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
          <div class="h-full bg-success transition-all" style="width: {progressPercent}%"></div>
        </div>
        <span class="text-xs text-text-subtle w-8 text-right">
          {progressPercent}%
        </span>
      </div>
    </Tooltip>
  {/if}

  <!-- Status Badge -->
  <StatusBadge status={issue.fields.status} />

  <!-- Assignee Avatar -->
  <Avatar user={issue.fields.assignee} size="md" />
</div>
