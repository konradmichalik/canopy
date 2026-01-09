<script lang="ts">
  import type { ChangeDetection } from '../../types/changeTracking';
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import { formatDateTime } from '../../utils/formatDate';
  import { getIssueUrl } from '../../stores/issues.svelte';
  import { openExternalUrl } from '../../utils/external-link';

  interface Props {
    changes: ChangeDetection;
    onAcknowledge: () => void;
  }

  let { changes, onAcknowledge }: Props = $props();

  let isExpanded = $state(false);

  const checkpointTime = $derived(
    changes.checkpointTimestamp ? formatDateTime(changes.checkpointTimestamp) : null
  );

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
  <div class="bg-primary/10 border border-primary/30 rounded-lg mx-2 mb-2">
    <!-- Summary Header -->
    <div class="flex items-center justify-between px-3 py-2">
      <div class="flex items-center gap-2 text-sm">
        <AtlaskitIcon name="status" size={16} class="text-primary" />
        <span class="text-foreground">
          {#if changes.newIssues.length > 0}
            <span class="font-medium text-green-700 dark:text-green-400"
              >{changes.newIssues.length} new</span
            >
          {/if}
          {#if changes.removedIssues.length > 0}
            {#if changes.newIssues.length > 0}<span class="mx-1">&middot;</span>{/if}
            <span class="font-medium text-red-700 dark:text-red-400"
              >{changes.removedIssues.length} removed</span
            >
          {/if}
          {#if changes.statusChanges.length > 0}
            {#if changes.newIssues.length > 0 || changes.removedIssues.length > 0}<span class="mx-1"
                >&middot;</span
              >{/if}
            <span class="font-medium text-primary"
              >{changes.statusChanges.length} status changed</span
            >
          {/if}
          {#if checkpointTime}
            <span class="text-muted-foreground ml-2">(since {checkpointTime})</span>
          {/if}
        </span>
      </div>

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
        <button
          type="button"
          onclick={onAcknowledge}
          class="px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 rounded transition-colors flex items-center gap-1"
          title="Acknowledge changes and save new checkpoint"
        >
          <AtlaskitIcon name="check" size={14} />
          Acknowledge
        </button>
      </div>
    </div>

    <!-- Expanded Details -->
    {#if isExpanded}
      <div class="border-t border-primary/30 px-3 py-2 text-xs space-y-2">
        {#if changes.newIssues.length > 0}
          <div>
            <div class="font-medium text-green-700 dark:text-green-400 mb-1">New Issues:</div>
            <div class="flex flex-wrap gap-1">
              {#each changes.newIssues as issueKey (issueKey)}
                <button
                  type="button"
                  onclick={(e) => openIssue(issueKey, e)}
                  class="px-1.5 py-0.5 bg-green-100 dark:bg-green-900 rounded text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800 hover:underline cursor-pointer transition-colors"
                >
                  {issueKey}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        {#if changes.removedIssues.length > 0}
          <div>
            <div class="font-medium text-red-700 dark:text-red-400 mb-1">Removed Issues:</div>
            <div class="flex flex-wrap gap-1">
              {#each changes.removedIssues as removed (removed.key)}
                <button
                  type="button"
                  onclick={(e) => openIssue(removed.key, e)}
                  class="px-1.5 py-0.5 bg-red-100 dark:bg-red-900 rounded text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 hover:underline cursor-pointer transition-colors"
                >
                  {removed.key} <span class="opacity-70">(was: {removed.lastStatus})</span>
                </button>
              {/each}
            </div>
          </div>
        {/if}

        {#if changes.statusChanges.length > 0}
          <div>
            <div class="font-medium text-primary mb-1">Status Changes:</div>
            <div class="flex flex-wrap gap-1">
              {#each changes.statusChanges as change (change.key)}
                <button
                  type="button"
                  onclick={(e) => openIssue(change.key, e)}
                  class="px-1.5 py-0.5 bg-primary/20 rounded text-primary hover:bg-primary/30 hover:underline cursor-pointer transition-colors"
                >
                  {change.key}: {change.previousStatus} → {change.currentStatus}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}
