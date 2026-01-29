<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import AtlaskitIcon from './AtlaskitIcon.svelte';
  import type { AtlaskitIconName } from './AtlaskitIcon.svelte';

  interface Props {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'destructive' | 'default';
    icon?: AtlaskitIconName;
    onConfirm: () => void | Promise<void>;
    onClose?: () => void;
  }

  let {
    open = $bindable(),
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    icon = 'warning',
    onConfirm,
    onClose
  }: Props = $props();

  let isConfirming = $state(false);

  function handleClose() {
    if (isConfirming) return;
    open = false;
    onClose?.();
  }

  async function handleConfirm() {
    isConfirming = true;
    try {
      await onConfirm();
      handleClose();
    } finally {
      isConfirming = false;
    }
  }

  const iconColorClass = $derived(
    variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
  );
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-w-sm">
    <div class="flex flex-col items-center text-center gap-4">
      <div class="w-12 h-12 rounded-full flex items-center justify-center {iconColorClass}">
        <AtlaskitIcon name={icon} size={24} />
      </div>

      <h2 class="text-lg font-semibold">{title}</h2>
      <p class="text-sm text-muted-foreground">
        {description}
      </p>

      <div class="flex items-center gap-3 w-full mt-2">
        <Button variant="outline" class="flex-1" onclick={handleClose} disabled={isConfirming}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          class="flex-1"
          onclick={handleConfirm}
          disabled={isConfirming}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
