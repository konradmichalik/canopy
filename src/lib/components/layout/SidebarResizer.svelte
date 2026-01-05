<script lang="ts">
  import { MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH } from '../../stores/router.svelte';

  interface Props {
    onResize: (width: number) => void;
    currentWidth: number;
  }

  let { onResize, currentWidth }: Props = $props();

  let isResizing = $state(false);
  let startX = 0;
  let startWidth = 0;

  function handleMouseDown(e: MouseEvent): void {
    e.preventDefault();
    isResizing = true;
    startX = e.clientX;
    startWidth = currentWidth;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  function handleMouseMove(e: MouseEvent): void {
    if (!isResizing) return;

    const delta = e.clientX - startX;
    const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, startWidth + delta));
    onResize(newWidth);
  }

  function handleMouseUp(): void {
    isResizing = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
</script>

<div
  role="separator"
  aria-orientation="vertical"
  aria-valuenow={currentWidth}
  aria-valuemin={MIN_SIDEBAR_WIDTH}
  aria-valuemax={MAX_SIDEBAR_WIDTH}
  tabindex="0"
  class="w-1.5 flex-shrink-0 cursor-col-resize group relative transition-all duration-200
    {isResizing ? 'bg-brand' : 'bg-border hover:bg-brand/60'}"
  onmousedown={handleMouseDown}
>
  <!-- Wider hit area -->
  <div
    class="absolute inset-y-0 -left-1.5 -right-1.5 transition-colors duration-200
      {isResizing ? 'bg-brand/10' : 'group-hover:bg-brand/5'}"
  ></div>
  <!-- Grip indicator on hover -->
  <div
    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200
      {isResizing ? 'opacity-100' : ''}"
  >
    <div class="w-0.5 h-0.5 rounded-full bg-text-subtlest"></div>
    <div class="w-0.5 h-0.5 rounded-full bg-text-subtlest"></div>
    <div class="w-0.5 h-0.5 rounded-full bg-text-subtlest"></div>
  </div>
</div>
