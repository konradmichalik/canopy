<script lang="ts">
  import type { JiraStatus } from '../../types';

  interface Props {
    status: JiraStatus;
  }

  let { status }: Props = $props();

  // Get color based on status category
  function getStatusColor(categoryKey: string): string {
    switch (categoryKey) {
      case 'done':
        return 'bg-green-600 text-white';
      case 'indeterminate':
        return 'bg-blue-600 text-white';
      case 'new':
      default:
        return 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]';
    }
  }

  const colorClass = $derived(getStatusColor(status.statusCategory?.key || 'new'));
</script>

<span
  class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded {colorClass}"
  title={status.description || status.name}
>
  {status.name}
</span>
