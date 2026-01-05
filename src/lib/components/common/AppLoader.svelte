<script lang="ts">
  import Logo from './Logo.svelte';
</script>

<div class="fixed inset-0 bg-surface flex flex-col items-center justify-center z-50">
  <div class="flex flex-col items-center gap-6">
    <!-- Logo with pulse animation -->
    <div class="animate-pulse">
      <Logo size="lg" showText={false} />
    </div>

    <!-- App name -->
    <h1 class="text-2xl font-bold text-text">
      <span class="hidden sm:inline">JIRA </span>Hierarchy Viewer
    </h1>

    <!-- Loading spinner -->
    <div class="flex items-center gap-3 text-text-subtle">
      <svg
        class="animate-spin h-5 w-5"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span class="text-sm">Loading...</span>
    </div>
  </div>
</div>
