<script lang="ts">
  import AtlaskitIcon from './AtlaskitIcon.svelte';

  interface Props {
    message: { type: 'success' | 'error'; text: string } | null;
  }

  let { message }: Props = $props();
</script>

{#if message}
  <div
    class="fixed bottom-6 right-6 px-3 py-2 rounded-md shadow-sm z-50 flex items-center gap-1.5 animate-slide-up border bg-background text-xs
      {message.type === 'success'
      ? 'border-chart-2 text-chart-2'
      : 'border-destructive text-destructive'}"
  >
    {#if message.type === 'success'}
      <AtlaskitIcon name="check" size={16} />
    {:else}
      <AtlaskitIcon name="cross" size={16} />
    {/if}
    <span>{message.text}</span>
  </div>
{/if}
