<script lang="ts">
  import AtlaskitIcon from './AtlaskitIcon.svelte';

  interface Props {
    isExpanded: boolean;
    size?: 'sm' | 'md';
    onClick?: (e: MouseEvent) => void;
  }

  let { isExpanded, size = 'md', onClick }: Props = $props();

  // Sizing
  const iconSize = $derived(size === 'sm' ? 16 : 18);
  const containerWidth = $derived(size === 'sm' ? 'w-5' : 'w-6');

  // If no onClick provided, make button non-interactive so clicks pass through to parent
  const isInteractive = $derived(!!onClick);
</script>

<div
  class="{containerWidth} flex items-center justify-center flex-shrink-0 {isInteractive
    ? ''
    : 'pointer-events-none'}"
>
  {#if isInteractive}
    <button
      onclick={onClick}
      class="p-0.5 rounded hover:bg-surface-hovered text-text-subtle transition-transform duration-150 {isExpanded
        ? 'rotate-90'
        : ''}"
      tabindex="-1"
      aria-expanded={isExpanded}
      aria-label={isExpanded ? 'Collapse' : 'Expand'}
    >
      <AtlaskitIcon name="chevron-right" size={iconSize} />
    </button>
  {:else}
    <span
      class="p-0.5 text-text-subtle transition-transform duration-150 {isExpanded
        ? 'rotate-90'
        : ''}"
      aria-hidden="true"
    >
      <AtlaskitIcon name="chevron-right" size={iconSize} />
    </span>
  {/if}
</div>
