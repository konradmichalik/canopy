<script lang="ts">
  import { ExternalLink } from 'lucide-svelte';
  import type { JiraIssue } from '../../types';
  import StatusBadge from '../common/StatusBadge.svelte';
  import IssueTypeIcon from '../common/IssueTypeIcon.svelte';
  import Avatar from '../common/Avatar.svelte';
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
    issue.fields.aggregateprogress &&
    issue.fields.aggregateprogress.total > 0
  );

  const progressPercent = $derived(
    hasProgress
      ? Math.round(
          (issue.fields.aggregateprogress!.progress /
            issue.fields.aggregateprogress!.total) *
            100
        )
      : 0
  );
</script>

<div class="flex items-center gap-3 min-w-0 flex-1 py-1">
  <!-- Issue Type Icon -->
  <IssueTypeIcon issueType={issue.fields.issuetype} size={16} />

  <!-- Issue Key (link) -->
  <button
    onclick={openIssue}
    class="text-sm font-medium text-jira-blue hover:underline flex items-center gap-1 flex-shrink-0"
    title="Open in JIRA"
  >
    {issue.key}
    <ExternalLink class="w-3 h-3 opacity-50" />
  </button>

  <!-- Summary -->
  <span class="text-sm text-[var(--color-text-primary)] truncate min-w-0 flex-1">
    {issue.fields.summary}
  </span>

  <!-- Progress Bar (if available) -->
  {#if hasProgress}
    <div class="flex items-center gap-2 flex-shrink-0">
      <div class="w-16 h-1.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
        <div
          class="h-full bg-green-500 transition-all"
          style="width: {progressPercent}%"
        ></div>
      </div>
      <span class="text-xs text-[var(--color-text-secondary)] w-8 text-right">
        {progressPercent}%
      </span>
    </div>
  {/if}

  <!-- Status Badge -->
  <StatusBadge status={issue.fields.status} />

  <!-- Assignee Avatar -->
  <Avatar user={issue.fields.assignee} size="sm" />
</div>
