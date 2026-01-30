<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import AtlaskitIcon from './AtlaskitIcon.svelte';
  import Logo from './Logo.svelte';
  import { openExternalUrl } from '../../utils/external-link';
  import {
    checkForUpdate,
    getCachedUpdateStatus,
    type UpdateInfo
  } from '../../utils/version-check';

  interface Props {
    open: boolean;
    onClose: () => void;
  }

  let { open = $bindable(), onClose }: Props = $props();

  const version = __APP_VERSION__;
  const buildDate = new Date(__BUILD_DATE__).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const currentYear = new Date().getFullYear();

  let checking = $state(false);
  let checked = $state(false);
  let update = $state<UpdateInfo | null>(null);

  // Seed from cache so we show something immediately if a prior check exists
  const cached = getCachedUpdateStatus();
  checked = cached.checked;
  update = cached.update;

  // Trigger a fresh check whenever the modal opens
  $effect(() => {
    if (open) {
      checking = true;
      checkForUpdate().then((result) => {
        update = result;
        checked = true;
        checking = false;
      });
    }
  });

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose();
    }
  }

  async function handleGitHubClick() {
    await openExternalUrl('https://github.com/konradmichalik/canopy');
  }

  async function handleUpdateClick() {
    if (update) {
      await openExternalUrl(update.releaseUrl);
    }
  }
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-w-sm">
    <div class="flex flex-col items-center text-center py-4">
      <!-- Logo -->
      <div class="mb-4">
        <Logo size="lg" showText={false} />
      </div>

      <!-- App Name -->
      <h2 class="text-xl font-semibold mb-1">Canopy</h2>
      <p class="text-sm text-muted-foreground mb-4">Hierarchical Jira Issue Viewer</p>

      <!-- Version Info -->
      <div class="bg-muted/50 rounded-lg px-4 py-3 mb-4 w-full">
        <div class="flex justify-between items-center text-sm mb-2">
          <span class="text-muted-foreground">Version</span>
          <span class="font-mono font-medium">{version}</span>
        </div>
        <div class="flex justify-between items-center text-sm mb-2">
          <span class="text-muted-foreground">Build</span>
          <span class="text-muted-foreground">{buildDate}</span>
        </div>
        <div class="flex justify-between items-center text-sm">
          <span class="text-muted-foreground">Status</span>
          {#if checking || !checked}
            <span class="text-muted-foreground">Checking...</span>
          {:else if update}
            <button
              type="button"
              onclick={handleUpdateClick}
              class="text-primary hover:underline font-medium"
            >
              {update.tagName} available
            </button>
          {:else}
            <span class="text-chart-2 font-medium">Up to date</span>
          {/if}
        </div>
      </div>

      <!-- GitHub Link -->
      <Button variant="outline" size="sm" class="mb-4" onclick={handleGitHubClick}>
        <AtlaskitIcon name="link" size={14} />
        View on GitHub
      </Button>

      <!-- Copyright -->
      <p class="text-xs text-muted-foreground mb-4">
        &copy; {currentYear} Konrad Michalik
      </p>

      <!-- Close Button -->
      <Button variant="secondary" size="sm" onclick={onClose}>Close</Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
