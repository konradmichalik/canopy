<script lang="ts">
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
    <!-- Tree structure lines -->
    <path
      d="M16 6 L16 12 M16 12 L8 18 M16 12 L24 18 M8 18 L8 24 M24 18 L24 24 M8 24 L4 28 M8 24 L12 28 M24 24 L20 28 M24 24 L28 28"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      class="text-text-subtle"
    />

    <!-- Root node - Blue -->
    <circle cx="16" cy="5" r="3.5" fill="#2563eb" />

    <!-- Level 2 nodes - Green and Purple -->
    <circle cx="8" cy="18" r="3" fill="#16a34a" />
    <circle cx="24" cy="18" r="3" fill="#9333ea" />

    <!-- Level 3 nodes - Orange, Yellow, Red, Teal -->
    <circle cx="4" cy="28" r="2.5" fill="#ea580c" />
    <circle cx="12" cy="28" r="2.5" fill="#eab308" />
    <circle cx="20" cy="28" r="2.5" fill="#dc2626" />
    <circle cx="28" cy="28" r="2.5" fill="#0d9488" />
  </svg>

  {#if showText}
    <span class="font-bold text-text {textSizeClasses[size]}">
      <span class="hidden sm:inline">JIRA </span>Hierarchy Viewer
    </span>
  {/if}
</div>
