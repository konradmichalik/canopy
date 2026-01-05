<script lang="ts">
  interface Props {
    depth?: number;
  }

  let { depth = 0 }: Props = $props();
</script>

<div
  class="flex items-center gap-3 min-w-0 flex-1 py-2.5 px-2 animate-pulse"
  style="padding-left: {depth * 24 + 8}px"
>
  <!-- Toggle placeholder -->
  <div class="w-6 h-6 flex-shrink-0"></div>

  <!-- Content bar (h-8 matches avatar height) -->
  <div class="flex-1 h-8 rounded bg-neutral min-w-0"></div>
</div>
