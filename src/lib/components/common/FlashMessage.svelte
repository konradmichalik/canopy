<script lang="ts">
  import AtlaskitIcon from './AtlaskitIcon.svelte';

  interface Props {
    message: { type: 'success' | 'error'; text: string } | null;
  }

  let { message }: Props = $props();
</script>

{#if message}
  <div
    class="fixed bottom-4 right-4 px-4 py-3 rounded-md shadow-sm z-50 flex items-center gap-2 animate-slide-up border bg-background
      {message.type === 'success'
      ? 'border-chart-2 text-chart-2'
      : 'border-destructive text-destructive'}"
  >
    {#if message.type === 'success'}
      <AtlaskitIcon name="check" size={20} />
    {:else}
      <AtlaskitIcon name="cross" size={20} />
    {/if}
    <span>{message.text}</span>
  </div>
{/if}
