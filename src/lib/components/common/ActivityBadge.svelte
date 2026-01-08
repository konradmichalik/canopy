<script lang="ts">
  import type { ChangeType } from '../../types/changeTracking';
  import Tooltip from './Tooltip.svelte';

  interface Props {
    changeType: ChangeType;
    isRecentlyActive?: boolean;
  }

  let { changeType, isRecentlyActive = false }: Props = $props();

  const badgeConfig = $derived.by(() => {
    if (changeType === 'new')
      return {
        colorClass: 'bg-green-500',
        tooltip: 'New since last checkpoint',
        animate: true
      };
    if (changeType === 'status-changed')
      return {
        colorClass: 'bg-blue-500',
        tooltip: 'Status changed',
        animate: false
      };
    if (isRecentlyActive)
      return {
        colorClass: 'bg-amber-500',
        tooltip: 'Recently updated',
        animate: false
      };
    return null;
  });
</script>

{#if badgeConfig}
  <Tooltip text={badgeConfig.tooltip}>
    <span
      class="inline-block w-2 h-2 rounded-full {badgeConfig.colorClass} {badgeConfig.animate
        ? 'animate-pulse'
        : ''}"
    ></span>
  </Tooltip>
{/if}
