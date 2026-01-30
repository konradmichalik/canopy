<script lang="ts">
  import type { ChangeTypes, SingleChangeType } from '../../types/changeTracking';
  import Tooltip from './Tooltip.svelte';

  interface Props {
    changeTypes: ChangeTypes;
    isRecentlyActive?: boolean;
  }

  let { changeTypes, isRecentlyActive = false }: Props = $props();

  interface BadgeConfig {
    colorClass: string;
    tooltip: string;
    animate: boolean;
  }

  function getBadgeConfig(type: SingleChangeType): BadgeConfig {
    switch (type) {
      case 'new':
        return { colorClass: 'bg-change-new', tooltip: 'New since last checkpoint', animate: true };
      case 'status-changed':
        return { colorClass: 'bg-change-status', tooltip: 'Status changed', animate: false };
      case 'new-comments':
        return { colorClass: 'bg-change-comments', tooltip: 'New comments', animate: false };
      case 'assignee-changed':
        return { colorClass: 'bg-change-assignee', tooltip: 'Assignee changed', animate: false };
    }
  }

  const badges = $derived.by(() => {
    const result: BadgeConfig[] = changeTypes.map(getBadgeConfig);

    // Add recently active badge if no change types but recently updated
    if (result.length === 0 && isRecentlyActive) {
      result.push({ colorClass: 'bg-change-recent', tooltip: 'Recently updated', animate: false });
    }

    return result;
  });
</script>

{#if badges.length > 0}
  <span class="inline-flex items-center gap-0.5">
    {#each badges as badge, i (i)}
      <Tooltip text={badge.tooltip}>
        <span
          class="inline-block w-2 h-2 rounded-full {badge.colorClass} {badge.animate
            ? 'animate-pulse'
            : ''}"
        ></span>
      </Tooltip>
    {/each}
  </span>
{/if}
