<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import AtlaskitIcon from './AtlaskitIcon.svelte';

  interface Props {
    open: boolean;
    itemName: string;
    itemType?: string;
    onConfirm: () => void;
    onClose?: () => void;
  }

  let { open = $bindable(), itemName, itemType = 'query', onConfirm, onClose }: Props = $props();

  function handleClose() {
    open = false;
    onClose?.();
  }

  function handleConfirm() {
    onConfirm();
    handleClose();
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-w-sm">
    <div class="flex flex-col items-center text-center gap-4">
      <div
        class="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive"
      >
        <AtlaskitIcon name="delete" size={24} />
      </div>

      <h2 class="text-lg font-semibold">Delete {itemType}?</h2>
      <p class="text-sm text-muted-foreground">
        Are you sure you want to delete "{itemName}"? This action cannot be undone.
      </p>

      <div class="flex items-center gap-3 w-full mt-2">
        <Button variant="outline" class="flex-1" onclick={handleClose}>Cancel</Button>
        <Button variant="destructive" class="flex-1" onclick={handleConfirm}>Delete</Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
