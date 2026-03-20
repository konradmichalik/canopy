<script lang="ts">
  import Tooltip from './Tooltip.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import type { JiraStatus } from '../../types';

  interface Props {
    status: JiraStatus;
  }

  let { status }: Props = $props();

  // Get color based on status category using soft filled style
  function getStatusClass(categoryKey: string): string {
    switch (categoryKey) {
      case 'done':
        return 'bg-success/15 text-success border-transparent hover:bg-success/25';
      case 'indeterminate':
        return 'bg-information/15 text-information border-transparent hover:bg-information/25';
      case 'new':
      default:
        return 'bg-muted text-muted-foreground border-transparent hover:bg-muted-foreground/15';
    }
  }

  const statusClass = $derived(getStatusClass(status.statusCategory?.key || 'new'));
</script>

<Tooltip text={status.description || status.name}>
  <Badge class={statusClass}>
    {status.name}
  </Badge>
</Tooltip>
