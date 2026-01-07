<script lang="ts">
  interface Props {
    total: number;
    current: number;
    onSelect: (index: number) => void;
  }

  let { total, current, onSelect }: Props = $props();

  function handleKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(index);
    }
  }
</script>

<div class="flex items-center justify-center gap-2" role="tablist" aria-label="Slide navigation">
  {#each Array(total) as _, index (index)}
    <button
      type="button"
      role="tab"
      tabindex={index === current ? 0 : -1}
      class="h-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 {index ===
      current
        ? 'bg-primary w-6'
        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2'}"
      onclick={() => onSelect(index)}
      onkeydown={(e) => handleKeydown(e, index)}
      aria-label="Go to slide {index + 1}"
      aria-selected={index === current}
    ></button>
  {/each}
</div>
