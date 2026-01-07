<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Label } from '$lib/components/ui/label';
  import AtlaskitIcon, { type AtlaskitIconName } from '../common/AtlaskitIcon.svelte';
  import Logo from '../common/Logo.svelte';
  import SliderDots from './SliderDots.svelte';
  import {
    helpModalState,
    closeHelpModal,
    markIntroAsSeen,
    nextSlide,
    prevSlide,
    goToSlide
  } from '../../stores/helpModal.svelte';

  interface Slide {
    id: string;
    title: string;
    icon: AtlaskitIconName;
    content: string;
    hasLogo?: boolean;
  }

  // Slide definitions
  const slides: Slide[] = [
    {
      id: 'welcome',
      title: 'Welcome to Canopy',
      icon: 'dashboard',
      content:
        'Canopy visualizes your Jira issues in a hierarchical tree view. Keep track of Epics, Stories, Tasks, and Subtasks at a glance.',
      hasLogo: true
    },
    {
      id: 'connection',
      title: 'Connect to Jira',
      icon: 'link',
      content:
        'Connect to Jira Cloud or Server/Data Center. Use API tokens (Cloud) or Personal Access Tokens (Server) for authentication. A CORS proxy is required for local development.'
    },
    {
      id: 'tree-view',
      title: 'Hierarchical Tree View',
      icon: 'git-branch',
      content:
        'View your issues in their natural hierarchy: Epic → Story → Task → Subtask. Expand and collapse branches to focus on what matters.'
    },
    {
      id: 'filters',
      title: 'Powerful Filters',
      icon: 'filter',
      content:
        'Use quick filters for assignee and status. Dynamic filters are automatically generated from your loaded issues. Text search finds issues instantly.'
    },
    {
      id: 'jql-queries',
      title: 'Saved JQL Queries',
      icon: 'search',
      content:
        'Create and save custom JQL queries. Assign colors for better organization. Import and export queries between instances.'
    },
    {
      id: 'keyboard',
      title: 'Keyboard Shortcuts',
      icon: 'keyboard',
      content:
        'Navigate efficiently with the keyboard: j/k or arrow keys to move, h/l to expand/collapse, Enter to open in Jira, Space to toggle.'
    },
    {
      id: 'export',
      title: 'Export & Import',
      icon: 'download',
      content:
        'Export your complete configuration including connection and queries. Import on other devices or share with team members.'
    }
  ];

  let dontShowAgain = $state(false);

  function handleClose(markAsSeen = false) {
    if (markAsSeen || dontShowAgain) {
      markIntroAsSeen();
    }
    closeHelpModal();
  }

  function handleNext() {
    if (isLastSlide) {
      handleClose(true);
    } else {
      nextSlide(slides.length);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!helpModalState.isOpen) return;

    if (event.key === 'ArrowRight' || event.key === 'l') {
      handleNext();
    } else if (event.key === 'ArrowLeft' || event.key === 'h') {
      prevSlide();
    }
  }

  const isFirstSlide = $derived(helpModalState.currentSlide === 0);
  const isLastSlide = $derived(helpModalState.currentSlide === slides.length - 1);
  const currentSlideData = $derived(slides[helpModalState.currentSlide]);
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog.Root bind:open={helpModalState.isOpen} onOpenChange={(open) => !open && handleClose()}>
  <Dialog.Content class="max-w-2xl p-0 gap-0 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b">
      <span class="text-sm text-muted-foreground">
        {helpModalState.currentSlide + 1} / {slides.length}
      </span>
      <Dialog.Close />
    </div>

    <!-- Slide Content -->
    <div class="px-6 py-8 min-h-[320px] flex flex-col">
      <!-- Image Placeholder -->
      <div
        class="flex-1 mb-6 bg-muted/50 rounded-lg flex items-center justify-center min-h-[160px] border-2 border-dashed border-muted-foreground/20"
      >
        {#if currentSlideData.hasLogo}
          <Logo size="lg" showText={true} />
        {:else}
          <div class="text-center text-muted-foreground">
            <AtlaskitIcon name={currentSlideData.icon} size={48} class="mx-auto mb-2 opacity-50" />
            <p class="text-sm">Image placeholder</p>
          </div>
        {/if}
      </div>

      <!-- Text Content -->
      <div class="text-center">
        <div class="flex items-center justify-center gap-2 mb-3">
          <AtlaskitIcon name={currentSlideData.icon} size={24} class="text-primary" />
          <h2 class="text-xl font-semibold">{currentSlideData.title}</h2>
        </div>
        <p class="text-muted-foreground leading-relaxed max-w-md mx-auto">
          {currentSlideData.content}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="px-6 py-4 border-t bg-muted/30">
      <!-- Don't show again checkbox -->
      <div class="flex items-center justify-center gap-2 mb-4">
        <Checkbox id="dont-show-again" bind:checked={dontShowAgain} />
        <Label for="dont-show-again" class="text-sm text-muted-foreground cursor-pointer">
          Don't show again
        </Label>
      </div>

      <!-- Dots -->
      <div class="mb-4">
        <SliderDots
          total={slides.length}
          current={helpModalState.currentSlide}
          onSelect={goToSlide}
        />
      </div>

      <!-- Navigation Buttons -->
      <div class="flex items-center justify-center gap-3">
        <Button variant="outline" onclick={prevSlide} disabled={isFirstSlide} class="w-28">
          <AtlaskitIcon name="chevron-left" size={16} />
          Back
        </Button>
        <Button onclick={handleNext} class="w-28">
          {#if isLastSlide}
            Done
            <AtlaskitIcon name="check" size={16} />
          {:else}
            Next
            <AtlaskitIcon name="chevron-right" size={16} />
          {/if}
        </Button>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
