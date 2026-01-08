<script lang="ts">
  import type { ChangeDetection } from '../../types/changeTracking';
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import { formatDateTime } from '../../utils/formatDate';

  interface Props {
    changes: ChangeDetection;
    onAcknowledge: () => void;
  }

  let { changes, onAcknowledge }: Props = $props();

  let isExpanded = $state(false);

  const checkpointTime = $derived(
    changes.checkpointTimestamp ? formatDateTime(changes.checkpointTimestamp) : null
  );
</script>

{#if changes.hasChanges}
  <div
    class="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg mx-2 mb-2"
  >
    <!-- Summary Header -->
    <div class="flex items-center justify-between px-3 py-2">
      <div class="flex items-center gap-2 text-sm">
        <AtlaskitIcon name="status" size={16} class="text-blue-600 dark:text-blue-400" />
        <span class="text-blue-800 dark:text-blue-200">
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
            {#if changes.newIssues.length > 0 || changes.removedIssues.length > 0}<span
                class="mx-1">&middot;</span
              >{/if}
            <span class="font-medium text-blue-700 dark:text-blue-400"
              >{changes.statusChanges.length} status changed</span
            >
          {/if}
          {#if checkpointTime}
            <span class="text-blue-600/70 dark:text-blue-400/70 ml-2">(since {checkpointTime})</span
            >
          {/if}
        </span>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          onclick={() => (isExpanded = !isExpanded)}
          class="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
          title={isExpanded ? 'Collapse details' : 'Show details'}
        >
          <AtlaskitIcon
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            class="text-blue-600 dark:text-blue-400"
          />
        </button>
        <button
          type="button"
          onclick={onAcknowledge}
          class="px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
          title="Acknowledge changes and save new checkpoint"
        >
          Acknowledge
        </button>
      </div>
    </div>

    <!-- Expanded Details -->
    {#if isExpanded}
      <div class="border-t border-blue-200 dark:border-blue-800 px-3 py-2 text-xs space-y-2">
        {#if changes.newIssues.length > 0}
          <div>
            <div class="font-medium text-green-700 dark:text-green-400 mb-1">New Issues:</div>
            <div class="flex flex-wrap gap-1">
              {#each changes.newIssues as issueKey (issueKey)}
                <span class="px-1.5 py-0.5 bg-green-100 dark:bg-green-900 rounded text-green-800 dark:text-green-200">
                  {issueKey}
                </span>
              {/each}
            </div>
          </div>
        {/if}

        {#if changes.removedIssues.length > 0}
          <div>
            <div class="font-medium text-red-700 dark:text-red-400 mb-1">Removed Issues:</div>
            <div class="flex flex-wrap gap-1">
              {#each changes.removedIssues as removed (removed.key)}
                <span class="px-1.5 py-0.5 bg-red-100 dark:bg-red-900 rounded text-red-800 dark:text-red-200">
                  {removed.key} <span class="opacity-70">(was: {removed.lastStatus})</span>
                </span>
              {/each}
            </div>
          </div>
        {/if}

        {#if changes.statusChanges.length > 0}
          <div>
            <div class="font-medium text-blue-700 dark:text-blue-400 mb-1">Status Changes:</div>
            <div class="flex flex-wrap gap-1">
              {#each changes.statusChanges as change (change.key)}
                <span class="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-blue-800 dark:text-blue-200">
                  {change.key}: {change.previousStatus} → {change.currentStatus}
                </span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}
