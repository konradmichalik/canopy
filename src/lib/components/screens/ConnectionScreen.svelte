<script lang="ts">
  import ConnectionForm from '../connection/ConnectionForm.svelte';
  import SettingsModal from '../common/SettingsModal.svelte';
  import Logo from '../common/Logo.svelte';
  import HelpModal from '../help/HelpModal.svelte';
  import { Button } from '$lib/components/ui/button';
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import { openHelpModal } from '../../stores/helpModal.svelte';
</script>

<div class="min-h-screen bg-muted/40 flex flex-col">
  <!-- Header -->
  <header class="border-b border-border bg-background">
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
      <Logo size="md" />
      <div class="flex items-center gap-2">
        <Tooltip text="Help">
          <Button variant="ghost" size="icon" onclick={openHelpModal} class="h-8 w-8">
            <AtlaskitIcon name="question-circle" size={18} />
          </Button>
        </Tooltip>
        <SettingsModal minimal />
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 flex items-center justify-center p-4">
    <!-- Connection Form -->
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-foreground mb-2">Connect to Jira</h2>
        <p class="text-muted-foreground">Enter your Jira credentials to get started</p>
      </div>

      <div class="bg-background border border-border rounded-xl p-6 shadow-sm">
        <ConnectionForm />
      </div>
    </div>
  </main>
</div>

<HelpModal />
