<script lang="ts">
  interface Props {
    message: { type: 'success' | 'error'; text: string } | null;
  }

  let { message }: Props = $props();
</script>

{#if message}
  <div
    class="fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-slide-up
      {message.type === 'success'
      ? 'bg-chart-2 text-primary-foreground'
      : 'bg-destructive text-primary-foreground'}"
  >
    {#if message.type === 'success'}
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    {:else}
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    {/if}
    <span>{message.text}</span>
  </div>
{/if}
