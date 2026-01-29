<script lang="ts">
  import Tooltip from './Tooltip.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import type { JiraStatus } from '../../types';

  interface Props {
    status: JiraStatus;
  }

  let { status }: Props = $props();

  // Get color based on status category using outline style
  function getStatusClass(categoryKey: string): string {
    switch (categoryKey) {
      case 'done':
        return 'bg-transparent text-success border-success hover:bg-success/10';
      case 'indeterminate':
        return 'bg-transparent text-information border-information hover:bg-information/10';
      case 'new':
      default:
        return 'bg-transparent text-muted-foreground border-border hover:bg-muted';
    }
  }

  const statusClass = $derived(getStatusClass(status.statusCategory?.key || 'new'));
</script>

<Tooltip text={status.description || status.name}>
  <Badge class={statusClass}>
    {status.name}
  </Badge>
</Tooltip>
