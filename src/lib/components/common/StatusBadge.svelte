<script lang="ts">
  import Tooltip from './Tooltip.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import type { JiraStatus } from '../../types';

  interface Props {
    status: JiraStatus;
  }

  let { status }: Props = $props();

  // Get color based on status category using Atlassian semantic colors
  function getStatusClass(categoryKey: string): string {
    switch (categoryKey) {
      case 'done':
        return 'bg-success text-text-inverse border-transparent hover:bg-success/90';
      case 'indeterminate':
        return 'bg-information text-text-inverse border-transparent hover:bg-information/90';
      case 'new':
      default:
        return 'bg-neutral text-text border-transparent hover:bg-neutral/90';
    }
  }

  const statusClass = $derived(getStatusClass(status.statusCategory?.key || 'new'));
</script>

<Tooltip text={status.description || status.name}>
  <Badge class={statusClass}>
    {status.name}
  </Badge>
</Tooltip>
