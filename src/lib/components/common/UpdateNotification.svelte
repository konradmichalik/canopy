<script lang="ts">
  import type { UpdateInfo } from '../../utils/version-check';
  import { dismissUpdate } from '../../utils/version-check';
  import { openExternalUrl } from '../../utils/external-link';
  import AtlaskitIcon from './AtlaskitIcon.svelte';

  interface Props {
    update: UpdateInfo | null;
  }

  let { update }: Props = $props();

  let dismissed = $state(false);

  function handleDismiss(): void {
    if (update) {
      dismissUpdate(update.tagName);
    }
    dismissed = true;
  }

  async function handleOpenRelease(): Promise<void> {
    if (update) {
      await openExternalUrl(update.releaseUrl);
    }
  }

  const visible = $derived(update !== null && !dismissed);
</script>

{#if visible}
  <div
    class="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-md shadow-sm border border-primary bg-background text-foreground animate-slide-up max-w-sm"
  >
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium">New version available</p>
      <p class="text-xs text-muted-foreground mt-0.5 truncate">{update!.tagName}</p>
    </div>

    <button
      type="button"
      onclick={handleOpenRelease}
      class="shrink-0 px-3 py-1.5 text-xs font-semibold border border-primary text-primary bg-transparent hover:bg-primary/10 rounded-md transition-colors"
    >
      View Release
    </button>

    <button
      type="button"
      onclick={handleDismiss}
      class="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
      title="Dismiss"
    >
      <AtlaskitIcon name="cross" size={16} />
    </button>
  </div>
{/if}
