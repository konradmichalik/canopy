<script lang="ts">
  import type { Snippet } from 'svelte';
  import * as TooltipPrimitive from '$lib/components/ui/tooltip';

  interface Props {
    text?: string;
    content?: string;
    html?: boolean;
    position?: 'top' | 'bottom' | 'left' | 'right';
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
    children: Snippet;
  }

  let { text, content, html = false, position = 'top', placement, children }: Props = $props();

  // Support both text and content props (content takes precedence)
  const tooltipContent = $derived(content ?? text ?? '');

  // Map position/placement to shadcn side
  function getSide(): 'top' | 'bottom' | 'left' | 'right' {
    if (placement) {
      if (placement.startsWith('top')) return 'top';
      if (placement.startsWith('bottom')) return 'bottom';
      if (placement === 'left') return 'left';
      if (placement === 'right') return 'right';
    }
    return position;
  }

  const side = $derived(getSide());
</script>

{#if tooltipContent}
  <TooltipPrimitive.Provider delayDuration={200}>
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger class="inline-flex">
        {@render children()}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Content
        {side}
        sideOffset={4}
        class="bg-popover text-popover-foreground border shadow-md text-xs font-medium px-3 py-1.5 rounded-md max-w-[300px] whitespace-pre-line z-50"
        arrowClasses="bg-popover border-l border-b"
      >
        {#if html}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -- HTML mode is opt-in and content is developer-controlled -->
          {@html tooltipContent}
        {:else}
          {tooltipContent}
        {/if}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Root>
  </TooltipPrimitive.Provider>
{:else}
  <span class="inline-flex">
    {@render children()}
  </span>
{/if}
