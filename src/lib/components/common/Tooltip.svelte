<script lang="ts">
  import type { Snippet } from 'svelte';
  import tippy, { type Instance, type Placement } from 'tippy.js';
  import 'tippy.js/dist/tippy.css';
  import { onMount } from 'svelte';

  interface Props {
    text?: string;
    content?: string;
    html?: boolean;
    position?: 'top' | 'bottom' | 'left' | 'right';
    placement?: Placement;
    children: Snippet;
  }

  let { text, content, html = false, position = 'top', placement, children }: Props = $props();

  // Support both text and content props (content takes precedence)
  const tooltipContent = $derived(content ?? text ?? '');

  let containerRef: HTMLSpanElement | undefined = $state();
  let tippyInstance: Instance | undefined;

  // Map position to tippy placement
  const placementMap: Record<string, Placement> = {
    top: 'top',
    bottom: 'bottom',
    left: 'left',
    right: 'right',
    'bottom-end': 'bottom-end',
    'bottom-start': 'bottom-start',
    'top-end': 'top-end',
    'top-start': 'top-start'
  };

  onMount(() => {
    if (containerRef) {
      tippyInstance = tippy(containerRef, {
        content: tooltipContent,
        placement: placement ?? placementMap[position],
        arrow: true,
        animation: 'fade',
        duration: [150, 100],
        delay: [200, 0],
        allowHTML: html,
        appendTo: () => document.body,
        theme: 'custom',
        maxWidth: 300,
        interactive: html
      });
    }

    return () => {
      tippyInstance?.destroy();
    };
  });

  // Update tooltip content when text changes
  $effect(() => {
    if (tippyInstance) {
      tippyInstance.setContent(tooltipContent);
    }
  });
</script>

<span class="inline-flex" bind:this={containerRef}>
  {@render children()}
</span>

<style>
  :global(.tippy-box[data-theme~='custom']) {
    background-color: var(--ds-background-neutral-bold, #44546f);
    color: var(--ds-text-inverse, #fff);
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 4px;
    padding: 2px 4px;
  }

  :global(.tippy-box[data-theme~='custom'] .tippy-content) {
    padding: 4px 8px;
    white-space: pre-line;
  }

  :global(.tippy-box[data-theme~='custom'] .tippy-arrow) {
    color: var(--ds-background-neutral-bold, #44546f);
  }
</style>
