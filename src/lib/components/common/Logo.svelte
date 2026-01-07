<script lang="ts">
  import Tooltip from './Tooltip.svelte';

  interface Props {
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
  }

  let { size = 'md', showText = true }: Props = $props();

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };
</script>

<div class="flex items-center gap-2">
  <svg
    class={sizeClasses[size]}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- Vertical connector line -->
    <path
      d="M8 7 L8 26 M8 10 L12 10 M8 18 L12 18 M8 26 L12 26"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      class="text-text-subtle"
    />

    <!-- Root node - subtle blue -->
    <rect x="4" y="2" width="12" height="6" rx="1.5" fill="#3b82f6" />

    <!-- Child node 1 - subtle green -->
    <rect x="14" y="7" width="14" height="6" rx="1.5" fill="#22c55e" />

    <!-- Child node 2 - subtle purple -->
    <rect x="14" y="15" width="14" height="6" rx="1.5" fill="#a855f7" />

    <!-- Child node 3 - subtle orange -->
    <rect x="14" y="23" width="14" height="6" rx="1.5" fill="#f97316" />
  </svg>

  {#if showText}
    <Tooltip content="Hierarchical JIRA Issue Viewer">
      <span class="font-bold text-text {textSizeClasses[size]} cursor-default">
        Canopy
      </span>
    </Tooltip>
  {/if}
</div>
