<script lang="ts">
  import Tooltip from './Tooltip.svelte';
  import type { JiraStatus } from '../../types';

  interface Props {
    status: JiraStatus;
  }

  let { status }: Props = $props();

  // Get color based on status category using Atlassian semantic colors
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

  const colorClass = $derived(getStatusColor(status.statusCategory?.key || 'new'));
</script>

<Tooltip text={status.description || status.name}>
  <span class="inline-flex items-center px-2.5 py-1 text-sm font-medium rounded {colorClass}">
    {status.name}
  </span>
</Tooltip>
