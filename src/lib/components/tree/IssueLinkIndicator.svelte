<script lang="ts">
  import type { JiraIssueLink } from '../../types/jira';
  import {
    getBlockingState,
    getIndicatorTooltip,
    type LinkedIssueInfo
  } from '../../utils/issue-links';
  import StatusBadge from '../common/StatusBadge.svelte';
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import * as DropdownMenu from '../ui/dropdown-menu';
  import { getIssueUrl } from '../../stores/issues.svelte';
  import { openExternalUrl } from '../../utils/external-link';

  interface Props {
    issueLinks: JiraIssueLink[] | undefined;
  }

  let { issueLinks }: Props = $props();

  const blockingState = $derived(getBlockingState(issueLinks));
  const tooltipText = $derived(getIndicatorTooltip(blockingState));
  const hasLinks = $derived(blockingState.isBlocked || blockingState.isBlocking);

  const iconColor = $derived(
    blockingState.isBlocked ? 'var(--ds-icon-danger)' : 'var(--ds-icon-warning)'
  );

  function openLinkedIssue(key: string): void {
    const url = getIssueUrl(key);
    if (url) openExternalUrl(url);
  }
</script>

{#snippet issueList(issues: LinkedIssueInfo[])}
  {#each issues as issue (issue.key)}
    <DropdownMenu.Item
      class="flex items-center gap-2 cursor-pointer"
      onclick={() => openLinkedIssue(issue.key)}
    >
      <StatusBadge status={issue.status} />
      <span class="font-medium text-text-brand">{issue.key}</span>
      <span class="text-text-subtle truncate flex-1 text-xs">{issue.summary}</span>
    </DropdownMenu.Item>
  {/each}
{/snippet}

{#if hasLinks}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      <Tooltip text={tooltipText} position="top">
        <button
          type="button"
          class="inline-flex items-center justify-center cursor-pointer hover:bg-surface-hovered rounded p-0.5 -m-0.5 transition-colors"
          onclick={(e) => e.stopPropagation()}
          aria-label={tooltipText}
        >
          <AtlaskitIcon name="link" size={14} color={iconColor} />
        </button>
      </Tooltip>
    </DropdownMenu.Trigger>

    <DropdownMenu.Content align="start" class="min-w-[280px] max-w-[400px]">
      {#if blockingState.blockedByIssues.length > 0}
        <DropdownMenu.Label class="flex items-center gap-1.5 text-[var(--ds-text-danger)]">
          <AtlaskitIcon name="link" size={12} color="var(--ds-icon-danger)" />
          Blocked by ({blockingState.blockedByIssues.length})
        </DropdownMenu.Label>
        {@render issueList(blockingState.blockedByIssues)}
      {/if}

      {#if blockingState.blockedByIssues.length > 0 && blockingState.blockingIssues.length > 0}
        <DropdownMenu.Separator />
      {/if}

      {#if blockingState.blockingIssues.length > 0}
        <DropdownMenu.Label class="flex items-center gap-1.5 text-[var(--ds-text-warning-bold)]">
          <AtlaskitIcon name="link" size={12} color="var(--ds-icon-warning)" />
          Blocks ({blockingState.blockingIssues.length})
        </DropdownMenu.Label>
        {@render issueList(blockingState.blockingIssues)}
      {/if}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}
