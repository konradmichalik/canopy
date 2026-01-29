<script lang="ts">
  import ConfirmModal from './ConfirmModal.svelte';

  interface Props {
    open: boolean;
    itemName: string;
    itemType?: string;
    onConfirm: () => void;
    onClose?: () => void;
  }

  let { open = $bindable(), itemName, itemType = 'query', onConfirm, onClose }: Props = $props();
</script>

<ConfirmModal
  bind:open
  title="Delete {itemType}?"
  description="Are you sure you want to delete &quot;{itemName}&quot;? This action cannot be undone."
  confirmLabel="Delete"
  variant="destructive"
  icon="delete"
  {onConfirm}
  {onClose}
/>
