<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    text: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    children: Snippet;
  }

  let { text, position = 'top', children }: Props = $props();

  let visible = $state(false);

  function show() {
    visible = true;
  }

  function hide() {
    visible = false;
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowPositionClasses = {
    top: 'top-full left-1/2 -translate-x-1/2',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 rotate-180',
    left: 'left-full top-1/2 -translate-y-1/2 -rotate-90',
    right: 'right-full top-1/2 -translate-y-1/2 rotate-90'
  };
</script>

<div
  class="relative inline-flex"
  role="button"
  tabindex="-1"
  onmouseenter={show}
  onmouseleave={hide}
  onfocusin={show}
  onfocusout={hide}
>
  {@render children()}

  {#if visible && text}
    <div
      class="absolute z-50 {positionClasses[position]} pointer-events-none"
      role="tooltip"
    >
      <div
        class="tooltip-content relative text-xs font-medium px-2.5 py-1.5 rounded shadow-lg whitespace-pre-line max-w-xs"
      >
        {text}
        <!-- Arrow -->
        <div class="tooltip-arrow absolute {arrowPositionClasses[position]}"></div>
      </div>
    </div>
  {/if}
</div>

<style>
  .tooltip-content {
    background-color: var(--ds-background-neutral-bold);
    color: var(--ds-text-inverse);
  }

  .tooltip-arrow {
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid var(--ds-background-neutral-bold);
  }
</style>
