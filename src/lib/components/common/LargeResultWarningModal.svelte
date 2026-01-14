<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import AtlaskitIcon from './AtlaskitIcon.svelte';
  import { BATCH_SIZE, LARGE_RESULT_THRESHOLD } from '../../stores/issues.svelte';

  interface Props {
    totalCount: number;
    onLoadFirst: () => void;
    onLoadAll: () => void;
    onCancel: () => void;
  }

  let { totalCount, onLoadFirst, onLoadAll, onCancel }: Props = $props();
</script>

<Dialog.Root open onOpenChange={(isOpen) => !isOpen && onCancel()}>
  <Dialog.Content class="max-w-md">
    <div class="flex flex-col items-center text-center gap-4">
      <div
        class="w-12 h-12 rounded-full bg-[color:var(--ds-background-warning)] flex items-center justify-center text-[color:var(--ds-icon-warning)]"
      >
        <AtlaskitIcon name="warning" size={24} />
      </div>

      <h2 class="text-lg font-semibold">Large Result Set</h2>

      <p class="text-sm text-muted-foreground">
        This query matches <strong class="text-foreground">{totalCount.toLocaleString()}</strong>
        issues, which exceeds the recommended limit of {LARGE_RESULT_THRESHOLD.toLocaleString()}.
      </p>

      <p class="text-sm text-muted-foreground">
        Loading all issues may take a while and could affect performance.
      </p>

      <div class="flex flex-col items-stretch gap-2 w-full mt-2">
        <Button variant="default" onclick={onLoadFirst}>
          Load first {BATCH_SIZE} issues
        </Button>
        <Button variant="outline" onclick={onLoadAll}>
          Load all {totalCount.toLocaleString()} issues
        </Button>
        <Button variant="ghost" onclick={onCancel}>Cancel</Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
